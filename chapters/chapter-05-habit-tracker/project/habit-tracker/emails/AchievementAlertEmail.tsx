import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Button,
} from "@react-email/components";
import * as React from "react";

// Define achievement type
type AchievementType = 
  | 'streak_milestone' // Consecutive days milestone
  | 'habit_completion' // habit completion
  | 'weekly_goal' // Weekly goal achieved
  | 'monthly_goal' // Monthly goal achieved
  | 'first_habit' // first habit
  | 'consistency' // consistency achievement
  | 'comeback'; // Start over

//Define what the component expects to receive props type
interface AchievementAlertEmailProps {
  username: string;
  achievement: {
    type: AchievementType;
    title: string;
    description: string;
    habitName?: string;
    milestone?: number;
    emoji?: string;
  };
  stats?: {
    totalHabits: number;
    completedToday: number;
    currentStreak: number;
  };
}

// Obtain achievements corresponding toemojiand color
function getAchievementStyle(type: AchievementType) {
  const styles = {
    streak_milestone: { emoji: '🔥', color: '#f59e0b', bgColor: '#fef3c7' },
    habit_completion: { emoji: '✅', color: '#10b981', bgColor: '#d1fae5' },
    weekly_goal: { emoji: '🎯', color: '#8b5cf6', bgColor: '#ede9fe' },
    monthly_goal: { emoji: '🏆', color: '#f59e0b', bgColor: '#fef3c7' },
    first_habit: { emoji: '🌱', color: '#10b981', bgColor: '#d1fae5' },
    consistency: { emoji: '💪', color: '#3b82f6', bgColor: '#dbeafe' },
    comeback: { emoji: '🎉', color: '#ec4899', bgColor: '#fce7f3' }
  };
  return styles[type] || styles.habit_completion;
}

export const AchievementAlertEmail = ({
  username,
  achievement,
  stats,
}: AchievementAlertEmailProps) => {
  const style = getAchievementStyle(achievement.type);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <Html>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f6f9fc" }}>
        <Container
          style={{
            border: "1px solid #eee",
            borderRadius: "5px",
            padding: "20px",
            margin: "40px auto",
            backgroundColor: "#ffffff",
            maxWidth: "600px",
          }}
        >
          {/* achievement title */}
          <div style={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: style.bgColor,
            borderRadius: "8px",
            marginBottom: "20px"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>
              {achievement.emoji || style.emoji}
            </div>
            <Heading style={{ 
              color: style.color, 
              margin: "0",
              fontSize: "24px"
            }}>
              Congratulations, {username}!
            </Heading>
          </div>

          {/* Achievement details */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <Heading as="h2" style={{ 
              color: "#333", 
              fontSize: "20px",
              margin: "0 0 10px 0"
            }}>
              {achievement.title}
            </Heading>
            <Text style={{ 
              color: "#666", 
              fontSize: "16px",
              lineHeight: "1.5",
              margin: "0"
            }}>
              {achievement.description}
            </Text>
          </div>

          {/* Custom name (if any) */}
          {achievement.habitName && (
            <div style={{
              textAlign: "center",
              padding: "15px",
              backgroundColor: "#f8fafc",
              borderRadius: "6px",
              marginBottom: "20px"
            }}>
              <Text style={{ 
                color: "#374151", 
                fontSize: "16px",
                fontWeight: "bold",
                margin: "0"
              }}>
                Habit:{achievement.habitName}
              </Text>
              {achievement.milestone && (
                <Text style={{ 
                  color: style.color, 
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "5px 0 0 0"
                }}>
                  {achievement.milestone} Days in a row completed!
                </Text>
              )}
            </div>
          )}

          <Hr style={{ margin: "30px 0" }} />

          {/* Statistics */}
          {stats && (
            <div style={{ marginBottom: "30px" }}>
              <Heading as="h3" style={{ 
                color: "#374151", 
                fontSize: "16px",
                textAlign: "center",
                marginBottom: "15px"
              }}>
                📊 your habit statistics
              </Heading>
              <div style={{
                display: "flex",
                justifyContent: "space-around",
                textAlign: "center",
                padding: "15px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px"
              }}>
                <div>
                  <Text style={{ 
                    color: "#6b7280", 
                    fontSize: "12px",
                    margin: "0 0 5px 0"
                  }}>
                    total number of habits
                  </Text>
                  <Text style={{ 
                    color: "#374151", 
                    fontSize: "18px",
                    fontWeight: "bold",
                    margin: "0"
                  }}>
                    {stats.totalHabits}
                  </Text>
                </div>
                <div>
                  <Text style={{ 
                    color: "#6b7280", 
                    fontSize: "12px",
                    margin: "0 0 5px 0"
                  }}>
                    Completed today
                  </Text>
                  <Text style={{ 
                    color: "#10b981", 
                    fontSize: "18px",
                    fontWeight: "bold",
                    margin: "0"
                  }}>
                    {stats.completedToday}
                  </Text>
                </div>
                <div>
                  <Text style={{ 
                    color: "#6b7280", 
                    fontSize: "12px",
                    margin: "0 0 5px 0"
                  }}>
                    longest continuous
                  </Text>
                  <Text style={{ 
                    color: "#f59e0b", 
                    fontSize: "18px",
                    fontWeight: "bold",
                    margin: "0"
                  }}>
                    {stats.currentStreak}
                  </Text>
                </div>
              </div>
            </div>
          )}

          {/* Encouragement text */}
          <div style={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: "#f0fdf4",
            borderRadius: "6px",
            marginBottom: "30px"
          }}>
            <Text style={{ 
              color: "#166534", 
              fontSize: "16px",
              fontWeight: "500",
              margin: "0"
            }}>
              🌟 Persistence is victory! Every little progress is worth celebrating!
            </Text>
          </div>

          {/* action button */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <Button
              href={`${appUrl}/habits`}
              style={{
                backgroundColor: style.color,
                color: "white",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "bold",
                marginRight: "10px"
              }}
            >
              View my habits
            </Button>
            <Button
              href={`${appUrl}/history`}
              style={{
                backgroundColor: "#6b7280",
                color: "white",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              View history
            </Button>
          </div>

          <Hr style={{ margin: "30px 0 20px 0" }} />
          
          <Text style={{ 
            color: "#888", 
            fontSize: "14px", 
            textAlign: "center",
            fontStyle: "italic"
          }}>
            💫 "Success is not the end, failure is not the end, the courage to continue moving forward is the most valuable."
          </Text>
          
          <Text style={{ 
            marginTop: "20px", 
            color: "#888", 
            fontSize: "12px", 
            textAlign: "center" 
          }}>
            From your habit tracker | 
            <a href={`${appUrl}/settings`} style={{ color: "#10b981" }}>
              Manage notification settings
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
