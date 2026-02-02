/**
 * Authentication methods for Supabase auth.
 *
 * All methods throw on error - catch in UI layer for user feedback.
 * Deep links configured in app.json handle email verification and password reset callbacks.
 */
import { supabase } from "./supabase"
import * as Linking from "expo-linking"

/**
 * Sign up a new user with email and password.
 *
 * After signup:
 * - User receives verification email
 * - Email contains link: wavium://auth-callback?...
 * - App handles deep link in AuthContext
 *
 * @throws Error if signup fails (e.g., email already registered)
 */
export async function signUp(email: string, password: string) {
  const redirectUrl = Linking.createURL("auth-callback")

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in with email and password.
 *
 * Session is automatically persisted to encrypted storage.
 *
 * @throws Error if credentials invalid
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Sign out the current user.
 *
 * Clears session from encrypted storage.
 *
 * @throws Error if signout fails
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Request password reset email.
 *
 * Email contains link: wavium://reset-password?...
 * App handles deep link and shows password update form.
 *
 * @throws Error if email not found or rate limited
 */
export async function resetPassword(email: string) {
  const redirectUrl = Linking.createURL("reset-password")

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) throw error
  return data
}

/**
 * Update password for authenticated user.
 *
 * Called after user clicks reset link and enters new password.
 * Requires active session (from PASSWORD_RECOVERY event).
 *
 * @throws Error if not authenticated or password invalid
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
  return data
}

/**
 * Get current session (if exists).
 * Returns null if no active session.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/**
 * Get current user (if authenticated).
 * Returns null if no active session.
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  return user
}
