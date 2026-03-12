# Chapter 5 Code Reference

This chapter now follows a prompt-first teaching style:

- The book shows prompts, decision points, and short explanatory snippets.
- The repository holds the complete implementation files.

Use the following file paths when the manuscript says, “You can copy the complete, production-ready code for this file directly from our companion GitHub repository.”

## Section 5.2.3 - Database relationships and migrations

- `project/habit-tracker/supabase/migrations/001_initial_schema.sql`

## Section 5.2.5 - Email service implementation

- Welcome email route: `project/habit-tracker/app/api/emails/welcome/route.ts`
- Weekly summary email template: `project/habit-tracker/emails/WeeklySummaryEmail.tsx`
- Weekly summary API route: `project/habit-tracker/app/api/emails/weekly-summary/route.ts`
- Daily reminder route: `project/habit-tracker/app/api/emails/daily-reminder/route.ts`
- Achievement alert route: `project/habit-tracker/app/api/emails/achievement-alert/route.ts`

## Section 5.2.6 - File storage and avatar upload

- Upload route: `project/habit-tracker/app/api/upload/avatar/route.ts`
- Settings page integration: `project/habit-tracker/app/settings/page.tsx`

## Section 5.2.8 - Content management system design

- Content table migration: `project/habit-tracker/supabase/migrations/005_add_content_management.sql`
- Content API route: `project/habit-tracker/app/api/content/route.ts`
- Frontend hook: `project/habit-tracker/hooks/useContent.ts`
- Settings page dynamic labels: `project/habit-tracker/app/settings/page.tsx`
