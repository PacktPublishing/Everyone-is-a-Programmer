import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/client';
import { replicateClient } from '@/lib/replicate/client';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user identity
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

    // 2. Parse request body
    const body = await request.json();
    const { 
      taskType, 
      prompt, 
      negativePrompt, 
      inputImages, 
      modelConfig 
    } = body;

    // 3. Verify points balance
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const requiredCredits = getRequiredCredits(taskType, modelConfig);
    if (profile.credits < requiredCredits) {
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        required: requiredCredits,
        available: profile.credits 
      }, { status: 402 });
    }

    // 4. Create task record
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .insert({
        user_id: user.id,
        task_type: taskType,
        prompt,
        negative_prompt: negativePrompt,
        model_config: modelConfig,
        input_images: inputImages || [],
        status: 'pending',
        cost_credits: requiredCredits
      })
      .select()
      .single();

    if (taskError) {
      console.error('Failed to create task:', taskError);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    const { data: creditsConsumed, error: consumeCreditsError } = await supabase.rpc('consume_user_credits', {
      p_user_id: user.id,
      p_amount: requiredCredits,
      p_related_id: task.id,
      p_description: `Image generation: ${taskType}`,
    });

    if (consumeCreditsError) {
      console.error('Failed to consume user credits:', consumeCreditsError);

      await supabase
        .from('generation_tasks')
        .update({
          status: 'failed',
          error_message: 'Failed to reserve credits for this task',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      return NextResponse.json({ error: 'Failed to reserve credits' }, { status: 500 });
    }

    if (!creditsConsumed) {
      await supabase
        .from('generation_tasks')
        .update({
          status: 'failed',
          error_message: 'Insufficient credits',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      return NextResponse.json({
        error: 'Insufficient credits',
        required: requiredCredits,
        available: profile.credits,
      }, { status: 402 });
    }

    // 5. call Replicate API
    const replicateParams = {
      prompt,
      negativePrompt,
      width: modelConfig.width || 1024,
      height: modelConfig.height || 1024,
      steps: modelConfig.steps || 20,
      guidanceScale: modelConfig.guidanceScale || 7.5,
      seed: modelConfig.seed,
      inputImage: inputImages?.[0],
      denoisingStrength: modelConfig.denoisingStrength
    };

    let prediction;

    try {
      prediction = await replicateClient.generateImage(replicateParams);
    } catch (error) {
      console.error('Failed to start Replicate generation:', error);

      await refundCreditsForFailedTask(
        supabase,
        user.id,
        task.id,
        task.task_type,
        task.cost_credits,
      );

      await supabase
        .from('generation_tasks')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Failed to start image generation',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      return NextResponse.json({ error: 'Failed to start image generation' }, { status: 500 });
    }

    // 6. Update task status
    await supabase
      .from('generation_tasks')
      .update({ 
        replicate_prediction_id: prediction.id,
        status: 'processing'
      })
      .eq('id', task.id);

    return NextResponse.json({
      taskId: task.id,
      predictionId: prediction.id,
      status: 'processing',
      requiredCredits
    });

  } catch (error) {
    console.error('Generate image error:', error);
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

function getRequiredCredits(taskType: string, modelConfig: any): number {
  const baseCredits = {
    'text_to_image': 10,
    'image_edit': 15,
    'image_fusion': 20
  };
  
  let credits = baseCredits[taskType as keyof typeof baseCredits] || 10;
  
  // Adjust integration based on resolution and quality
  const width = modelConfig.width || 1024;
  const height = modelConfig.height || 1024;
  const resolution = width * height;
  
  if (resolution > 1024 * 1024) {
    credits += 5; // High resolution extra cost
  }
  
  if (modelConfig.quality === 'high') {
    credits += 3; // High quality extra cost
  }
  
  return credits;
}
