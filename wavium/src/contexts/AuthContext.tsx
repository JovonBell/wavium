/**
 * Auth context provider for app-wide authentication state.
 *
 * Wraps the useAuth hook in a React Context for:
 * - Single source of truth for auth state
 * - Avoid prop drilling
 * - Access auth methods throughout the app
 */
import React, { createContext, useContext, ReactNode } from "react"
import { Session, User } from "@supabase/supabase-js"
import { useAuth } from "@/hooks/useAuth"
import * as authMethods from "@/lib/auth"

interface AuthContextValue {
  /** Current session (null if not authenticated) */
  session: Session | null
  /** Current user (null if not authenticated) */
  user: User | null
  /** True while loading initial session */
  loading: boolean
  /** True when user clicked password reset link */
  isPasswordRecovery: boolean
  /** Sign up with email and password */
  signUp: typeof authMethods.signUp
  /** Sign in with email and password */
  signIn: typeof authMethods.signIn
  /** Sign out current user */
  signOut: typeof authMethods.signOut
  /** Request password reset email */
  resetPassword: typeof authMethods.resetPassword
  /** Update password (after reset link clicked) */
  updatePassword: typeof authMethods.updatePassword
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Provider component that wraps app with auth state.
 *
 * @example
 * // In app root (_layout.tsx)
 * export default function RootLayout() {
 *   return (
 *     <AuthProvider>
 *       <Stack />
 *     </AuthProvider>
 *   )
 * }
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useAuth()

  const value: AuthContextValue = {
    ...authState,
    signUp: authMethods.signUp,
    signIn: authMethods.signIn,
    signOut: authMethods.signOut,
    resetPassword: authMethods.resetPassword,
    updatePassword: authMethods.updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context.
 *
 * Must be used within AuthProvider.
 *
 * @example
 * const { user, signOut } = useAuthContext()
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }

  return context
}
