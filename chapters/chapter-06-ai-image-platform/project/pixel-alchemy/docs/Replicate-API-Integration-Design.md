# Replicate API Integrated front-end and back-end communication interface design

## 1. Task start interface

### 1.1 Frontend request example

#### Vincent picture request
```typescript
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
```

#### Single image edit request
```typescript
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
```

#### Multi-image fusion request
```typescript
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

### 1.2 Backend interface design

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

## 2. Webhook callback interface

### 2.1 Webhook processing logic

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

### 2.2 Webhook data structure

#### Replicate sent Webhook Data format
```json
{
  "id": "ufawqhfynnddngldkgtslldrkq",
  "version": "19deaef633fd44776c82edf39fd60e95a7250b8ececf11a725229dc75a81f9ca",
  "urls": {
    "get": "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq",
    "cancel": "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel"
  },
  "status": "completed",
  "input": {
    "prompt": "a beautiful sunset over the ocean",
    "size": "1024x1024",
    "style": "photographic"
  },
  "output": [
    "https://replicate.delivery/pbxt/4kC1XvW19jc9G2oKqLRCH2cdUYLaRc1S0uPmxs0IYeQobd8E/out-0.png"
  ],
  "error": null,
  "logs": null,
  "metrics": {
    "predict_time": 12.5
  },
  "created_at": "2024-01-15T10:30:00.000Z",
  "started_at": "2024-01-15T10:30:05.000Z",
  "completed_at": "2024-01-15T10:30:17.500Z"
}
```

#### of failure Webhook Data format
```json
{
  "id": "ufawqhfynnddngldkgtslldrkq",
  "version": "19deaef633fd44776c82edf39fd60e95a7250b8ececf11a725229dc75a81f9ca",
  "status": "failed",
  "input": {
    "prompt": "invalid prompt",
    "size": "1024x1024"
  },
  "output": null,
  "error": "Invalid prompt format",
  "logs": "Error: Invalid prompt format\nTraceback (most recent call last):\n...",
  "created_at": "2024-01-15T10:30:00.000Z",
  "started_at": "2024-01-15T10:30:05.000Z",
  "completed_at": "2024-01-15T10:30:06.000Z"
}
```

## 3. Task status query interface

### 3.1 Status query interface

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

### 3.2 Frontend polling for status updates

```typescript
// hooks/useTaskStatus.ts
import { useState, useEffect } from 'react';
import { useGenerationStore } from '@/stores/generationStore';

export const useTaskStatus = (taskId: string) => {
  const [isPolling, setIsPolling] = useState(false);
  const { updateTask } = useGenerationStore();

  const pollTaskStatus = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (response.ok) {
        const task = await response.json();
        updateTask(taskId, task);
        
        // Stop polling if task completes or fails
        if (task.status === 'completed' || task.status === 'failed') {
          setIsPolling(false);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to poll task status:', error);
    }
  };

  useEffect(() => {
    if (taskId && !isPolling) {
      setIsPolling(true);
      const interval = setInterval(pollTaskStatus, 2000); // Poll every 2 seconds
      
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  }, [taskId, isPolling]);

  return { isPolling };
};
```

## 4. Error handling mechanism

### 4.1 Error type definition

```typescript
// types/errors.ts
export enum GenerationErrorType {
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  INVALID_PROMPT = 'INVALID_PROMPT',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface GenerationError {
  type: GenerationErrorType;
  message: string;
  details?: any;
  retryable: boolean;
}
```

### 4.2 Error handling logic

```typescript
// utils/errorHandler.ts
import { GenerationError, GenerationErrorType } from '@/types/errors';

export function handleGenerationError(error: any): GenerationError {
  if (error.message?.includes('Insufficient credits')) {
    return {
      type: GenerationErrorType.INSUFFICIENT_CREDITS,
      message: 'Not enough points, please buy more points',
      retryable: false
    };
  }

  if (error.message?.includes('Invalid prompt')) {
    return {
      type: GenerationErrorType.INVALID_PROMPT,
      message: 'The prompt word format is invalid, please check your input',
      retryable: true
    };
  }

  if (error.message?.includes('timeout')) {
    return {
      type: GenerationErrorType.TIMEOUT_ERROR,
      message: 'Request timed out, please try again later',
      retryable: true
    };
  }

  return {
    type: GenerationErrorType.UNKNOWN_ERROR,
    message: 'An unknown error occurred, please try again later',
    retryable: true
  };
}
```

## 5. security considerations

### 5.1 Webhook verify

```typescript
// utils/webhookValidation.ts
import { validateWebhook } from 'replicate';

export async function validateReplicateWebhook(
  request: Request,
  secret: string
): Promise<boolean> {
  try {
    return await validateWebhook(request.clone(), secret);
  } catch (error) {
    console.error('Webhook validation error:', error);
    return false;
  }
}
```

### 5.2 rate limit

```typescript
// middleware/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(
  request: NextRequest,
  userId: string,
  limit: number = 10,
  window: number = 60
): Promise<boolean> {
  const key = `rate_limit:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  return current <= limit;
}
```

This interface design provides a complete Replicate API Integrated solutions, including task launch,Webhook Core functions such as processing, status query, and error handling.
