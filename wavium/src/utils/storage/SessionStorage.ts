/**
 * Encrypted session storage for Supabase auth
 * Uses expo-secure-store for Expo Go compatibility
 *
 * Note: expo-secure-store has a 2KB limit per value, which is
 * typically sufficient for JWT tokens. For larger data, consider
 * using react-native-mmkv in a development build.
 */
import * as SecureStore from "expo-secure-store"

/**
 * Supabase-compatible storage interface
 * Matches the Storage interface expected by @supabase/supabase-js
 */
export const getItem = (key: string): string | null => {
  try {
    return SecureStore.getItem(key)
  } catch (error) {
    console.warn("SecureStore getItem error:", error)
    return null
  }
}

export const setItem = (key: string, value: string): void => {
  try {
    SecureStore.setItem(key, value)
  } catch (error) {
    console.warn("SecureStore setItem error:", error)
  }
}

export const removeItem = (key: string): void => {
  try {
    SecureStore.deleteItemAsync(key)
  } catch (error) {
    console.warn("SecureStore removeItem error:", error)
  }
}
