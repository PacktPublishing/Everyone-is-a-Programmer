import React, { useEffect, useState } from 'react'
import { useHabitStore } from '@/store/habitStore'
import { useAuthStore } from '@/store/authStore'
import { StatCard, SimpleStatCard } from './ui/StatCard'
import { ProgressBar } from './ui/ProgressBar'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
  Award,
  Activity,
  Plus,
  Settings,
  BarChart3,
  Edit,
  Trash2,
  Eye,
  Bell,
  FileText,
  Zap,
  Home,
  User,
  BookOpen
} from 'lucide-react'
import { clsx } from 'clsx'
import Link from 'next/link'

interface DashboardProps {
  className?: string
}

export const Dashboard: React.FC<DashboardProps> = ({ className }) => {
  const { user } = useAuthStore()
  const { 
    habits, 
    habitLogs, 
    stats,
    isLoading,
    fetchHabits, 
    fetchHabitLogs, 
    fetchStats,
    logHabit,
    deleteHabit
  } = useHabitStore()
  
  const [loggingHabits, setLoggingHabits] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      fetchHabits()
      fetchHabitLogs()
      fetchStats()
    }
  }, [user, fetchHabits, fetchHabitLogs, fetchStats])

  // Get today's habit completion status
  const getTodayHabitStatus = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = habitLogs.filter(log => 
      log.completed_at?.startsWith(today)
    )
    
    const completedHabitIds = new Set(todayLogs.map(log => log.habit_id))
    
    return habits.map(habit => ({
      ...habit,
      isCompletedToday: completedHabitIds.has(habit.id),
      canLogToday: !completedHabitIds.has(habit.id)
    }))
  }

  // Calculate today's statistics
  const getTodayStats = () => {
    const todayHabits = getTodayHabitStatus()
    const totalHabits = todayHabits.length
    const completedHabits = todayHabits.filter(h => h.isCompletedToday).length
    const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0
    
    return {
      totalHabits,
      completedHabits,
      pendingHabits: totalHabits - completedHabits,
      completionRate
    }
  }

  // Get the habit with the highest number of consecutive days
  const getTopStreakHabit = () => {
    if (habits.length === 0) return null
    
    return habits.reduce((top, habit) => {
      const habitLogsForHabit = habitLogs.filter(log => log.habit_id === habit.id)
      const streak = calculateStreak(habitLogsForHabit)
      
      if (!top || streak > top.streak) {
        return { habit, streak }
      }
      return top
    }, null as { habit: any, streak: number } | null)
  }

  // Calculate the number of consecutive days
  const calculateStreak = (logs: any[]) => {
    if (logs.length === 0) return 0
    
    const sortedLogs = logs
      .filter(log => log.logged_at) // Filter out nologged_atrecords
      .map(log => new Date(log.logged_at.split('T')[0]))
      .sort((a, b) => b.getTime() - a.getTime())
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const logDate of sortedLogs) {
      const diffTime = currentDate.getTime() - logDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  // Handling habitual check-ins
  const handleLogHabit = async (habitId: string) => {
    if (loggingHabits.has(habitId)) return
    
    setLoggingHabits(prev => new Set(prev).add(habitId))
    
    try {
      await logHabit(habitId)
      // Retrieve data
      await Promise.all([
        fetchHabitLogs(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Failed to log habit:', error)
    } finally {
      setLoggingHabits(prev => {
        const newSet = new Set(prev)
        newSet.delete(habitId)
        return newSet
      })
    }
  }

  // Dealing with deletion habits
  const handleDeleteHabit = async (habitId: string) => {
    console.log('DashboardDelete button is clicked, used toID:', habitId)
    const habit = habits.find(h => h.id === habitId)
    const habitName = habit?.name || 'the habit'
    console.log('Find the habit:', habit)
    
    // Use a custom confirmation dialog instead of the native oneconfirm
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        // Create confirmation dialog
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Confirm deletion</h3>
            <p class="text-gray-600 mb-6">Confirm to delete"${habitName}"? This will also delete all related records and cannot be undone.</p>
            <div class="flex justify-end space-x-3">
              <button id="cancel-btn" class="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button id="confirm-btn" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                delete
              </button>
            </div>
          </div>
        `
        
        document.body.appendChild(modal)
        
        const cancelBtn = modal.querySelector('#cancel-btn')
        const confirmBtn = modal.querySelector('#confirm-btn')
        
        const cleanup = () => {
          document.body.removeChild(modal)
        }
        
        cancelBtn?.addEventListener('click', () => {
          cleanup()
          resolve(false)
        })
        
        confirmBtn?.addEventListener('click', () => {
          cleanup()
          resolve(true)
        })
        
        // Click on the background to close
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            cleanup()
            resolve(false)
          }
        })
      })
    }
    
    const confirmResult = await confirmDelete()
    console.log('User confirmation result:', confirmResult)
    
    if (confirmResult) {
      try {
        console.log('Start callingdeleteHabit API...')
        const result = await deleteHabit(habitId)
        console.log('deleteHabit APIReturn results:', result)
        
        if (result.error) {
          console.error('Delete failed:', result.error)
          alert(`Delete failed:${result.error.message}`)
          return
        }
        
        console.log('Deletion successful, success message displayed')
        // Show success message
        const successMessage = document.createElement('div')
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        successMessage.textContent = `"${habitName}"Deleted successfully`
        document.body.appendChild(successMessage)
        
        // 3Remove message after seconds
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage)
          }
        }, 3000)
        
        console.log('Re-acquire the habit list...')
        await Promise.all([
          fetchHabits(),
          fetchHabitLogs(),
          fetchStats()
        ])
        console.log('Habits list updated')
      } catch (error) {
        console.error('Failed to delete habit:', error)
        alert('An error occurred while deleting the habit, please try again later.')
      }
    }
  }

  if (isLoading) {
    return (
      <div className={clsx('space-y-6', className)}>
        {/* Load skeleton screen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 animate-pulse rounded-lg h-64" />
          <div className="bg-gray-200 animate-pulse rounded-lg h-64" />
        </div>
      </div>
    )
  }

  const todayStats = getTodayStats()
  const topStreakHabit = getTopStreakHabit()
  const todayHabits = getTodayHabitStatus()

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Quick navigation group */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button size="sm" variant="ghost" className="flex items-center space-x-1">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">front page</span>
              </Button>
            </Link>
            <Link href="/habits">
              <Button size="sm" variant="ghost" className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Habit</span>
              </Button>
            </Link>
            <Link href="/analytics">
              <Button size="sm" variant="ghost" className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">analyze</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button size="sm" variant="ghost" className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">personal</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Quick operation area */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quick operation</h2>
            <p className="text-sm text-gray-500">Manage your habits and view detailed data</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link 
            href="/habits" 
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 px-4 py-2 text-sm w-full flex items-center justify-center space-x-2 h-12"
          >
            <Plus className="w-5 h-5" />
            <span>Add new habits</span>
          </Link>
          
          <Link 
            href="/habits" 
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 px-4 py-2 text-sm w-full flex items-center justify-center space-x-2 h-12"
          >
            <Settings className="w-5 h-5" />
            <span>management habits</span>
          </Link>
          
          <Link 
            href="/analytics" 
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-emerald-500 px-4 py-2 text-sm w-full flex items-center justify-center space-x-2 h-12"
          >
            <BarChart3 className="w-5 h-5" />
            <span>View analysis</span>
          </Link>
        </div>
      </div>
      {/* Today's Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleStatCard
          label="Today's habits"
          value={todayStats.totalHabits}
          icon={Target}
          color="blue"
        />
        
        <SimpleStatCard
          label="Completed"
          value={todayStats.completedHabits}
          icon={CheckCircle2}
          color="green"
        />
        
        <SimpleStatCard
          label="To be completed"
          value={todayStats.pendingHabits}
          icon={Clock}
          color="yellow"
        />
        
        <SimpleStatCard
          label="completion rate"
          value={`${Math.round(todayStats.completionRate)}%`}
          icon={TrendingUp}
          color={todayStats.completionRate >= 80 ? 'green' : todayStats.completionRate >= 60 ? 'yellow' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Make a habit of checking in quickly today */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Today's habits</h2>
          </div>
          
          {todayHabits.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start your habit journey</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                No habits have been created yet. Create your first habit and start building a better lifestyle!
              </p>
              <div className="space-y-3">
                <Link href="/habits">
                  <Button variant="primary" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Create your first habit</span>
                  </Button>
                </Link>
                <div className="text-sm text-gray-400">
                  💡 Tip: Start with simple habits, like drinking 8 glasses of water a day
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {todayHabits.map(habit => (
                <div
                  key={habit.id}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-lg border transition-all',
                    habit.isCompletedToday 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-lg',
                      habit.isCompletedToday 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {habit.icon}
                    </div>
                    <div>
                      <h3 className={clsx(
                        'font-medium',
                        habit.isCompletedToday ? 'text-green-900' : 'text-gray-900'
                      )}>
                        {habit.name}
                      </h3>
                      <p className={clsx(
                        'text-sm',
                        habit.isCompletedToday ? 'text-green-600' : 'text-gray-500'
                      )}>
                        {habit.type === 'positive' ? 'positive habits' : 'negative habits'} • {habit.frequency?.type === 'daily' ? 'daily' : 'weekly'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Action button group */}
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {/* TODO: Implement the function of viewing details */}}
                        className="p-1.5 h-8 w-8"
                        title="check the details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Link href={`/habits?edit=${habit.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1.5 h-8 w-8"
                          title="Editing habits"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="delete habits"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Done status or sign in button */}
                    {habit.isCompletedToday ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant={habit.type === 'positive' ? 'primary' : 'secondary'}
                        onClick={() => handleLogHabit(habit.id)}
                        disabled={loggingHabits.has(habit.id)}
                        className="min-w-[80px]"
                      >
                        {loggingHabits.has(habit.id) ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          habit.type === 'positive' ? 'Finish' : 'avoid'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Statistics and achievements */}
        <div className="space-y-6">
          {/* Today's progress */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Today's progress</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Completion progress</span>
                  <span className="text-sm text-gray-500">
                    {todayStats.completedHabits}/{todayStats.totalHabits}
                  </span>
                </div>
                <ProgressBar
                  value={todayStats.completedHabits}
                  max={todayStats.totalHabits}
                  color={todayStats.completionRate >= 80 ? 'green' : todayStats.completionRate >= 60 ? 'yellow' : 'red'}
                  size="md"
                />
              </div>
              
              <div className="text-center pt-2">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(todayStats.completionRate)}%
                </div>
                <div className="text-sm text-gray-500">Today's completion rate</div>
              </div>
            </div>
          </Card>

          {/* best streak */}
          {topStreakHabit && (
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Best Consecutive</h2>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl">
                  {topStreakHabit.habit.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{topStreakHabit.habit.name}</h3>
                  <p className="text-sm text-gray-500">streak: {topStreakHabit.streak} days</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{topStreakHabit.streak}</div>
                  <div className="text-xs text-gray-500">sky</div>
                </div>
              </div>
            </Card>
          )}

          {/* Overall statistics */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">Overall statistics</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{stats?.totalHabits || 0}</div>
                <div className="text-xs text-gray-500">total number of habits</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{stats?.completedToday || 0}</div>
                <div className="text-xs text-gray-500">Completed today</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{Math.round(stats?.completionRate || 0)}%</div>
                <div className="text-xs text-gray-500">completion rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{Math.max(...(stats?.streaks.map(s => s.streak) || [0]))}</div>
                <div className="text-xs text-gray-500">longest continuous</div>
              </div>
            </div>
          </Card>
          
          {/* Utility tools */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900">Utility tools</h2>
            </div>
            
            <div className="space-y-4">
              {/* Today's goal */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-800">Today's goal</span>
                  <Button size="sm" variant="ghost" className="text-yellow-600 hover:text-yellow-800">
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-yellow-700">
                  Finish {Math.ceil(todayStats.totalHabits * 0.8)} a habit ({Math.round(todayStats.completionRate)}% Completed)
                </p>
              </div>
              
              {/* quick notes */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-800">quick notes</span>
                </div>
                <textarea 
                  placeholder="Journal your thoughts or feelings today..."
                  className="w-full text-sm bg-transparent border-none resize-none focus:outline-none text-blue-700 placeholder-blue-400"
                  rows={2}
                />
              </div>
              
              {/* Reminder settings */}
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center space-x-2"
                onClick={() => {/* TODO: Implement reminder setting function */}}
              >
                <Bell className="w-4 h-4" />
                <span>Set reminder</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}