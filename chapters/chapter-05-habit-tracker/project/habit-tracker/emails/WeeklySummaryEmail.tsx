import {
  Body,
  Container,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface HabitSummary {
  name: string;
  completedCount: number;
  totalDays: number;
  streak: number;
}

interface WeeklySummaryEmailProps {
  username: string;
  habits: HabitSummary[];
}

export const WeeklySummaryEmail = ({
  username,
  habits,
}: WeeklySummaryEmailProps) => (
  <Html>
    <Preview>Your weekly habit summary is ready.</Preview>
    <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6f9fc" }}>
      <Container
        style={{
          maxWidth: "560px",
          margin: "40px auto",
          padding: "32px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
        }}
      >
        <Heading style={{ color: "#111827", marginBottom: "8px" }}>
          Hi {username}, here’s your weekly habit summary.
        </Heading>
        <Text style={{ color: "#4b5563", marginTop: 0 }}>
          You made progress this week. Review your streaks, celebrate small wins, and pick one habit to improve next week.
        </Text>
        <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

        {habits.length === 0 ? (
          <Text style={{ color: "#4b5563" }}>
            You do not have any active habits yet. Create your first habit and this summary will start tracking your weekly progress.
          </Text>
        ) : (
          habits.map((habit) => (
            <Section
              key={habit.name}
              style={{
                padding: "16px",
                marginBottom: "12px",
                backgroundColor: "#f9fafb",
                borderRadius: "10px",
              }}
            >
              <Text style={{ margin: 0, fontWeight: 700, color: "#111827" }}>
                {habit.name}
              </Text>
              <Text style={{ margin: "8px 0 0", color: "#374151" }}>
                Completed {habit.completedCount} of {habit.totalDays} check-ins this week.
              </Text>
              <Text style={{ margin: "4px 0 0", color: "#374151" }}>
                Current streak: {habit.streak} day{habit.streak === 1 ? "" : "s"}
                {habit.completedCount >= 5 ? " 🎉" : ""}
              </Text>
            </Section>
          ))
        )}

        <Text style={{ marginTop: "24px", color: "#6b7280", fontSize: "12px" }}>
          Sent by Habit Tracker.
        </Text>
      </Container>
    </Body>
  </Html>
);
