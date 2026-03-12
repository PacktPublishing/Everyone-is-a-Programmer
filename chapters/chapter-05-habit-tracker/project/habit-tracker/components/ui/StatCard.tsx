import React from 'react'
import { clsx } from 'clsx'
import { LucideIcon } from 'lucide-react'
import { ProgressBar, CircularProgress } from './ProgressBar'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  progress?: {
    value: number
    max?: number
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo'
  }
  circularProgress?: {
    value: number
    color?: string
    size?: number
  }
  variant?: 'default' | 'gradient' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-500',
  trend,
  progress,
  circularProgress,
  variant = 'default',
  size = 'md',
  className,
  onClick
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200',
    minimal: 'bg-gray-50 border-0'
  }

  const valueSize = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <div
      className={clsx(
        'rounded-lg transition-all duration-200',
        sizeClasses[size],
        variantClasses[variant],
        onClick && 'cursor-pointer hover:shadow-md hover:scale-105',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {Icon && (
              <Icon className={clsx('w-5 h-5', iconColor)} />
            )}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          <div className={clsx(
            'font-bold text-gray-900 mb-1',
            valueSize[size]
          )}>
            {value}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={clsx(
                'text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              {trend.label && (
                <span className="text-sm text-gray-500 ml-1">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        
        {circularProgress && (
          <div className="ml-4">
            <CircularProgress
              value={circularProgress.value}
              color={circularProgress.color}
              size={circularProgress.size || 60}
              showLabel={false}
            />
          </div>
        )}
      </div>
      
      {progress && (
        <div className="mt-4">
          <ProgressBar
            value={progress.value}
            max={progress.max}
            color={progress.color}
            size="sm"
          />
        </div>
      )}
    </div>
  )
}

// Simplified version of statistical cards
interface SimpleStatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo' | 'gray'
  className?: string
}

export const SimpleStatCard: React.FC<SimpleStatCardProps> = ({
  label,
  value,
  icon: Icon,
  color = 'blue',
  className
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500',
    indigo: 'text-indigo-500',
    gray: 'text-gray-500'
  }

  return (
    <div className={clsx(
      'p-4 rounded-lg border',
      colorClasses[color],
      className
    )}>
      <div className="flex items-center space-x-3">
        {Icon && (
          <Icon className={clsx('w-6 h-6', iconColorClasses[color])} />
        )}
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm opacity-75">{label}</div>
        </div>
      </div>
    </div>
  )
}

// Compare stat cards
interface ComparisonStatCardProps {
  title: string
  current: {
    label: string
    value: number
  }
  previous: {
    label: string
    value: number
  }
  icon?: LucideIcon
  className?: string
}

export const ComparisonStatCard: React.FC<ComparisonStatCardProps> = ({
  title,
  current,
  previous,
  icon: Icon,
  className
}) => {
  const change = current.value - previous.value
  const changePercentage = previous.value > 0 ? (change / previous.value) * 100 : 0
  const isPositive = change >= 0

  return (
    <div className={clsx(
      'bg-white p-6 rounded-lg border border-gray-200 shadow-sm',
      className
    )}>
      <div className="flex items-center space-x-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-gray-600" />}
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{current.label}</span>
          <span className="text-xl font-bold text-gray-900">{current.value}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{previous.label}</span>
          <span className="text-lg text-gray-600">{previous.value}</span>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">change</span>
            <div className="flex items-center space-x-1">
              <span className={clsx(
                'text-sm font-medium',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {isPositive ? '+' : ''}{change}
              </span>
              <span className={clsx(
                'text-xs',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                ({isPositive ? '+' : ''}{changePercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}