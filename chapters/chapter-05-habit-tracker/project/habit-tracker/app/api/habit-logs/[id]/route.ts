import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify user identity and permissions
async function validateUserAndLog(request: NextRequest, logId: string) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { error: 'No token provided', status: 401 };
  }

  // Verify user identity
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return { error: 'Invalid token', status: 401 };
  }

  // Verify record ownership
  const { data: log, error: logError } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('id', logId)
    .eq('user_id', user.id)
    .single();

  if (logError || !log) {
    return { error: 'Log not found or access denied', status: 404 };
  }

  return { user, log };
}

// GET /api/habit-logs/[id] - Get a single habit record
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const logId = params.id;
    const result = await validateUserAndLog(request, logId);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.log,
    });
  } catch (error) {
    console.error('Get habit log error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/habit-logs/[id] - Update habit record
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const logId = params.id;
    const result = await validateUserAndLog(request, logId);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { notes, completed_at } = await request.json();
    
    // Update record
    const { data: updatedLog, error } = await supabase
      .from('habit_logs')
      .update({
        notes,
        completed_at,
        updated_at: new Date(),
      })
      .eq('id', logId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Habit log updated successfully',
      data: updatedLog,
    });
  } catch (error) {
    console.error('Update habit log error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/habit-logs/[id] - Delete habit record
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const logId = params.id;
    const result = await validateUserAndLog(request, logId);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    // delete record
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Habit log deleted successfully',
    });
  } catch (error) {
    console.error('Delete habit log error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}