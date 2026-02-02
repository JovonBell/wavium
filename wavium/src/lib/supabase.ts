/**
 * Supabase client configuration
 * Configured for React Native with encrypted session storage
 */
import "react-native-url-polyfill/auto"
import { createClient } from "@supabase/supabase-js"
import { AppState, AppStateStatus } from "react-native"
import * as SessionStorage from "@/utils/storage/SessionStorage"

// Environment variables (set via .env or app.config.js)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY"
  )
}

/**
 * Supabase client singleton
 *
 * Configuration:
 * - storage: Encrypted MMKV storage for session persistence
 * - autoRefreshToken: Automatically refresh tokens before expiry
 * - persistSession: Persist session across app restarts
 * - detectSessionInUrl: false (required for React Native - no URL bar)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

/**
 * AppState listener for battery optimization
 * Stops token refresh when app is in background to save battery
 */
const handleAppStateChange = (nextAppState: AppStateStatus) => {
  if (nextAppState === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
}

// Register AppState listener
AppState.addEventListener("change", handleAppStateChange)
