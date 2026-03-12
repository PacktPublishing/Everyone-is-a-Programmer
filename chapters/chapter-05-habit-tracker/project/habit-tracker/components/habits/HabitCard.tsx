import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Check, Flame, Edit, Trash2, Clock, Calendar, Target } from 'lucide-react'
import { clsx } from 'clsx'

interface Habit {
  id: string
  name: string
  icon: string
  type: 'positive' | 'negative'
  frequency: {
    type: 'daily' | 'weekly' | 'custom'
    days?: number[]
    count?: number
  }
  reminder_time?: string | null
  user_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

interface HabitCardProps {
  habit: Habit
  isCompletedToday: boolean
  streakCount?: number
  completionRate?: number
  totalLogs?: number
  onComplete: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  isCompletedToday, 
  streakCount = 0,
  completionRate = 0,
  totalLogs = 0,
  onComplete, 
  onEdit, 
  onDelete 
}) => {
  const [loading, setLoading] = React.useState(false)

  const handleComplete = async () => {
    if (isCompletedToday) return
    
    setLoading(true)
    try {
      await onComplete()
    } catch (error) {
      console.error('Recording habit failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={clsx(
      'hover:shadow-lg transition-all duration-200 border-l-4',
      isCompletedToday 
        ? 'border-l-green-500 bg-green-50/30' 
        : habit.type === 'positive' 
          ? 'border-l-emerald-500' 
          : 'border-l-red-500'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={clsx(
              'text-2xl p-2 rounded-lg',
              isCompletedToday 
                ? 'bg-green-100' 
                : habit.type === 'positive' 
                  ? 'bg-emerald-100' 
                  : 'bg-red-100'
            )}>
              {habit.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{habit.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={clsx(
                  'px-2 py-1 text-xs rounded-full font-medium',
                  habit.type === 'positive' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-red-100 text-red-800'
                )}>
                  {habit.type === 'positive' ? 'positive habits' : 'negative habits'}
                </span>
                <span className={clsx(
                  'px-2 py-1 text-xs rounded-full font-medium',
                  'bg-blue-100 text-blue-800'
                )}>
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {habit.frequency?.type === 'daily' ? 'daily' : habit.frequency?.type === 'weekly' ? 'weekly' : 'Customize'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('HabitCardThe delete button is clicked, habits:', habit.name, habit.id)
                  onDelete()
                }}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">{streakCount}</div>
            <div className="text-xs text-gray-500">streak</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">{completionRate}%</div>
            <div className="text-xs text-gray-500">completion rate</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">{totalLogs}</div>
            <div className="text-xs text-gray-500">total records</div>
          </div>
        </div>
        
        {/* reminder time */}
        {habit.reminder_time && (
          <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Reminder time: {habit.reminder_time}</span>
          </div>
        )}
        
        {/* Done button */}
        <Button
          variant={isCompletedToday ? 'secondary' : 'primary'}
          size="sm"
          loading={loading}
          disabled={isCompletedToday}
          onClick={handleComplete}
          className={clsx(
            'w-full transition-all duration-200',
            isCompletedToday 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : habit.type === 'positive'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
          )}
        >
          {isCompletedToday ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Completed today
            </>
          ) : (
            <>
              <Target className="h-4 w-4 mr-2" />
              {habit.type === 'positive' ? 'Mark complete' : 'mark avoid'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}