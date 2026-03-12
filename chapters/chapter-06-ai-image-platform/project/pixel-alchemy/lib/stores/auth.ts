import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        set({ user });
        await get().refreshProfile();
      }
    }

    return { error };
  },

  signUp: async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        set({ user });
        await get().refreshProfile();
      }
    }

    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  updateProfile: async (updates: any) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', get().user?.id)
      .select()
      .single();

    if (!error && data) {
      set({ profile: data });
    }

    return { error };
  },

  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    set({ profile: data });
  },
}));

// Initialize authentication status
supabase.auth.onAuthStateChange(async (event, session) => {
  const { set } = useAuthStore.getState();
  
  if (session?.user) {
    set({ user: session.user, loading: false });
    await useAuthStore.getState().refreshProfile();
  } else {
    set({ user: null, profile: null, loading: false });
  }
});
