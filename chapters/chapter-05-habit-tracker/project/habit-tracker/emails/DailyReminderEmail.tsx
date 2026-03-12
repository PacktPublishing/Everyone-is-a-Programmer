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

// Define what the component expects to receive props type
interface DailyReminderEmailProps {
  username: string;
  todayHabits: Array<{
    id: string;
    name: string;
    description?: string;
    streak: number;
    isCompleted: boolean;
  }>;
  reminderTime?: string;
}

const DailyReminderEmail = ({
  username,
  todayHabits,
  reminderTime,
}: DailyReminderEmailProps) => {
  const pendingHabits = todayHabits.filter(habit => !habit.isCompleted);
  const completedHabits = todayHabits.filter(habit => habit.isCompleted);
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
          <Heading style={{ color: "#333", textAlign: "center" }}>
            🌅 Good morning, {username}!
          </Heading>
          
          <Text style={{ color: "#555", fontSize: "16px", lineHeight: "1.5" }}>
            A new day has begun! Let’s review today’s habit goals.
          </Text>

          {reminderTime && (
            <Text style={{ color: "#888", fontSize: "14px", fontStyle: "italic" }}>
              Reminder time:{reminderTime}
            </Text>
          )}

          <Hr style={{ margin: "20px 0" }} />

          {/* completed habit */}
          {completedHabits.length > 0 && (
            <>
              <Heading as="h2" style={{ color: "#10b981", fontSize: "18px" }}>
                ✅ completed habit
              </Heading>
              {completedHabits.map((habit, index) => (
                <div key={index} style={{ marginBottom: "10px" }}>
                  <Text style={{ color: "#10b981", margin: "5px 0" }}>
                    <strong>{habit.name}</strong>
                    {habit.streak > 0 && ` | streak: ${habit.streak} day${habit.streak === 1 ? "" : "s"} 🔥`}
                  </Text>
                  {habit.description && (
                    <Text style={{ color: "#666", fontSize: "14px", margin: "0 0 10px 20px" }}>
                      {habit.description}
                    </Text>
                  )}
                </div>
              ))}
              <Hr style={{ margin: "20px 0" }} />
            </>
          )}

          {/* Habits to be completed */}
          {pendingHabits.length > 0 ? (
            <>
              <Heading as="h2" style={{ color: "#f59e0b", fontSize: "18px" }}>
                ⏰ To be completed today
              </Heading>
              {pendingHabits.map((habit, index) => (
                <div key={index} style={{ marginBottom: "15px" }}>
                  <Text style={{ color: "#333", margin: "5px 0" }}>
                    <strong>{habit.name}</strong>
                    {habit.streak > 0 && ` | current streak: ${habit.streak} day${habit.streak === 1 ? "" : "s"}`}
                  </Text>
                  {habit.description && (
                    <Text style={{ color: "#666", fontSize: "14px", margin: "0 0 10px 20px" }}>
                      {habit.description}
                    </Text>
                  )}
                </div>
              ))}
              
              <div style={{ textAlign: "center", margin: "30px 0" }}>
                <Button
                  href={`${appUrl}/habits`}
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Record habits now
                </Button>
              </div>
            </>
          ) : (
            <>
              <Heading as="h2" style={{ color: "#10b981", fontSize: "18px" }}>
                🎉 marvelous!
              </Heading>
              <Text style={{ color: "#10b981", fontSize: "16px" }}>
                All of your habits for today are complete! Keep up the good momentum!
              </Text>
            </>
          )}

          <Hr style={{ margin: "30px 0 20px 0" }} />
          
          <Text style={{ color: "#888", fontSize: "14px", textAlign: "center" }}>
            💪 Every little habit is a step towards a better you
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

export default DailyReminderEmail;
