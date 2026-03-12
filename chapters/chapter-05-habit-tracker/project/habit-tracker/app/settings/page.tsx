'use client'

import { useAuthStore } from '@/store/authStore'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useEffect, useState, useRef } from 'react'
import { redirect } from 'next/navigation'
import { User, Bell, Shield, Trash2, Save, Camera } from 'lucide-react'
import { useContent } from '@/hooks/useContent'

export default function SettingsPage() {
  const { user, isLoading, signOut } = useAuthStore()
  const { content } = useContent("settings")
  const [profile, setProfile] = useState({
    display_name: '',
    email: '',
    timezone: 'UTC',
    avatar_url: ''
  })
  const [notifications, setNotifications] = useState({
    daily_reminder: true,
    weekly_summary: true,
    achievement_alerts: true,
    reminder_time: '09:00'
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize authentication status
    useAuthStore.getState().initialize()
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/')
    }
  }, [user, isLoading])

  useEffect(() => {
    if (user) {
      setProfile({
        display_name: user.user_metadata?.display_name || '',
        email: user.email || '',
        timezone: user.user_metadata?.timezone || 'UTC',
        avatar_url: user.user_metadata?.avatar_url || ''
      })
      
      // Load notification settings
      loadNotificationSettings()
    }
  }, [user])

  const loadNotificationSettings = async () => {
    try {
      const { session } = useAuthStore.getState()
      if (!session) return

      const response = await fetch('/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('User is not authorized, skip loading notification settings')
          return
        }
        if (response.status === 404) {
          // User has no notification settings yet, use defaults
          console.info('User notification settings do not exist, use default settings')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.success && result.data) {
        setNotifications({
          daily_reminder: result.data.daily_reminder,
          weekly_summary: result.data.weekly_summary,
          achievement_alerts: result.data.achievement_alerts,
          reminder_time: result.data.reminder_time,
        })
      } else if (result.error) {
        console.error('Failed to load notification settings:', result.error)
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
      // Do not display an error message to the user since this is a background loading operation
      // If loading fails, the user can still use the default settings
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verify file type and size
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MBlimit
      setMessage("Image size cannot exceed 5MB");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // Call uploadAPI
      const formData = new FormData();
      formData.append("file", file);

      const { session } = useAuthStore.getState();
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      if (result.success) {
        setProfile((prev) => ({ ...prev, avatar_url: result.data.url }));
        setMessage("Avatar uploaded successfully!");
      } else {
        setMessage(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload failed, please try again");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage('')
    
    // Validate input
    if (!profile.display_name.trim()) {
      setMessage('Display name cannot be empty')
      setSaving(false)
      return
    }
    
    try {
      const { session } = useAuthStore.getState()
      if (!session) {
        setMessage('Login has expired, please log in again')
        setSaving(false)
        return
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: profile.display_name.trim(),
          timezone: profile.timezone,
          avatar_url: profile.avatar_url, // Now includes avatarURL
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setMessage('Login has expired, please log in again')
          return
        }
        if (response.status === 403) {
          setMessage('No permission to perform this operation')
          return
        }
        if (response.status >= 500) {
          setMessage('Server error, please try again later')
          return
        }
      }

      const result = await response.json()
      if (result.success) {
        setMessage('Data saved successfully!')
      } else {
        setMessage(result.error || 'Save failed, please try again')
      }
    } catch (error) {
      console.error('Failed to save data:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setMessage('Network connection failed, please check the network and try again')
      } else {
        setMessage('Save failed, please try again')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    setMessage('')
    
    // Verify reminder time format
    if (notifications.reminder_time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(notifications.reminder_time)) {
      setMessage('The reminder time format is incorrect, please use HH:MM Format')
      setSaving(false)
      return
    }
    
    try {
      const { session } = useAuthStore.getState()
      if (!session) {
        setMessage('Login has expired, please log in again')
        setSaving(false)
        return
      }

      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(notifications),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setMessage('Login has expired, please log in again')
          return
        }
        if (response.status === 403) {
          setMessage('No permission to perform this operation')
          return
        }
        if (response.status >= 500) {
          setMessage('Server error, please try again later')
          return
        }
      }

      const result = await response.json()
      if (result.success) {
        setMessage('Notification settings saved successfully!')
      } else {
        setMessage(result.error || 'Save failed, please try again')
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setMessage('Network connection failed, please check the network and try again')
      } else {
        setMessage('Save failed, please try again')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      redirect('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {content.page_title || "Settings"}
        </h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{content.profile_section_title || "Profile"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Added avatar upload area */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={profile.avatar_url || "/default-avatar.svg"}
                    alt="avatar"
                    className="w-16 h-16 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = "/default-avatar.svg";
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 hover:bg-emerald-700 disabled:bg-gray-400"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Avatar</h3>
                  <p className="text-xs text-gray-500">
                    {uploading ? "Uploading..." : "Click to change your profile picture"}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display name
                </label>
                <Input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  placeholder="Enter your display name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <Input
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email address cannot be modified</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time zone
                </label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (UTC-5)</option>
                  <option value="Europe/London">London (UTC+0)</option>
                  <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                  <option value="Asia/Shanghai">China Standard Time (UTC+8)</option>
                </select>
              </div>
              
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Notification settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>{content.notification_section_title || "Notifications"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">daily reminder</h3>
                  <p className="text-sm text-gray-500">Daily reminder to complete your habit</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.daily_reminder}
                    onChange={(e) => setNotifications({ ...notifications, daily_reminder: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Weekly report summary</h3>
                  <p className="text-sm text-gray-500">Send weekly habit completion summary</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.weekly_summary}
                    onChange={(e) => setNotifications({ ...notifications, weekly_summary: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">achievement reminder</h3>
                  <p className="text-sm text-gray-500">Notify you when milestones are reached</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.achievement_alerts}
                    onChange={(e) => setNotifications({ ...notifications, achievement_alerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  reminder time
                </label>
                <Input
                  type="time"
                  value={notifications.reminder_time}
                  onChange={(e) => setNotifications({ ...notifications, reminder_time: e.target.value })}
                />
              </div>
              
              <Button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save settings'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Account management */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Account management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Account information</h3>
                <p className="text-sm text-gray-500">Registration time: {new Date(user.created_at).toLocaleDateString('zh-CN')}</p>
                <p className="text-sm text-gray-500">Last login: {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('zh-CN')}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Account operations</h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="flex-1"
                  >
                    Log out
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your account? This operation is irreversible.')) {
                        // Here you should call to delete the accountAPI
                        alert('The delete account function is under development')
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete account
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}