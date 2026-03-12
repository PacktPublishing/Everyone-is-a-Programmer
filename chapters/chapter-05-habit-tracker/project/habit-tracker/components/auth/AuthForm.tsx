import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

interface AuthFormProps {
  mode?: 'login' | 'register'
  onModeChange?: (mode: 'login' | 'register') => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  mode = 'login', 
  onModeChange 
}) => {
  const { signIn, signUp, resendConfirmation } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [showResendOption, setShowResendOption] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Please enter email address'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Please enter password'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password needs to be at least 6 characters'
    }

    if (mode === 'register') {
      if (!formData.name) {
        newErrors.name = 'Please enter name'
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'The passwords entered twice are inconsistent'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getErrorMessage = (error: any, isLogin: boolean) => {
    const message = error?.message || ''
    
    // Login error handling
    if (isLogin) {
      if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
        return { userMessage: 'Please verify your email address before logging in', showResend: true }
      }
      if (message.includes('Invalid login credentials')) {
        return { userMessage: 'Email or password is wrong, please check and try again.', showResend: false }
      }
      if (message.includes('Too many requests')) {
        return { userMessage: 'Too many login attempts, please try again later', showResend: false }
      }
      if (message.includes('User not found')) {
        return { userMessage: 'This email address has not been registered yet, please register an account first', showResend: false }
      }
    } else {
      // Registration error handling
      if (message.includes('User already registered')) {
        return { userMessage: 'This email address has been registered, please log in directly', showResend: false }
      }
      if (message.includes('Password should be at least')) {
        return { userMessage: 'Password length needs to be at least 6 characters', showResend: false }
      }
      if (message.includes('Invalid email')) {
        return { userMessage: 'Please enter a valid email address', showResend: false }
      }
      if (message.includes('Signup is disabled')) {
        return { userMessage: 'Registration of new users is currently not allowed', showResend: false }
      }
    }
    
    return { userMessage: message || 'Operation failed, please try again', showResend: false }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({ submit: '' })
    setShowResendOption(false)
    
    try {
      let result
      if (mode === 'login') {
        result = await signIn(formData.email, formData.password)
        if (result.error) {
          const { userMessage, showResend } = getErrorMessage(result.error, true)
          setErrors({ submit: userMessage })
          setShowResendOption(showResend)
          toast.error(userMessage)
        } else {
          toast.success('Login successful!')
        }
      } else {
        result = await signUp(formData.email, formData.password, formData.name)
        if (result.error) {
          const { userMessage } = getErrorMessage(result.error, false)
          setErrors({ submit: userMessage })
          toast.error(userMessage)
        } else {
          // Feedback on successful registration
          toast.success('Registration successful! Please check your email and click on the verification link to complete account activation.')
          setErrors({ submit: '' })
          // Clear form
          setFormData({
            email: '',
            password: '',
            name: '',
            confirmPassword: ''
          })
          // Switch to login mode
          setTimeout(() => {
            onModeChange?.('login')
            toast.info('Please verify your email and return to log in')
          }, 2000)
        }
      }
    } catch (error) {
      const errorMessage = 'Network connection failed, please check the network and try again'
      setErrors({ submit: errorMessage })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address first')
      return
    }

    setResendingEmail(true)
    try {
      const result = await resendConfirmation(formData.email)
      if (result.error) {
        toast.error('Resending verification email failed:' + result.error.message)
      } else {
        toast.success('The verification email has been resent, please check your email')
        setShowResendOption(false)
      }
    } catch (error) {
      toast.error('Failed to resend verification email, please try again')
    } finally {
      setResendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {mode === 'login' ? 'Login account' : 'create Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <Input
                label="Name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                placeholder="Please enter your name"
                disabled={loading}
              />
              )}
              
              <Input
                label="Email address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                placeholder="Please enter email address"
                disabled={loading}
              />
              
              <Input
                label="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password}
                placeholder="Please enter password"
                disabled={loading}
              />
              
              {mode === 'register' && (
                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  placeholder="Please enter password again"
                  disabled={loading}
                />
              )}
              
              {errors.submit && (
                <div className="text-red-600 text-sm text-center">
                  {errors.submit}
                  {showResendOption && mode === 'login' && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resendingEmail || loading}
                        className="text-emerald-600 hover:text-emerald-500 underline text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {resendingEmail ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          'Resend verification email'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {mode === 'login' ? 'Login...' : 'Registering...'}
                  </>
                ) : (
                  mode === 'login' ? 'Log in' : 'register'
                )}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-emerald-600 hover:text-emerald-500"
                onClick={() => onModeChange?.(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Don’t have an account? Register now' : 'Already have an account? Log in now'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}