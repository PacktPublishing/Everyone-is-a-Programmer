import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/client';
import { replicateClient } from '@/lib/replicate/client';

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
    const supabase = createServiceRoleSupabaseClient();
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

    // If the task is still being processed, start with Replicate Get latest status
    if (task.status === 'processing' && task.replicate_prediction_id) {
      try {
        const replicateStatus = await replicateClient.getGenerationStatus(task.replicate_prediction_id);
        
        // Update task status
        if (replicateStatus.status !== task.status) {
          await supabase
            .from('generation_tasks')
            .update({
              status: replicateStatus.status,
              output_images: replicateStatus.output,
              error_message: replicateStatus.error,
              updated_at: new Date().toISOString()
            })
            .eq('id', taskId);

          // If the task is completed, save the image to the user library
          if (replicateStatus.status === 'completed' && replicateStatus.output) {
            await saveImagesToUserLibrary(user.id, taskId, task, replicateStatus.output);
          }
          
          // If the task fails, points will be refunded
          if (replicateStatus.status === 'failed') {
            await refundCreditsForFailedTask(
              supabase,
              user.id,
              taskId,
              task.task_type,
              task.cost_credits,
            );
          }

          // Retrieve updated tasks
          const { data: updatedTask } = await supabase
            .from('generation_tasks')
            .select('*')
            .eq('id', taskId)
            .single();

          return NextResponse.json(updatedTask);
        }
      } catch (error) {
        console.error('Failed to get Replicate status:', error);
      }
    }

    return NextResponse.json(task);

  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

function generateThumbnailUrl(imageUrl: string): string {
  // Thumbnail generation logic can be implemented here
  // Temporarily return to the original image URL
  return imageUrl;
}
