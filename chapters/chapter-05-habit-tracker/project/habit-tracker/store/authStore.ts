import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  resendConfirmation: (email: string) => Promise<{ error: any }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (data.user && data.session) {
      set({ user: data.user, session: data.session })
    }
    
    return { error }
  },

  signUp: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    
    if (data.user && data.session) {
      set({ user: data.user, session: data.session })
      
      // Create user profile
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        name,
      })
    }
    
    return { error }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  resendConfirmation: async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    return { error }
  },

  initialize: async () => {
    set({ isLoading: true })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      set({ user: session.user, session })
    }
    
    // Monitor authentication status changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        set({ user: session.user, session })
        
        // If you are a new user and do not have a user profile, create one
        if (session.user.user_metadata?.name) {
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', session.user.id)
            .single()
          
          if (!existingProfile) {
            await supabase.from('user_profiles').insert({
              id: session.user.id,
              name: session.user.user_metadata.name,
            })
          }
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, session: null })
      } else if (session) {
        set({ user: session.user, session })
      } else {
        set({ user: null, session: null })
      }
    })
    
    set({ isLoading: false })
  },
}))