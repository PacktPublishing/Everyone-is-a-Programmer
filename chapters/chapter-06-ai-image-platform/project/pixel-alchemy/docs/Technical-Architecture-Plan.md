# AI Image Generation Platform Technical Architecture Plan

## 1. System overview

This plan uses a Next.js, Supabase, Stripe, and Vercel stack to build a commercial AI image generation platform. It integrates the Replicate API with the Nano Banana model to support text-to-image generation, single-image editing, and multi-image fusion.

## 2. Technical architecture

### 2.1 Overall architecture diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   front end (Next.js) │    │   rear end (API)     │    │   AI Serve       │
│                 │    │                 │    │                 │
│ - React 19      │◄──►│ - Route Handlers│◄──►│ - Replicate API │
│ - TypeScript    │    │ - Supabase      │    │ - Nano Banana   │
│ - Tailwind CSS  │    │ - Stripe        │    │ - Webhooks      │
│ - Shadcn/ui     │    │ - Redis         │    │                 │
│ - Zustand       │    │ - Bull Queue    │    └─────────────────┘
└─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Storage service       │    │   Deployment platform       │
│                 │    │                 │
│ - Supabase DB   │    │ - Vercel        │
│ - Cloudflare R2 │    │ - Edge Functions│
│ - Redis Cache   │    │ - CDN           │
└─────────────────┘    └─────────────────┘
```

### 2.2 Technology stack detailed description

#### Front-end technology stack
- **frame**: Next.js 15 (App Router)
- **language**: TypeScript
- **UI components**: React 19 + Tailwind CSS + Shadcn/ui
- **Status management**: Zustand
- **routing**: Next.js App Router
- **Build tools**: Turbopack

#### Backend technology stack
- **API frame**: Next.js Route Handlers
- **database**: Supabase (PostgreSQL)
- **cache**: Redis (Upstash)
- **queue**: Bull Queue (Redis-based)
- **storage**: Cloudflare R2
- **Certification**: Supabase Auth

#### Third party services
- **AI Serve**: Replicate API (Nano Banana Model)
- **pay**: Stripe
- **deploy**: Vercel
- **monitor**: Vercel Analytics

## 3. Database design

### 3.1 Core table structure

```sql
-- User table (consisting of Supabase Auth manage)
-- auth.users

-- User configuration table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  credits INTEGER DEFAULT 0,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image generation task list
CREATE TABLE generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  task_type VARCHAR(20) NOT NULL, -- 'text_to_image', 'image_edit', 'image_fusion'
  prompt TEXT NOT NULL,
  model_config JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  replicate_prediction_id VARCHAR(100),
  input_images JSONB, -- Store the input image URL array
  output_images JSONB, -- Store output images URL array
  cost_credits INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User picture library table
CREATE TABLE user_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  task_id UUID REFERENCES generation_tasks(id),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  prompt TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points transaction record form
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'purchase', 'consumption', 'refund'
  amount INTEGER NOT NULL,
  stripe_payment_intent_id VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe Subscription form
CREATE TABLE stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  stripe_subscription_id VARCHAR(100) UNIQUE,
  stripe_customer_id VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.2 Row-level security policy (RLS)

```sql
-- enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own tasks" ON generation_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON generation_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own images" ON user_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON user_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON stripe_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

## 4. Replicate API Integrated design

### 4.1 Task start interface

#### Frontend request example

```typescript
// Vincent picture request
const generateImage = async (prompt: string, options: GenerationOptions) => {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      taskType: 'text_to_image',
      prompt,
      modelConfig: {
        model: 'nano-banana',
        size: options.size || '1024x1024',
        style: options.style || 'photographic',
        quality: options.quality || 'standard'
      }
    })
  });
  
  return response.json();
};

// Single image edit request
const editImage = async (imageUrl: string, prompt: string, options: EditOptions) => {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      taskType: 'image_edit',
      prompt,
      inputImages: [imageUrl],
      modelConfig: {
        model: 'nano-banana',
        denoising_strength: options.denoisingStrength || 0.5,
        ...options
      }
    })
  });
  
  return response.json();
};

// Multi-image fusion request
const fuseImages = async (imageUrls: string[], prompt: string, options: FusionOptions) => {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      taskType: 'image_fusion',
      prompt,
      inputImages: imageUrls,
      modelConfig: {
        model: 'nano-banana',
        fusion_strength: options.fusionStrength || 0.7,
        ...options
      }
    })
  });
  
  return response.json();
};
```

#### Backend interface design

```typescript
// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import { addToQueue } from '@/lib/queue';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user identity
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { taskType, prompt, inputImages, modelConfig } = body;

    // 3. Verify points balance
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    const requiredCredits = getRequiredCredits(taskType, modelConfig);
    if (profile.credits < requiredCredits) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // 4. Create task record
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        task_type: taskType,
        prompt,
        model_config: modelConfig,
        input_images: inputImages || [],
        status: 'pending',
        cost_credits: requiredCredits
      })
      .select()
      .single();

    if (taskError) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // 5. call Replicate API
    const prediction = await replicate.predictions.create({
      version: "19deaef633fd44776c82edf39fd60e95a7250b8ececf11a725229dc75a81f9ca", // Nano Banana
      input: {
        prompt,
        ...modelConfig,
        ...(inputImages && inputImages.length > 0 && { image: inputImages[0] })
      },
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/replicate`,
      webhook_events_filter: ["completed"]
    });

    // 6. Update task status
    await supabase
      .from('generation_tasks')
      .update({ 
        replicate_prediction_id: prediction.id,
        status: 'processing'
      })
      .eq('id', task.id);

    // 7. Add to queue for status monitoring
    await addToQueue('monitor-prediction', {
      taskId: task.id,
      predictionId: prediction.id,
      userId: user.id
    });

    return NextResponse.json({
      taskId: task.id,
      predictionId: prediction.id,
      status: 'processing'
    });

  } catch (error) {
    console.error('Generate image error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getRequiredCredits(taskType: string, modelConfig: any): number {
  const baseCredits = {
    'text_to_image': 10,
    'image_edit': 15,
    'image_fusion': 20
  };
  
  return baseCredits[taskType] || 10;
}
```

### 4.2 Webhook callback interface

```typescript
// app/api/webhook/replicate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateWebhook } from 'replicate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 1. verify Webhook sign
    const secret = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;
    
    if (!secret) {
      console.log("Skipping webhook validation. To validate webhooks, set REPLICATE_WEBHOOK_SIGNING_SECRET");
      const body = await request.json();
      console.log(body);
      return NextResponse.json({ detail: "Webhook received (but not validated)" }, { status: 200 });
    }

    const webhookIsValid = await validateWebhook(request.clone(), secret);

    if (!webhookIsValid) {
      return NextResponse.json({ detail: "Webhook is invalid" }, { status: 401 });
    }

    // 2. parse Webhook data
    const body = await request.json();
    const { id: predictionId, status, output, error } = body;
    const normalizedStatus =
      status === 'succeeded' || status === 'successful' ? 'completed' : status;

    console.log('Replicate webhook received:', {
      predictionId,
      status,
      normalizedStatus,
      output,
      error
    });

    // 3. Find the corresponding task
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('replicate_prediction_id', predictionId)
      .single();

    if (taskError || !task) {
      console.error('Task not found for prediction:', predictionId);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 4. Process task results
    if (normalizedStatus === 'completed' && output) {
      // Upload pictures to Cloudflare R2
      const imageUrls = await uploadImagesToR2(output, task.user_id);
      
      // Update task status
      await supabase
        .from('generation_tasks')
        .update({
          status: normalizedStatus,
          output_images: imageUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      // Save image to user library
      for (const imageUrl of imageUrls) {
        await supabase
          .from('user_images')
          .insert({
            user_id: task.user_id,
            task_id: task.id,
            image_url: imageUrl,
            thumbnail_url: generateThumbnailUrl(imageUrl),
            prompt: task.prompt
          });
      }

      // Points deducted
      await supabase.rpc('update_user_credits', {
        p_user_id: task.user_id,
        p_amount: -task.cost_credits,
        p_type: 'consumption',
        p_description: `Image generation: ${task.task_type}`,
        p_related_id: task.id
      });

      // Send real-time notifications (optional)
      // await sendRealtimeNotification(task.user_id, 'Image generation completed');

    } else if (status === 'failed' || error) {
      // Handle failure situations
      await supabase
        .from('generation_tasks')
        .update({
          status: 'failed',
          error_message: error || 'Unknown error occurred',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      // Return points
      await supabase.rpc('update_user_credits', {
        p_user_id: task.user_id,
        p_amount: task.cost_credits,
        p_type: 'refund',
        p_description: `Refund for failed generation: ${task.task_type}`,
        p_related_id: task.id
      });
    }

    return NextResponse.json({ detail: "Webhook processed successfully" }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function uploadImagesToR2(imageUrls: string[], userId: string): Promise<string[]> {
  // Implement image upload to Cloudflare R2 logic
  // Return the uploaded URL array
  return imageUrls.map(url => {
    // The actual image download and upload logic should be implemented here
    return `https://your-r2-domain.com/images/${userId}/${Date.now()}.png`;
  });
}

function generateThumbnailUrl(imageUrl: string): string {
  // Generate thumbnails URL logic
  return imageUrl.replace('.png', '_thumb.png');
}
```

### 4.3 Task status query interface

```typescript
// app/api/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    
    // Verify user identity
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Query task status
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);

  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## 5. Front-end status management

### 5.1 Zustand Store design

```typescript
// stores/generationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface GenerationTask {
  id: string;
  taskType: 'text_to_image' | 'image_edit' | 'image_fusion';
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputImages?: string[];
  errorMessage?: string;
  createdAt: string;
}

interface GenerationStore {
  tasks: GenerationTask[];
  currentTask: GenerationTask | null;
  isLoading: boolean;
  
  // Actions
  createTask: (taskData: Partial<GenerationTask>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<GenerationTask>) => void;
  setCurrentTask: (task: GenerationTask | null) => void;
  fetchTaskStatus: (taskId: string) => Promise<void>;
  clearTasks: () => void;
}

export const useGenerationStore = create<GenerationStore>()(
  devtools(
    (set, get) => ({
      tasks: [],
      currentTask: null,
      isLoading: false,

      createTask: async (taskData) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify(taskData)
          });

          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.error);
          }

          const newTask: GenerationTask = {
            id: result.taskId,
            taskType: taskData.taskType!,
            prompt: taskData.prompt!,
            status: 'processing',
            createdAt: new Date().toISOString()
          };

          set(state => ({
            tasks: [newTask, ...state.tasks],
            currentTask: newTask,
            isLoading: false
          }));

          return result.taskId;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateTask: (taskId, updates) => {
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
          currentTask: state.currentTask?.id === taskId
            ? { ...state.currentTask, ...updates }
            : state.currentTask
        }));
      },

      setCurrentTask: (task) => {
        set({ currentTask: task });
      },

      fetchTaskStatus: async (taskId) => {
        try {
          const response = await fetch(`/api/tasks/${taskId}`, {
            headers: {
              'Authorization': `Bearer ${await getAuthToken()}`
            }
          });

          const task = await response.json();
          
          if (response.ok) {
            get().updateTask(taskId, task);
          }
        } catch (error) {
          console.error('Failed to fetch task status:', error);
        }
      },

      clearTasks: () => {
        set({ tasks: [], currentTask: null });
      }
    }),
    { name: 'generation-store' }
  )
);

async function getAuthToken(): Promise<string> {
  // from Supabase The client obtains the current session token
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}
```

## 6. Payment system integration

### 6.1 Stripe integrated

```typescript
// app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { credits, priceId } = await request.json();
    
    // Verify user identity
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata: {
        userId: user.id,
        credits: credits.toString()
      }
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 6.2 Stripe Webhook deal with

```typescript
// app/api/webhook/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      
      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session;
        await markOrderStatus(expiredSession, 'expired');
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { orderId, userId, credits } = session.metadata!;

  await supabase.rpc('update_user_credits', {
    p_user_id: userId,
    p_amount: parseInt(credits),
    p_type: 'purchase',
    p_description: `Purchased ${credits} credits`,
    p_related_id: orderId
  });

  await supabase
    .from('orders')
    .update({
      status: 'completed',
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      paid_at: new Date().toISOString()
    })
    .eq('id', orderId);
}

async function markOrderStatus(session: Stripe.Checkout.Session, status: string) {
  const orderId = session.metadata?.orderId;

  if (!orderId) return;

  await supabase
    .from('orders')
    .update({
      status,
      stripe_session_id: session.id
    })
    .eq('id', orderId);
}
```

## 7. Deployment configuration

### 7.1 Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "app/api/webhook/replicate/route.ts": {
      "maxDuration": 30
    },
    "app/api/webhook/stripe/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "REPLICATE_API_TOKEN": "@replicate-api-token",
    "REPLICATE_WEBHOOK_SIGNING_SECRET": "@replicate-webhook-secret",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "STRIPE_WEBHOOK_SECRET": "@stripe-webhook-secret",
    "UPSTASH_REDIS_REST_URL": "@upstash-redis-url",
    "UPSTASH_REDIS_REST_TOKEN": "@upstash-redis-token",
    "R2_ACCESS_KEY_ID": "@r2-access-key",
    "R2_SECRET_ACCESS_KEY": "@r2-secret-key",
    "R2_BUCKET_NAME": "@r2-bucket-name",
    "R2_ENDPOINT": "@r2-endpoint"
  }
}
```

### 7.2 Environment variable configuration

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

REPLICATE_API_TOKEN=your_replicate_api_token
REPLICATE_WEBHOOK_SIGNING_SECRET=your_replicate_webhook_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_ENDPOINT=your_r2_endpoint

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 8. security considerations

### 8.1 API safe
- all API Endpoints are required JWT Certification
- Webhook Endpoint uses signature verification
- Implement rate limiting to prevent abuse
- Input validation and sanitization

### 8.2 Data security
- use Supabase RLS Protect data
- Encrypted storage of sensitive data
- Back up the database regularly
- Monitor abnormal access patterns

### 8.3 Payment security
- use Stripe Process all payments
- Do not store credit card information on the server
- Implementation Webhook Signature verification
- Monitor suspicious transactions

## 9. Performance optimization

### 9.1 Front-end optimization
- use Next.js App Router Code splitting
- Implement lazy loading and optimization of images
- use React.memo Optimize component rendering
- Implemented virtual scrolling to handle large amounts of images

### 9.2 Backend optimization
- use Redis Cache frequently queried data
- Implement database connection pooling
- use Bull Queue Handle asynchronous tasks
- Implementation CDN Accelerate static resources

### 9.3 Monitoring and logging
- use Vercel Analytics Monitor performance
- Implement error tracking and logging
- Monitoring API Response time and error rate
-Set alarm mechanism

## 10. Scalability considerations

### 10.1 Horizontal expansion
- use Vercel Edge Functions auto-expansion
- Implement database read and write separation
- use Redis Cluster processing high concurrency
- Implement load balancing

### 10.2 Function extension
- Support more AI model
- Added picture editing tools
- Implement social features
- Add API Interface for third party use

## 10. development process

### 10.1 local development environment
```bash
# Clone project
git clone <repository-url>
cd img_gen_demo

# Install dependencies
npm install

# Start local Supabase
supabase start

# Start the development server
npm run dev
```

### 10.2 Database migration
```bash
# Create new migration
supabase migration new init

# Application migration
supabase db push
```

### 10.3 Deployment process
```bash
# deploy to Vercel
vercel --prod

# deploy Supabase function
supabase functions deploy

# Set environment variables
vercel env add
```

This technical architecture solution provides a complete and scalable AI Image generation platform solutions covering everything from user authentication to AI All core features of model integration.
