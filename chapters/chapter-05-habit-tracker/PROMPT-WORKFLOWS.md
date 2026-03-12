# Chapter 5 Prompt Workflows

These prompts are designed to replace long code listings in the manuscript. Readers can paste them into Cursor, Trae SOLO, or another coding assistant, then compare the generated result with the complete reference code in this repository.

## Welcome email route

> Create `app/api/emails/welcome/route.ts` in a Next.js App Router project. Use `resend` to send a transactional welcome email after verifying the current user from a Supabase bearer token. Fetch the user's display name from `user_profiles`, return JSON responses with correct 401 and 500 status codes, and keep the implementation production-ready.

## Weekly summary email template

> Create `emails/WeeklySummaryEmail.tsx` using `@react-email/components`. The component should accept `username` and a list of habit summaries. For each habit, show the weekly completion count out of 7 days and the current streak. Use clean, readable email styling and include an empty state when there are no active habits.

## Weekly summary API route

> Create `app/api/emails/weekly-summary/route.ts` for a Next.js App Router project. Verify the user from a Supabase bearer token, load the user's active habits, query the last 30 days of `habit_logs`, calculate weekly completion counts and the current streak for each habit, then send a React email through Resend using `WeeklySummaryEmail.tsx`.

## Avatar upload route

> Create `app/api/upload/avatar/route.ts`. It should read a multipart form upload with `request.formData()`, verify the current user with Supabase Auth, validate that the uploaded file is an image under 5 MB, upload it to Cloudflare R2 with the AWS S3 client, update `user_profiles.avatar_url`, and return the public file URL as JSON.

## Avatar upload front-end integration

> Update `app/settings/page.tsx` so the profile card includes an avatar preview, a hidden file input, a camera button that opens the file picker, and a `handleAvatarUpload` function. The function should validate the selected image, send it to `/api/upload/avatar` with the user's bearer token, update local state with the returned URL, and surface friendly success or error messages.

## Content management migration

> Create a Supabase migration file that adds an `app_content` table with `key`, `value`, `category`, `created_at`, and `updated_at` columns. Enable RLS, create a trigger to maintain `updated_at`, and seed a few settings-related content rows such as page title, profile section title, and notifications section title.

## Content management API route

> Create `app/api/content/route.ts` with `GET` and `PUT` handlers in a Next.js App Router project. `GET` should return a key-value map for a given content category. `PUT` should verify the user from a Supabase bearer token, upsert a content record into `app_content`, and return structured JSON responses.

## Front-end content hook

> Create `hooks/useContent.ts` as a lightweight React hook that fetches `/api/content?category=settings`, stores the result in local state, exposes `{ content, loading }`, and fails gracefully if the request cannot be completed.
