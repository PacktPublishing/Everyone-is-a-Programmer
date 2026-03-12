import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { AchievementAlertEmail } from "../../../../emails/AchievementAlertEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Achievement Type Definition
type AchievementType = 
  | 'streak_milestone'
  | 'habit_completion'
  | 'weekly_goal'
  | 'monthly_goal'
  | 'first_habit'
  | 'consistency'
  | 'comeback';

// POST /api/emails/achievement-alert - Send achievement reminder email
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get request parameters
    const { achievementType, habitId, milestone } = await request.json();

    // Get user information
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Get user notification settings
    const { data: notificationSettings } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Check if achievement reminders are enabled
    if (notificationSettings && !notificationSettings.achievement_alerts) {
      return NextResponse.json({
        success: true,
        message: "Achievement alerts are disabled for this user",
        skipped: true
      });
    }

    // Get achievement-related habit information (if any)
    let habitName = undefined;
    if (habitId) {
      const { data: habit } = await supabase
        .from("habits")
        .select("name")
        .eq("id", habitId)
        .eq("user_id", user.id)
        .single();
      
      habitName = habit?.name;
    }

    // Get user statistics
    const stats = await getUserStats(user.id);

    // Generate achievement information based on achievement type
    const achievement = generateAchievementInfo(
      achievementType || 'habit_completion',
      habitName,
      milestone
    );

    // Send email
    const { data, error } = await resend.emails.send({
      from: "Achievement notification <achievements@your-verified-domain.com>",
      to: [user.email!],
      subject: `🎉 ${profile?.name || "user"}, you have a new achievement!`,
      react: AchievementAlertEmail({
        username: profile?.name || "user",
        achievement,
        stats,
      }),
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Achievement alert email sent successfully",
      data: {
        emailId: data?.id,
        achievementType: achievement.type,
        achievementTitle: achievement.title
      }
    });

  } catch (error) {
    console.error("Achievement alert email error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get user statistics
async function getUserStats(userId: string) {
  try {
    // Get the total number of habits
    const { count: totalHabits } = await supabase
      .from("habits")
      .select("*", { count: 'exact' })
      .eq("user_id", userId)
      .eq("is_active", true);

    // Get the number of habits completed today
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const { count: completedToday } = await supabase
      .from("habit_logs")
      .select("*", { count: 'exact' })
      .eq("user_id", userId)
      .gte("completed_at", todayStart.toISOString())
      .lt("completed_at", todayEnd.toISOString());

    // Calculate the longest consecutive days
    const { data: allLogs } = await supabase
      .from("habit_logs")
      .select("completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    let currentStreak = 0;
    if (allLogs && allLogs.length > 0) {
      // Simplified consecutive days calculation - based oncompleted_atdate
      const dates = allLogs.map(log => new Date(log.completed_at).toISOString().split('T')[0]).sort();
      let streak = 1;
      let maxStreak = 1;
      
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 1;
        }
      }
      currentStreak = maxStreak;
    }

    return {
      totalHabits: totalHabits || 0,
      completedToday: completedToday || 0,
      currentStreak
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return {
      totalHabits: 0,
      completedToday: 0,
      currentStreak: 0
    };
  }
}

// Generate achievement information
function generateAchievementInfo(
  type: AchievementType,
  habitName?: string,
  milestone?: number
) {
  const achievements = {
    streak_milestone: {
      type: 'streak_milestone' as const,
      title: `${milestone || 7}Days in a row completed!`,
      description: `you have been consecutive${milestone || 7}Completed the habit in 1 day, which is an amazing achievement! Persistence is victory!`,
      emoji: '🔥',
      habitName,
      milestone
    },
    habit_completion: {
      type: 'habit_completion' as const,
      title: 'Get used to completing achievements!',
      description: 'Congratulations on completing an important habit goal! Every persistence brings you closer to your ideal self.',
      emoji: '✅',
      habitName
    },
    weekly_goal: {
      type: 'weekly_goal' as const,
      title: 'Weekly goal achieved!',
      description: 'marvelous! You successfully completed your habit goal for this week. Continued efforts are bringing about positive change!',
      emoji: '🎯'
    },
    monthly_goal: {
      type: 'monthly_goal' as const,
      title: 'Monthly goal achieved!',
      description: 'Congratulations on completing the entire month of Habit Challenge! This perseverance is worth celebrating!',
      emoji: '🏆'
    },
    first_habit: {
      type: 'first_habit' as const,
      title: 'The first habit!',
      description: 'Welcome to start your habit-forming journey! Every great change starts with a first step.',
      emoji: '🌱',
      habitName
    },
    consistency: {
      type: 'consistency' as const,
      title: 'Master of consistency!',
      description: 'You demonstrate admirable consistency! Regular habits are the cornerstone of success.',
      emoji: '💪'
    },
    comeback: {
      type: 'comeback' as const,
      title: 'Start again!',
      description: 'Welcome back! It takes courage to start over, and you have taken an important step!',
      emoji: '🎉'
    }
  };

  return achievements[type] || achievements.habit_completion;
}

// GET /api/emails/achievement-alert - Check and trigger achievements
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Check if the user has new achievements
    const achievements = await checkForNewAchievements(user.id);
    
    return NextResponse.json({
      success: true,
      achievements
    });

  } catch (error) {
    console.error("Check achievements error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Check for new achievements
async function checkForNewAchievements(userId: string) {
  const achievements: any[] = [];
  
  try {
    // Check consecutive days achievement
    const streakAchievements = await checkStreakAchievements(userId);
    achievements.push(...streakAchievements);
    
    // Check out other types of achievements...
    // More achievement checking logic can be added here
    
    return achievements;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
  }
}

// Check consecutive days achievement
async function checkStreakAchievements(userId: string) {
  const achievements: any[] = [];
  const milestones = [7, 14, 30, 60, 100]; // Consecutive days milestone
  
  // Get the user's active habits
  const { data: habits } = await supabase
    .from("habits")
    .select("id, name")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!habits) return achievements;

  for (const habit of habits) {
    // Count the number of consecutive days for this habit
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("completed_at")
      .eq("habit_id", habit.id)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(100); // Limit the number of queries

    if (logs && logs.length > 0) {
      let currentStreak = 0;
      const today = new Date();
      
      // Calculate the current number of consecutive days
      for (let i = 0; i < logs.length; i++) {
        const logDate = new Date(logs[i].completed_at);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        if (logDate.toDateString() === expectedDate.toDateString()) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Check if milestones are reached
      for (const milestone of milestones) {
        if (currentStreak === milestone) {
          achievements.push({
            type: 'streak_milestone',
            habitId: habit.id,
            habitName: habit.name,
            milestone,
            triggered: false // Mark as not triggered, need to send email
          });
        }
      }
    }
  }
  
  return achievements;
}
