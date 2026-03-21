import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/client';
import { normalizeReplicateStatus } from '@/lib/replicate/client';
import { validateWebhook } from 'replicate';

export async function POST(request: NextRequest) {
  try {
    // 1. verify Webhook Signature (optional)
    const secret = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;
    
    if (!secret) {
      console.log("Skipping webhook validation. To validate webhooks, set REPLICATE_WEBHOOK_SIGNING_SECRET");
    } else {
      const webhookIsValid = await validateWebhook(request.clone(), secret);

      if (!webhookIsValid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // 2. parse Webhook data
    const body = await request.json();
    const { id: predictionId, status, output, error } = body;
    const normalizedStatus = normalizeReplicateStatus(status);

    console.log('Replicate webhook received:', { predictionId, status, normalizedStatus, output, error });

    const supabase = createServiceRoleSupabaseClient();

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

    if ((normalizedStatus === 'completed' || normalizedStatus === 'failed') && task.status === normalizedStatus) {
      return NextResponse.json({ detail: 'Webhook already processed' }, { status: 200 });
    }

    // 4. Process task results
    if (normalizedStatus === 'completed' && output) {
      // Update task status
      await supabase
        .from('generation_tasks')
        .update({
          status: normalizedStatus,
          output_images: output,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      // Save image to user library
      await saveImagesToUserLibrary(task.user_id, task.id, task, output);

    } else if (normalizedStatus === 'failed' || error) {
      // Handle failure situations
      await supabase
        .from('generation_tasks')
        .update({
          status: normalizedStatus,
          error_message: error || 'Unknown error occurred',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      await refundCreditsForFailedTask(
        supabase,
        task.user_id,
        task.id,
        task.task_type,
        task.cost_credits,
      );
    }

    return NextResponse.json({ detail: "Webhook processed successfully" }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function refundCreditsForFailedTask(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  userId: string,
  taskId: string,
  taskType: string,
  credits: number,
) {
  const { data: existingRefund } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('related_id', taskId)
    .eq('transaction_type', 'refund')
    .maybeSingle();

  if (existingRefund) {
    return;
  }

  const { error: refundError } = await supabase.rpc('update_user_credits', {
    p_user_id: userId,
    p_amount: credits,
    p_type: 'refund',
    p_description: `Refund for failed generation: ${taskType}`,
    p_related_id: taskId,
  });

  if (refundError) {
    console.error('Failed to refund credits for task:', taskId, refundError);
  }
}

async function saveImagesToUserLibrary(
  userId: string, 
  taskId: string, 
  task: any, 
  outputImages: string[]
) {
  const supabase = createServiceRoleSupabaseClient();
  
  for (const imageUrl of outputImages) {
    await supabase
      .from('user_images')
      .insert({
        user_id: userId,
        task_id: taskId,
        image_url: imageUrl,
        thumbnail_url: generateThumbnailUrl(imageUrl),
        prompt: task.prompt,
        negative_prompt: task.negative_prompt,
        generation_type: task.task_type,
        parameters: task.model_config,
        credits_used: task.cost_credits,
        width: task.model_config.width || 1024,
        height: task.model_config.height || 1024
      });
  }
}

function generateThumbnailUrl(imageUrl: string): string {
  // Thumbnail generation logic can be implemented here
  // Temporarily return to the original image URL
  return imageUrl;
}
