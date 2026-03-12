import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/stats - Get user statistics
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
    const period = searchParams.get('period') || '30'; // Default 30 days
    const habitId = searchParams.get('habit_id');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get the user’s active habits
    let habitsQuery = supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (habitId) {
      habitsQuery = habitsQuery.eq('id', habitId);
    }

    const { data: habits, error: habitsError } = await habitsQuery;

    if (habitsError) {
      return NextResponse.json(
        { success: false, error: habitsError.message },
        { status: 400 }
      );
    }

    if (!habits || habits.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalHabits: 0,
          completedToday: 0,
          completionRate: 0,
          streaks: [],
          weeklyStats: [],
          monthlyStats: [],
        },
      });
    }

    // Get records within a specified time period
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_at', startDateStr)
      .in('habit_id', habits.map(h => h.id));

    if (logsError) {
      return NextResponse.json(
        { success: false, error: logsError.message },
        { status: 400 }
      );
    }

    // Calculate today’s completion status
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs?.filter(log => 
      log.completed_at && typeof log.completed_at === 'string' && log.completed_at.startsWith(today)
    ) || [];

    // Count the number of consecutive days for each habit
    const streaks = await Promise.all(
      habits.map(async (habit) => {
        const { data: streakData, error: streakError } = await supabase
          .rpc('get_habit_streak', { habit_id_param: habit.id });
        
        return {
          habitId: habit.id,
          habitName: habit.name,
          habitIcon: habit.icon,
          streak: streakData || 0,
        };
      })
    );

    // Calculate weekly statistics (last 7 days)
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = logs?.filter(log => 
        log.completed_at && typeof log.completed_at === 'string' && log.completed_at.startsWith(dateStr)
      ) || [];
      
      weeklyStats.push({
        date: dateStr,
        completed: dayLogs.length,
        total: habits.length,
        completionRate: habits.length > 0 ? (dayLogs.length / habits.length) * 100 : 0,
      });
    }

    // Calculate monthly statistics (last 30 days, grouped by week)
    const monthlyStats = [];
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (week * 7 + 6));
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (week * 7));
      
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      const weekLogs = logs?.filter(log => {
        if (!log.completed_at || typeof log.completed_at !== 'string') return false;
        try {
          const logDate = log.completed_at.split('T')[0];
          return logDate >= weekStartStr && logDate <= weekEndStr;
        } catch (error) {
          console.warn('Invalid date format in stats:', log.completed_at);
          return false;
        }
      }) || [];
      
      monthlyStats.unshift({
        week: `Week ${4 - week}`,
        startDate: weekStartStr,
        endDate: weekEndStr,
        completed: weekLogs.length,
        total: habits.length * 7, // 7sky
        completionRate: habits.length > 0 ? (weekLogs.length / (habits.length * 7)) * 100 : 0,
      });
    }

    // Calculate overall completion rate
    const totalPossible = habits.length * parseInt(period);
    const totalCompleted = logs?.length || 0;
    const overallCompletionRate = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalHabits: habits.length,
        completedToday: todayLogs.length,
        completionRate: overallCompletionRate,
        streaks,
        weeklyStats,
        monthlyStats,
        period: parseInt(period),
        totalLogs: totalCompleted,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}