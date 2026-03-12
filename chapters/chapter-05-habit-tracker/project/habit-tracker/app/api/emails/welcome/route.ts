import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const firstName = profile?.name || user.user_metadata?.display_name || "there";

    const { data, error } = await resend.emails.send({
      from: "Habit Tracker <welcome@your-verified-domain.com>",
      to: [user.email!],
      subject: "Welcome to Habit Tracker",
      html: `
        <h2>Welcome, ${firstName}!</h2>
        <p>Thanks for creating your Habit Tracker account.</p>
        <p>You can now add habits, build streaks, and review your progress over time.</p>
        <p>Start small, stay consistent, and let the app keep you accountable.</p>
      `,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Welcome email sent successfully",
      data,
    });
  } catch (error) {
    console.error("Send welcome email error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
