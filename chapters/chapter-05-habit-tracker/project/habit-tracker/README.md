# Habit Tracker

This is the Chapter 5 companion project for *Everyone is a Programmer*.

The app demonstrates a prompt-first, full-stack workflow for building a habit tracker with Next.js, Supabase, Resend, and Cloudflare R2. In the book, long code listings can be replaced with prompts and short explanatory snippets; this repository contains the complete implementation files readers can study or copy.

## Features

- Habit creation, editing, and soft deletion
- Daily check-ins and streak tracking
- Email/password authentication with Supabase Auth
- Welcome, daily reminder, weekly summary, and achievement emails
- Avatar upload to Cloudflare R2
- Content management through the `app_content` table
- Responsive UI for desktop and mobile

## Tech stack

- Next.js 14 + React 18 + TypeScript
- Tailwind CSS + Headless UI
- Zustand for client state
- Supabase for Postgres, Auth, and realtime features
- Resend + React Email for email delivery
- Cloudflare R2 for avatar storage
- Vercel for deployment

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_REGION=auto

RESEND_API_KEY=your_resend_api_key
```

### 3. Apply database migrations

Run the SQL files in `supabase/migrations/` in order, or use the Supabase CLI.

### 4. Start the app

```bash
npm run dev
```

## Chapter 5 code references

These are the main files the book can reference instead of printing full listings:

- `app/api/emails/welcome/route.ts`
- `emails/WeeklySummaryEmail.tsx`
- `app/api/emails/weekly-summary/route.ts`
- `app/api/upload/avatar/route.ts`
- `app/settings/page.tsx`
- `app/api/content/route.ts`
- `hooks/useContent.ts`
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/005_add_content_management.sql`

For a chapter-level map and prompt-first workflow notes, see:

- `../../CODE-REFERENCE.md`
- `../../PROMPT-WORKFLOWS.md`


## Companion docs

- Project docs index: `docs/README.md`
- Product requirements: `docs/Product-Requirements-Document.md`
- Technical architecture: `docs/Technical-Architecture-Document.md`
