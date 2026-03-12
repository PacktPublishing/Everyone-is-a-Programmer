import React from 'react'
import { clsx } from 'clsx'

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo'
  showLabel?: boolean
  label?: string
  animated?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'blue',
  showLabel = false,
  label,
  animated = false,
  className
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500'
  }

  const backgroundColorClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
    indigo: 'bg-indigo-100'
  }

  return (
    <div className={clsx('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || `schedule: ${Math.round(percentage)}%`}
          </span>
          <span className="text-sm text-gray-500">
            {value}/{max}
          </span>
        </div>
      )}
      <div className={clsx(
        'w-full rounded-full overflow-hidden',
        sizeClasses[size],
        backgroundColorClasses[color]
      )}>
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300 ease-out',
            colorClasses[color],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Circular progress bar component
interface CircularProgressProps {
  value: number // 0-100
  size?: number // Diameter in pixels
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showLabel?: boolean
  label?: string
  className?: string
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB',
  showLabel = true,
  label,
  className
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(Math.max(value, 0), 100)
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(percentage)}%
            </div>
            {label && (
              <div className="text-xs text-gray-500 mt-1">
                {label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Multi-segment progress bar component
interface MultiProgressProps {
  segments: Array<{
    value: number
    color: string
    label?: string
  }>
  total?: number
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

export const MultiProgress: React.FC<MultiProgressProps> = ({
  segments,
  total,
  size = 'md',
  showLabels = false,
  className
}) => {
  const totalValue = total || segments.reduce((sum, segment) => sum + segment.value, 0)
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  return (
    <div className={clsx('w-full', className)}>
      {showLabels && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-4">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-gray-600">
                  {segment.label} ({segment.value})
                </span>
              </div>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            total: {totalValue}
          </span>
        </div>
      )}
      <div className={clsx(
        'w-full bg-gray-200 rounded-full overflow-hidden flex',
        sizeClasses[size]
      )}>
        {segments.map((segment, index) => {
          const percentage = (segment.value / totalValue) * 100
          return (
            <div
              key={index}
              className="transition-all duration-300 ease-out"
              style={{
                width: `${percentage}%`,
                backgroundColor: segment.color
              }}
            />
          )
        })}
      </div>
    </div>
  )
}