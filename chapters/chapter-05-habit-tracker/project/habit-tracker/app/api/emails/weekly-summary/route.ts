import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { WeeklySummaryEmail } from "../../../../emails/WeeklySummaryEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type HabitLog = {
  habit_id: string;
  completed_at: string;
};

function toDateOnly(value: string) {
  return new Date(value).toISOString().split("T")[0];
}

function calculateCurrentStreak(logs: HabitLog[]) {
  const completedDates = new Set(logs.map((log) => toDateOnly(log.completed_at)));
  const today = new Date();
  let streak = 0;

  for (let offset = 0; offset < 30; offset += 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    const key = date.toISOString().split("T")[0];

    if (!completedDates.has(key)) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    const { data: userHabits, error: habitsError } = await supabase
      .from("habits")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (habitsError) {
      return NextResponse.json(
        { success: false, error: habitsError.message },
        { status: 500 }
      );
    }

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(today.getUTCDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setUTCDate(today.getUTCDate() - 30);

    const { data: habitLogs, error: logsError } = await supabase
      .from("habit_logs")
      .select("habit_id, completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", thirtyDaysAgo.toISOString())
      .order("completed_at", { ascending: false });

    if (logsError) {
      return NextResponse.json(
        { success: false, error: logsError.message },
        { status: 500 }
      );
    }

    const habits = (userHabits ?? []).map((habit) => {
      const logsForHabit = (habitLogs ?? []).filter((log) => log.habit_id === habit.id);
      const completedCount = logsForHabit.filter(
        (log) => new Date(log.completed_at) >= sevenDaysAgo
      ).length;

      return {
        name: habit.name,
        completedCount,
        totalDays: 7,
        streak: calculateCurrentStreak(logsForHabit),
      };
    });

    const { data, error } = await resend.emails.send({
      from: "Habit Tracker <reports@your-verified-domain.com>",
      to: [user.email!],
      subject: `Your Habit Tracker weekly summary`,
      react: WeeklySummaryEmail({
        username: profile?.name || user.user_metadata?.display_name || "there",
        habits,
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
      message: "Weekly summary sent successfully",
      data,
    });
  } catch (error) {
    console.error("Send weekly summary error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
