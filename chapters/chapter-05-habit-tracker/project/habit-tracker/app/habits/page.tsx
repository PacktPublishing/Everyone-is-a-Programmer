'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useHabitStore } from '@/store/habitStore'
import { HabitCard } from '@/components/habits/HabitCard'
import { HabitForm } from '@/components/habits/HabitForm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Plus, Search, Filter, Target } from 'lucide-react'
import { clsx } from 'clsx'

// Helper functions for calculating habit statistics
const getHabitStats = (habitId: string, habitLogs: any[], habits: any[]) => {
  const habit = habits.find(h => h.id === habitId)
  if (!habit) return { totalLogs: 0, streakCount: 0, habitCompletionRate: 0 }
  
  const habitLogsForHabit = habitLogs.filter(log => log.habit_id === habitId)
  const totalLogs = habitLogsForHabit.length
  
  // Calculate the number of consecutive days
  const streakCount = calculateStreak(habitLogsForHabit)
  
  // Calculate completion rate (based on last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const habitCreatedAt = new Date(habit.created_at)
  const startDate = habitCreatedAt > thirtyDaysAgo ? habitCreatedAt : thirtyDaysAgo
  const today = new Date()
  const daysDiff = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const expectedDays = Math.min(daysDiff, 30)
  
  const recentLogs = habitLogsForHabit.filter(log => {
    if (!log.completed_at || typeof log.completed_at !== 'string') return false
    const logDate = new Date(log.completed_at)
    return logDate >= startDate
  })
  
  const habitCompletionRate = expectedDays > 0 ? (recentLogs.length / expectedDays) * 100 : 0
  
  return {
    totalLogs,
    streakCount,
    habitCompletionRate: Math.round(habitCompletionRate)
  }
}

// Auxiliary function to calculate the number of consecutive days
const calculateStreak = (logs: any[]) => {
  if (logs.length === 0) return 0
  
  // Sort by date (newest first)
  const sortedLogs = logs
    .filter(log => log.completed_at && typeof log.completed_at === 'string')
    .map(log => {
      try {
        return new Date(log.completed_at.split('T')[0])
      } catch (error) {
        console.warn('Invalid date format:', log.completed_at)
        return null
      }
    })
    .filter(date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime())
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  // Check if there is a record for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const hasToday = sortedLogs.some(date => date.getTime() === today.getTime())
  
  if (!hasToday) {
    // If there is no record today, calculation starts from yesterday
    currentDate.setDate(currentDate.getDate() - 1)
  }
  
  for (const logDate of sortedLogs) {
    if (logDate.getTime() === currentDate.getTime()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}

export default function HabitsPage() {
  const router = useRouter()
  const { user, session, isLoading: authLoading } = useAuthStore()
  const { 
    habits, 
    habitLogs, 
    isLoading, 
    fetchHabits, 
    fetchHabitLogs, 
    logHabit, 
    deleteHabit 
  } = useHabitStore()
  
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<any>(null)
  const [loggingHabits, setLoggingHabits] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'negative'>('all')
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'daily' | 'weekly'>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }
    
    if (user) {
      fetchHabits()
      fetchHabitLogs()
    }
  }, [user, authLoading, router, fetchHabits, fetchHabitLogs])

  // Check if the habit has been completed today
  const isCompletedToday = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0]
    return habitLogs.some(log => 
      log.habit_id === habitId && 
      log.completed_at && 
      typeof log.completed_at === 'string' &&
      log.completed_at.startsWith(today)
    )
  }

  // Handle habit records
  const handleLogHabit = async (habitId: string) => {
    if (loggingHabits.has(habitId)) return
    
    setLoggingHabits(prev => new Set(prev).add(habitId))
    
    try {
      await logHabit(habitId)
      await fetchHabitLogs() // Re-fetch logs to updateUI
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

  // Dealing with editing habits
  const handleEditHabit = (habit: any) => {
    setEditingHabit(habit)
    setShowHabitForm(true)
  }

  // Dealing with deletion habits
  const handleDeleteHabit = async (habitId: string) => {
    console.log('Delete button is clicked, used toID:', habitId)
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
        await fetchHabits() // Retrieve Habit List
        console.log('Habits list updated')
      } catch (error) {
        console.error('Failed to delete habit:', error)
        alert('An error occurred while deleting the habit, please try again later.')
      }
    }
  }

  // Process form close
  const handleFormClose = () => {
    setShowHabitForm(false)
    setEditingHabit(null)
    fetchHabits() // Retrieve Habit List
  }

  // filtering habits
  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || habit.type === filterType
    const matchesFrequency = filterFrequency === 'all' || habit.frequency?.type === filterFrequency
    
    return matchesSearch && matchesType && matchesFrequency
  })

  // Statistics
  const stats = {
    total: habits.length,
    positive: habits.filter(h => h.type === 'positive').length,
    negative: habits.filter(h => h.type === 'negative').length,
    daily: habits.filter(h => h.frequency?.type === 'daily').length,
    weekly: habits.filter(h => h.frequency?.type === 'weekly').length
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in first</h1>
          <p className="text-gray-600">You need to be logged in to view the habit tracker</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Habit Management</h1>
            <p className="text-gray-600 mt-1">Manage all your habits, track progress and statistics</p>
          </div>
          <Button
            onClick={() => setShowHabitForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add a habit</span>
          </Button>
        </div>

        {/* Statistical overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">total habit</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
            <div className="text-sm text-gray-600">positive habits</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
            <div className="text-sm text-gray-600">negative habits</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.daily}</div>
            <div className="text-sm text-gray-600">daily habits</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.weekly}</div>
            <div className="text-sm text-gray-600">weekly habits</div>
          </Card>
        </div>

        {/* Search and filter */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* search box */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search habits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Type filtering */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">all types</option>
                <option value="positive">positive habits</option>
                <option value="negative">negative habits</option>
              </select>
            </div>
            
            {/* Frequency filtering */}
            <div>
              <select
                value={filterFrequency}
                onChange={(e) => setFilterFrequency(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">all frequencies</option>
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Habit list */}
        {filteredHabits.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {habits.length === 0 ? 'Not used to it yet' : 'No matching habits found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {habits.length === 0 
                ? 'Start creating your first habits and build a better lifestyle' 
                : 'Try adjusting your search criteria or filters'
              }
            </p>
            {habits.length === 0 && (
              <Button
                onClick={() => setShowHabitForm(true)}
                className="flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create your first habit</span>
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHabits.map((habit) => {
              const stats = getHabitStats(habit.id, habitLogs, habits)
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isCompletedToday={isCompletedToday(habit.id)}
                  onComplete={() => handleLogHabit(habit.id)}
                  onEdit={() => handleEditHabit(habit)}
                  onDelete={() => handleDeleteHabit(habit.id)}
                  totalLogs={stats.totalLogs}
                  streakCount={stats.streakCount}
                  completionRate={stats.habitCompletionRate}
                />
              )
            })}
          </div>
        )}

        {/* Custom form modal box */}
        <HabitForm
          isOpen={showHabitForm}
          habit={editingHabit}
          onClose={handleFormClose}
          onSave={async (habitData) => {
            try {
              if (!session?.access_token) {
                throw new Error('User is not logged in')
              }

              // Process data formats to ensure complianceAPIexpect
              const processedData = {
                ...habitData,
                // will empty stringreminder_timeConvert tonull
                reminder_time: habitData.reminder_time === '' ? null : habitData.reminder_time,
                // make surefrequencyThe field format is correct and containscountproperty
                frequency: {
                  type: habitData.frequency?.type || 'daily',
                  count: habitData.frequency?.count || 1,
                  ...(habitData.frequency?.days && { days: habitData.frequency.days })
                }
              }

              console.log('Data sent:', JSON.stringify(processedData, null, 2))

              const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              }

              if (editingHabit) {
                // Update habits
                const response = await fetch(`/api/habits/${editingHabit.id}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify(processedData),
                })

                if (!response.ok) {
                  const errorText = await response.text()
                  console.error('Failed to update habits, response:', errorText)
                  const errorData = JSON.parse(errorText)
                  throw new Error(errorData.error || 'Update habit failed')
                }

                console.log('Habit update successful')
              } else {
                // Create new habits
                const response = await fetch('/api/habits', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(processedData),
                })

                if (!response.ok) {
                  const errorText = await response.text()
                  console.error('Failed to create habit, response:', errorText)
                  const errorData = JSON.parse(errorText)
                  throw new Error(errorData.error || 'Failed to create habit')
                }

                console.log('Habit created successfully')
              }

              // Close the form and refresh the data
              handleFormClose()
            } catch (error) {
              console.error('Operation failed:', error)
              // User-friendly error prompts can be added here
              alert(error instanceof Error ? error.message : 'Operation failed, please try again')
            }
          }}
        />
      </div>
    </div>
  )
}