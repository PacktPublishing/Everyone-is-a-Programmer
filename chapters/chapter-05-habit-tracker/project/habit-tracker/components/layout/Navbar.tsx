import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Home, BarChart3, History, Settings, UserCircle, Target } from 'lucide-react'
import { clsx } from 'clsx'

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuthStore()
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <BarChart3 className="h-8 w-8 text-emerald-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">habit tracker</span>
            </Link>
            
            {user && (
              <div className="hidden md:flex items-center space-x-6">
                <Link
                  href="/"
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === '/'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span>front page</span>
                </Link>
                <Link
                  href="/habits"
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === '/habits'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Target className="h-4 w-4" />
                  <span>Habit</span>
                </Link>
                <Link
                  href="/analytics"
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === '/analytics'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>analyze</span>
                </Link>
                <Link
                  href="/history"
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === '/history'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <History className="h-4 w-4" />
                  <span>history</span>
                </Link>
                <Link
                  href="/settings"
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === '/settings'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <UserCircle className="h-6 w-6 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {user.user_metadata?.name || user.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                >
                  Log out
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
                <Button variant="primary" size="sm">
                  register
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}