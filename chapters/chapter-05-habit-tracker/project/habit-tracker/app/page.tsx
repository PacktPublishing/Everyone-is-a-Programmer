'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Dashboard } from '@/components/Dashboard'
import { AuthForm } from '@/components/auth/AuthForm'
import { Layout } from '@/components/layout/Layout'

export default function Home() {
  const router = useRouter()
  const { user, isLoading: authLoading, initialize } = useAuthStore()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    initialize()
  }, [initialize])

  if (authLoading) {
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
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">habit tracker</h1>
          <p className="text-gray-600 mb-8">Build a better lifestyle and track your daily habits</p>
        </div>
        <AuthForm 
          mode={authMode} 
          onModeChange={setAuthMode}
        />
      </div>
    )
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your daily habits and build a better lifestyle</p>
      </div>
      <Dashboard />
    </Layout>
  )
}