import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/notifications/trigger - Trigger message push
export async function POST(request: NextRequest) {
  try {
    const { type, user_id, data } = await request.json();

    // Validate required parameters
    if (!type) {
      return NextResponse.json(
        { success: false, error: "Notification type is required" },
        { status: 400 }
      );
    }

    // If a user ID is specified, send the notification only to that user.
    if (user_id) {
      const result = await sendNotificationToUser(user_id, type, data);
      return NextResponse.json(result);
    }

    // If no user ID is specified, send notifications to all eligible users for this type.
    const result = await sendNotificationToAllUsers(type, data);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Trigger notification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Send notifications to specified users
async function sendNotificationToUser(userId: string, type: string, data?: any) {
  try {
    // Get user notification settings
    const { data: settings } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get user information
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Determine whether to send based on notification type and user settings
    const shouldSend = shouldSendNotification(type, settings);
    
    if (!shouldSend) {
      return { 
        success: true, 
        message: "Notification skipped based on user preferences",
        skipped: true 
      };
    }

    // Send notification
    const result = await sendNotificationByType(user, type, data);
    return result;

  } catch (error) {
    console.error("Send notification to user error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Detailed error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Send notification to all users
async function sendNotificationToAllUsers(type: string, data?: any) {
  try {
    // Get all users who have this type of notification enabled
    const { data: users } = await getEligibleUsers(type);
    
    if (!users || users.length === 0) {
      return { 
        success: true, 
        message: "No eligible users found",
        sent: 0 
      };
    }

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Send notification to each user
    for (const userSettings of users) {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userSettings.user_id);
        
        if (user) {
          const result = await sendNotificationByType(user, type, data);
          if (result.success) {
            successCount++;
          } else {
            failureCount++;
            errors.push({ userId: user.id, error: result.error });
          }
        }
      } catch (error) {
        failureCount++;
        errors.push({ userId: userSettings.user_id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return {
      success: true,
      message: `Notifications sent to ${successCount} users, ${failureCount} failed`,
      sent: successCount,
      failed: failureCount,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error("Send notification to all users error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get eligible users based on notification type
async function getEligibleUsers(type: string) {
  let query = supabase.from("user_notification_settings").select("*");

  switch (type) {
    case "daily_reminder":
      query = query.eq("daily_reminder", true);
      break;
    case "weekly_summary":
      query = query.eq("weekly_summary", true);
      break;
    case "achievement_alert":
      query = query.eq("achievement_alerts", true);
      break;
    case "welcome":
      // The welcome email requires no specific settings and returns to all users
      break;
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }

  return await query;
}

// Determine whether a notification should be sent
function shouldSendNotification(type: string, settings: any) {
  if (!settings) {
    // If not set, use default value
    return true;
  }

  switch (type) {
    case "daily_reminder":
      return settings.daily_reminder;
    case "weekly_summary":
      return settings.weekly_summary;
    case "achievement_alert":
      return settings.achievement_alerts;
    case "welcome":
      return true; // Welcome email is always sent
    default:
      return false;
  }
}

// Send notifications based on type
async function sendNotificationByType(user: any, type: string, data?: any) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    let endpoint = "";
    
    switch (type) {
      case "welcome":
        endpoint = `${baseUrl}/api/emails/welcome`;
        break;
      case "weekly_summary":
        endpoint = `${baseUrl}/api/emails/weekly-summary`;
        break;
      case "daily_reminder":
        endpoint = `${baseUrl}/api/emails/daily-reminder`;
        break;
      case "achievement_alert":
        endpoint = `${baseUrl}/api/emails/achievement-alert`;
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Call the API directly with the service role key; no user session is required.
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        ...data,
        user_id: user.id
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error(`API response error for ${type}:`, {
        status: response.status,
        statusText: response.statusText,
        result
      });
      throw new Error(result.error || result.details || `Failed to send notification (${response.status})`);
    }

    return {
      success: true,
      message: `${type} notification sent successfully`,
      data: result.data
    };

  } catch (error) {
    console.error(`Send ${type} notification error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Detailed ${type} error:`, errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}
