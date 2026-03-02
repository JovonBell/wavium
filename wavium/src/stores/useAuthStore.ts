/**
 * WAVIUM - Auth Store
 * Manages Supabase authentication state (runtime only — Supabase handles session persistence)
 */

import { create } from 'zustand';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

/**
 * Map common Supabase error messages to user-friendly text
 */
function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('user already registered')) {
    return 'An account with this email already exists.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your email and confirm your account first.';
  }
  if (lower.includes('password') && lower.includes('at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }
  return message;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      // Restore existing session from AsyncStorage
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('Error restoring session:', error.message);
      }

      set({
        session: session ?? null,
        user: session?.user ?? null,
        initialized: true,
      });

      // Listen for auth state changes (sign in, sign out, token refresh)
      supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          set({
            session: session ?? null,
            user: session?.user ?? null,
          });
        }
      );
    } catch (err) {
      console.warn('Auth initialization error:', err);
      set({ initialized: true });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        set({ loading: false });
        return { error: friendlyError(error.message) };
      }

      // If email confirmation is required, user won't have a session yet
      // The onAuthStateChange listener handles the case where session is created immediately
      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({ loading: false });
      return { error: friendlyError(err.message || 'An unexpected error occurred.') };
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ loading: false });
        return { error: friendlyError(error.message) };
      }

      // onAuthStateChange listener will update session/user
      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({ loading: false });
      return { error: friendlyError(err.message || 'An unexpected error occurred.') };
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      // onAuthStateChange listener will clear session/user
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        set({ loading: false });
        return { error: friendlyError(error.message) };
      }

      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({ loading: false });
      return { error: friendlyError(err.message || 'An unexpected error occurred.') };
    }
  },

  deleteAccount: async () => {
    const { session, user } = get();
    if (!session || !user) {
      return { error: 'Not authenticated' };
    }

    set({ loading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        set({ loading: false });
        return { error: data.detail || 'Failed to delete account' };
      }

      // Sign out locally after successful deletion
      await supabase.auth.signOut();
      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({ loading: false });
      return { error: friendlyError(err.message || 'Failed to delete account.') };
    }
  },
}));
