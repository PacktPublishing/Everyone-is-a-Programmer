# Pixel Alchemy - AI Image Generation Platform

Pixel Alchemy is an AI image generation platform built with Next.js, Supabase, Replicate API, and Stripe. It supports text-to-image, image-to-image, and style transfer workflows.

## Features

- 🎨 **AI image generation**: Supports text-to-image, image-to-image, and style transfer
- 💳 **Credit system**: Usage-based credits model
- 🔐 **User authentication**: Registration, sign-in, and permission management
- 📊 **Analytics**: Usage statistics and credit consumption analysis
- 💰 **Payment integration**: Stripe-powered payments
- 🖼️ **Image management**: Personal gallery and batch actions
- 🔄 **Real-time status**: Live progress updates for image generation

## Technology stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Shadcn/ui
- **Backend**: Next.js API Routes + Supabase
- **Database**: PostgreSQL (Supabase)
- **AI service**: Replicate API (Nano Banana model)
- **Payments**: Stripe
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## quick start

### 1. Clone project

```bash
git clone <repository-url>
cd pixel-alchemy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Copy the environment variable example file:

```bash
cp env.example .env.local
```

edit `.env.local` file, fill in your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Replicate API Configuration
REPLICATE_API_TOKEN=your_replicate_api_token
REPLICATE_WEBHOOK_SIGNING_SECRET=your_replicate_webhook_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Application configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. set up Supabase

#### 4.1 create Supabase Project

1. Visit [Supabase](https://supabase.com) and create new project
2. Get the project URL and API key
3. Update the environment variables Supabase Configuration

#### 4.2 Apply database migration

in Supabase Dashboard in, enter SQL Editor And execute the following migration file:

1. `supabase/migrations/20240101000000_init_core_tables.sql`
2. `supabase/migrations/20240101000001_rls_policies.sql`
3. `supabase/migrations/20240101000002_views_and_functions.sql`

Or use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Log in Supabase
supabase login

# Linked projects
supabase link --project-ref your-project-ref

# Push migration
supabase db push
```

#### 4.3 Configure authentication

In the Supabase Dashboard:

1. Enter Authentication > Settings
2. Configuration Site URL for `http://localhost:3000`
3. Add the redirect URL: `http://localhost:3000/auth/callback`

### 5. set up Replicate API

1. access [Replicate](https://replicate.com) and create an account
2. Get API Token
3. Update environment variables `REPLICATE_API_TOKEN`

### 6. Set up Stripe (optional)

1. Visit [Stripe](https://stripe.com) and create an account
2. Get API key
3. Update the environment variables Stripe Configuration

### 7. Run the development server

```bash
npm run dev
```

access [http://localhost:3000](http://localhost:3000) View the app.

## Project structure

```
pixel_alchemy/
├── app/                    # Next.js App Router
│   ├── api/               # API routing
│   │   ├── generate/      # image generation API
│   │   ├── tasks/         # Task status API
│   │   ├── webhook/       # Webhook deal with
│   │   ├── user/          # User related API
│   │   ├── credits/       # Points related API
│   │   └── images/        # Picture gallery API
│   ├── (auth)/            # Authentication page
│   ├── studio/            # Generate workbench
│   ├── gallery/           # Picture gallery
│   └── profile/           # User Center
├── components/            # React components
├── lib/                   # Tool functions and configuration
│   ├── supabase/          # Supabase client
│   ├── replicate/         # Replicate API client
│   └── types/             # TypeScript type definition
├── supabase/              # Supabase Configuration and migration
│   ├── migrations/        # Database migration file
│   └── config.toml        # Supabase Configuration
└── docs/                  # Project documentation
```

## API document

### image generation

```typescript
// Vincentian picture
POST /api/generate
{
  "taskType": "text_to_image",
  "prompt": "a cute kitten",
  "negativePrompt": "Blurry, low quality",
  "modelConfig": {
    "width": 1024,
    "height": 1024,
    "steps": 20,
    "guidanceScale": 7.5,
    "quality": "standard"
  }
}
```

### Task status query

```typescript
GET /api/tasks/{taskId}
```

### User profile

```typescript
GET /api/user/profile
PUT /api/user/profile
```

### Points balance

```typescript
GET /api/credits/balance
```

### Picture gallery

```typescript
GET /api/images?page=1&limit=20&type=text_to_image
POST /api/images/batch
```

## Database design

### core table

- `user_profiles` - User configuration table
- `generation_tasks` - Image generation task list
- `user_images` - User picture library table
- `credit_transactions` - Points transaction record form
- `orders` - order form
- `stripe_subscriptions` - Stripe Subscription form

### view

- `user_stats` - User statistics view
- `user_statistics` - User detailed statistics view
- `monthly_user_statistics` - monthly statistics view
- `daily_credits_analysis` - Points consumption analysis view
- `generation_type_distribution` - Generate type distribution view

## deploy

### Vercel deploy

1. Push the code to GitHub
2. exist Vercel Import projects in
3. Configure environment variables
4. Deployment

### Environment variable configuration

in Vercel Set the following environment variables in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REPLICATE_API_TOKEN`
- `REPLICATE_WEBHOOK_SIGNING_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## Development Guide

### Add new build type

1. in `lib/replicate/client.ts` Add new generation method in
2. in `app/api/generate/route.ts` Update the integral calculation logic
3. Add the corresponding UI components

### Add new payment method

1. in `app/api/stripe/` Add new payment processing logic to
2. Update the order table structure
3. Add corresponding front-end payment components

### Customize AI model

1. in Replicate Create a custom model in
2. Update `lib/replicate/client.ts` model version in
3. Adjust generation parameters and integral calculation

## Contribute

1. Fork Project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## license

This project uses MIT License - View [LICENSE](LICENSE) File for details.

## support

If you encounter any problems or have questions, please:

1. View [document](docs/)
2. search [Issues](../../issues)
3. create new Issue

---

**Notice**: This is a commercial project. Make sure you comply with all applicable terms of use and privacy requirements.
