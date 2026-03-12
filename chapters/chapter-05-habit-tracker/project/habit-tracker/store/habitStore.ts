import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Habit {
  id: string
  user_id: string
  name: string
  icon: string
  type: 'positive' | 'negative'
  frequency: {
    type: 'daily' | 'weekly' | 'custom'
    days?: number[]
    count?: number
  }
  reminder_time: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes: string | null
  created_at: string
}

export interface HabitStats {
  totalHabits: number
  completedToday: number
  completionRate: number
  overall_completion_rate: number
  streaks: Array<{
    habitId: string
    habitName: string
    habitIcon: string
    streak: number
  }>
  weeklyStats: Array<{
    date: string
    completed: number
    total: number
    completionRate: number
  }>
  monthlyStats: Array<{
    week: string
    startDate: string
    endDate: string
    completed: number
    total: number
    completionRate: number
  }>
}

interface HabitState {
  habits: Habit[]
  habitLogs: HabitLog[]
  stats: HabitStats | null
  isLoading: boolean
  fetchHabits: () => Promise<void>
  createHabit: (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ error: any }>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<{ error: any }>
  deleteHabit: (id: string) => Promise<{ error: any }>
  logHabit: (habitId: string, notes?: string) => Promise<{ error: any }>
  fetchHabitLogs: (habitId?: string, startDate?: string, endDate?: string) => Promise<void>
  fetchStats: (period?: string, habitId?: string) => Promise<void>
  getStreakCount: (habitId: string) => number
  getTodayStatus: (habitId: string) => boolean
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  habitLogs: [],
  stats: null,
  isLoading: false,

  fetchHabits: async () => {
    set({ isLoading: true })
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        set({ isLoading: false })
        return
      }

      const response = await fetch('/api/habits', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()
      if (result.success) {
        set({ habits: result.data })
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error)
    }
    
    set({ isLoading: false })
  },

  createHabit: async (habitData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { error: { message: 'User is not logged in' } }
      }

      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(habitData),
      })

      const result = await response.json()
      if (result.success) {
        const { habits } = get()
        set({ habits: [result.data, ...habits] })
        return { error: null }
      }
      
      return { error: { message: result.error } }
    } catch (error) {
      return { error: { message: 'Failed to create habit' } }
    }
  },

  updateHabit: async (id, updates) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { error: { message: 'User is not logged in' } }
      }

      const response = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      })

      const result = await response.json()
      if (result.success) {
        const { habits } = get()
        const updatedHabits = habits.map(habit => 
          habit.id === id ? { ...habit, ...result.data } : habit
        )
        set({ habits: updatedHabits })
        return { error: null }
      }
      
      return { error: { message: result.error } }
    } catch (error) {
      return { error: { message: 'Update habit failed' } }
    }
  },

  deleteHabit: async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { error: { message: 'User is not logged in' } }
      }

      const response = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()
      if (result.success) {
        const { habits } = get()
        const filteredHabits = habits.filter(habit => habit.id !== id)
        set({ habits: filteredHabits })
        return { error: null }
      }
      
      return { error: { message: result.error } }
    } catch (error) {
      return { error: { message: 'Delete habit failed' } }
    }
  },

  logHabit: async (habitId, notes) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { error: { message: 'User is not logged in' } }
      }

      const response = await fetch('/api/habit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          habit_id: habitId,
          notes,
        }),
      })

      const result = await response.json()
      if (result.success) {
        const { habitLogs } = get()
        set({ habitLogs: [result.data, ...habitLogs] })
        return { error: null }
      }
      
      return { error: { message: result.error } }
    } catch (error) {
      return { error: { message: 'Record habit failure' } }
    }
  },

  fetchHabitLogs: async (habitId, startDate, endDate) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams()
      if (habitId) params.append('habit_id', habitId)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      params.append('limit', '100')

      const response = await fetch(`/api/habit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()
      if (result.success) {
        set({ habitLogs: result.data })
      }
    } catch (error) {
      console.error('Failed to fetch habit logs:', error)
    }
  },

  fetchStats: async (period = '30', habitId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams()
      params.append('period', period)
      if (habitId) params.append('habit_id', habitId)

      const response = await fetch(`/api/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()
      if (result.success) {
        set({ stats: result.data })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  },

  getStreakCount: (habitId) => {
    const { habitLogs } = get()
    const logs = habitLogs
      .filter(log => log.habit_id === habitId)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].completed_at)
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      
      if (logDate.toDateString() === expectedDate.toDateString()) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  },

  getTodayStatus: (habitId) => {
    const { habitLogs } = get()
    const today = new Date().toDateString()
    
    return habitLogs.some(log => 
      log.habit_id === habitId && 
      new Date(log.completed_at).toDateString() === today
    )
  },
}))