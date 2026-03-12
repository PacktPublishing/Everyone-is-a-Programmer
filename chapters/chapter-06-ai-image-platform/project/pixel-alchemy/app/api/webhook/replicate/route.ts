import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    // 1. verify Webhook Signature (optional)
    const secret = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;
    
    if (!secret) {
      console.log("Skipping webhook validation. To validate webhooks, set REPLICATE_WEBHOOK_SIGNING_SECRET");
    }

    // 2. parse Webhook data
    const body = await request.json();
    const { id: predictionId, status, output, error } = body;

    console.log('Replicate webhook received:', { predictionId, status, output, error });

    const supabase = createServerSupabaseClient();

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
    if (status === 'completed' && output) {
      // Update task status
      await supabase
        .from('generation_tasks')
        .update({
          status: 'completed',
          output_images: output,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      // Save image to user library
      await saveImagesToUserLibrary(task.user_id, task.id, task, output);

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

async function saveImagesToUserLibrary(
  userId: string, 
  taskId: string, 
  task: any, 
  outputImages: string[]
) {
  const supabase = createServerSupabaseClient();
  
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
