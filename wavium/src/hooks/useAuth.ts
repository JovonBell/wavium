/**
 * Auth state hook with session management.
 *
 * Handles:
 * - Initial session loading from encrypted storage
 * - Real-time auth state changes
 * - Password recovery flow detection
 * - Deep link handling for auth callbacks
 */
import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Session, AuthChangeEvent, User } from "@supabase/supabase-js"
import * as Linking from "expo-linking"

interface AuthState {
  /** Current session (null if not authenticated) */
  session: Session | null
  /** Current user (null if not authenticated) */
  user: User | null
  /** True while loading initial session */
  loading: boolean
  /** True when user clicked password reset link */
  isPasswordRecovery: boolean
}

/**
 * Hook for accessing authentication state.
 *
 * @example
 * const { session, user, loading, isPasswordRecovery } = useAuth()
 *
 * if (loading) return <LoadingScreen />
 * if (!session) return <LoginScreen />
 * if (isPasswordRecovery) return <UpdatePasswordScreen />
 * return <MainApp />
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  /**
   * Handle deep links from email verification and password reset.
   */
  const handleDeepLink = useCallback(async (url: string) => {
    const { queryParams } = Linking.parse(url)

    // Handle auth callback with tokens
    if (queryParams?.access_token && queryParams?.refresh_token) {
      try {
        await supabase.auth.setSession({
          access_token: queryParams.access_token as string,
          refresh_token: queryParams.refresh_token as string,
        })
      } catch (error) {
        console.error("Failed to set session from deep link:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Get initial session from encrypted storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)

        // Detect password recovery flow
        if (event === "PASSWORD_RECOVERY") {
          setIsPasswordRecovery(true)
        } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          setIsPasswordRecovery(false)
        }
      }
    )

    // Listen for deep links
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url)
    })

    // Check for initial deep link (app opened via link)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url)
    })

    return () => {
      subscription.unsubscribe()
      linkingSubscription.remove()
    }
  }, [handleDeepLink])

  return { session, user, loading, isPasswordRecovery }
}
