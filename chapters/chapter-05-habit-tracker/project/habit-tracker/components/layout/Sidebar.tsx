import React from 'react'
import { clsx } from 'clsx'
import {
  HomeIcon,
  PlusIcon,
  ChartBarIcon,
  CalendarIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

interface SidebarItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  current?: boolean
}

const navigation: SidebarItem[] = [
  { name: 'Dashboard', icon: HomeIcon, href: '/', current: true },
  { name: 'Add a habit', icon: PlusIcon, href: '/habits/new' },
  { name: 'Statistical analysis', icon: ChartBarIcon, href: '/analytics' },
  { name: 'calendar view', icon: CalendarIcon, href: '/calendar' },
  { name: 'Settings', icon: CogIcon, href: '/settings' },
]

interface SidebarProps {
  className?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  return (
    <div className={clsx('flex flex-col w-64 bg-gray-50 border-r border-gray-200', className)}>
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.name}
                href={item.href}
                className={clsx(
                  item.current
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <Icon
                  className={clsx(
                    item.current ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                />
                {item.name}
              </a>
            )
          })}
        </nav>
      </div>
    </div>
  )
}