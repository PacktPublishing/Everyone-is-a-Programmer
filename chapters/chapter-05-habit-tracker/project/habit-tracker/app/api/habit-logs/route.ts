import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/habit-logs - Get user's habit records
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify user identity
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habit_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('habit_logs')
      .select(`
        *,
        habits!inner(
          id,
          name,
          icon,
          type
        )
      `)
      .eq('habits.user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(limit);

    // According to customIDfilter
    if (habitId) {
      query = query.eq('habit_id', habitId);
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('completed_at', startDate);
    }
    if (endDate) {
      query = query.lte('completed_at', endDate);
    }

    const { data: logs, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get habit logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/habit-logs - Record habit completed
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify user identity
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { habit_id, notes, completed_at } = await request.json();

    if (!habit_id) {
      return NextResponse.json(
        { success: false, error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    // Verify customary ownership
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id')
      .eq('id', habit_id)
      .eq('user_id', user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json(
        { success: false, error: 'Habit not found or access denied' },
        { status: 404 }
      );
    }

    const completedDate = completed_at || new Date().toISOString();
    const dateOnly = completedDate.split('T')[0];

    // Check if it has been recorded today
    const { data: existingLog, error: checkError } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('habit_id', habit_id)
      .gte('completed_at', `${dateOnly}T00:00:00.000Z`)
      .lt('completed_at', `${dateOnly}T23:59:59.999Z`)
      .single();

    if (existingLog) {
      return NextResponse.json(
        { success: false, error: 'Habit already logged for this date' },
        { status: 409 }
      );
    }

    // Create a new habit record
    const { data: log, error } = await supabase
      .from('habit_logs')
      .insert({
        habit_id,
        user_id: user.id,
        completed_at: completedDate,
        notes,
      })
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
      message: 'Habit logged successfully',
      data: log,
    });
  } catch (error) {
    console.error('Create habit log error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}