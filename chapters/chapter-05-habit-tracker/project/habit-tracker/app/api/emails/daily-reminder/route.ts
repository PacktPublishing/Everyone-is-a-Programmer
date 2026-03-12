import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import DailyReminderEmail from "../../../../emails/DailyReminderEmail";

// Create admin client for service role operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/emails/daily-reminder - Send daily reminder emails
export async function POST(request: NextRequest) {
  try {
    let user;
    let userId;
    
    // Check if using service role key authentication
    const authHeader = request.headers.get('authorization');
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (authHeader && authHeader === `Bearer ${serviceRoleKey}`) {
      // Service role authentication - get user_id from request body
      const body = await request.json();
      userId = body.user_id;
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Missing user_id in request body for service role authentication' },
          { status: 400 }
        );
      }
      
      // Use admin client to get user by ID
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      user = userData.user;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Regular user token authentication
      const token = authHeader.split(' ')[1];
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      user = authUser;
      userId = user.id;
    } else {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Use appropriate client based on authentication method
    const dbClient = authHeader && authHeader === `Bearer ${serviceRoleKey}` ? supabaseAdmin : supabase;

    // Get user information
    const { data: profile } = await dbClient
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Get user notification settings
    const { data: notificationSettings } = await dbClient
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Check if daily reminders are enabled
    if (notificationSettings && !notificationSettings.daily_reminder) {
      return NextResponse.json({
        success: true,
        message: "Daily reminder is disabled for this user",
        skipped: true
      });
    }

    // Get user habits
    const { data: habits, error: habitsError } = await dbClient
      .from("habits")
      .select(`
        id,
        name,
        frequency,
        created_at
      `)
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (habitsError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch habits" },
        { status: 500 }
      );
    }

    if (!habits || habits.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active habits found for user",
        skipped: true
      });
    }

    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Get today's habit record
    const { data: todayLogs } = await dbClient
      .from("habit_logs")
      .select("habit_id, completed_at")
      .eq("user_id", userId)
      .gte("completed_at", todayStart.toISOString())
      .lt("completed_at", todayEnd.toISOString());

    // Count the number of consecutive days for each habit
    const habitsWithStreaks = await Promise.all(
      habits.map(async (habit) => {
        // Get all records of this habit, in reverse order of completion time
        const { data: logs } = await dbClient
          .from("habit_logs")
          .select("completed_at")
          .eq("habit_id", habit.id)
          .eq("user_id", userId)
          .order("completed_at", { ascending: false });

        // Count consecutive days - simplified version, just count the total number of records as"consecutive days"
        let streak = 0;
        if (logs && logs.length > 0) {
          // Get the records of the last 7 days to calculate the number of consecutive days
          const recentLogs = logs.slice(0, 7);
          const today = new Date();
          
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const checkDateStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
            const checkDateEnd = new Date(checkDateStart);
            checkDateEnd.setDate(checkDateEnd.getDate() + 1);
            
            const hasLogForDay = logs.some(log => {
              const logDate = new Date(log.completed_at);
              return logDate >= checkDateStart && logDate < checkDateEnd;
            });
            
            if (hasLogForDay) {
              streak++;
            } else {
              break;
            }
          }
        }

        // Check if it has been completed today
        const todayLog = todayLogs?.find(log => log.habit_id === habit.id);
        const isCompleted = !!todayLog;

        return {
          id: habit.id,
          name: habit.name,
          description: '', // Temporarily empty because this field does not exist in the database
          streak,
          isCompleted
        };
      })
    );

    // Filter out the habits you need to perform today (based on frequency)
    const todayHabits = habitsWithStreaks.filter(habit => {
      const habitData = habits.find(h => h.id === habit.id);
      if (!habitData?.frequency) return true; // Default daily
      
      const frequency = habitData.frequency;
      if (frequency.type === 'daily') return true;
      
      if (frequency.type === 'weekly' && frequency.days) {
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
        return frequency.days.includes(dayOfWeek);
      }
      
      return true; // Included by default
    });

    if (todayHabits.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No habits scheduled for today",
        skipped: true
      });
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: "Habit reminder <onboarding@resend.dev>", // useResendtest domain name
      to: [user.email!],
      subject: `🌅 ${profile?.name || "user"}, a new day has begun!`,
      text: `Good morning, ${profile?.name || "user"}!

A new day has begun! Let’s review today’s habit goals.

Today’s habits:
${todayHabits.map(h => `${h.isCompleted ? '✅' : '⏰'} ${h.name}${h.streak > 0 ? ` (continuous${h.streak}sky)` : ''}`).join('\n')}

${todayHabits.filter(h => !h.isCompleted).length > 0 ? 
  `besides ${todayHabits.filter(h => !h.isCompleted).length} This habit needs to be completed, keep up the good work!` : 
  'marvelous! All habits for today are complete!'
}

💪 Every little habit is a step towards a better you

From your habit tracker`,
    });

    if (error) {
      console.error("Resend email error:", error);
      return NextResponse.json(
        { success: false, error: `Email sending failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Daily reminder email sent successfully",
      data: {
        emailId: data?.id,
        habitsCount: todayHabits.length,
        completedCount: todayHabits.filter(h => h.isCompleted).length,
        pendingCount: todayHabits.filter(h => !h.isCompleted).length
      }
    });

  } catch (error) {
    console.error("Daily reminder email error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
