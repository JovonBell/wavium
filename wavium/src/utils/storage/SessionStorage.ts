/**
 * Encrypted session storage for Supabase auth
 * Uses MMKV for fast storage with encryption key held in SecureStore
 *
 * Why MMKV over AsyncStorage:
 * - 30x faster read/write performance
 * - Native encryption support
 * - Sessions can exceed SecureStore's 2KB limit
 */
import { MMKV } from "react-native-mmkv"
import * as SecureStore from "expo-secure-store"
import * as Crypto from "expo-crypto"

const ENCRYPTION_KEY_NAME = "supabase-session-key"

/**
 * Get or create the encryption key for session storage.
 * Key is stored in device Keychain (iOS) / Keystore (Android).
 */
const getOrCreateEncryptionKey = (): string => {
  const existing = SecureStore.getItem(ENCRYPTION_KEY_NAME)
  if (existing) return existing

  // Generate new encryption key using expo-crypto
  const key = Crypto.randomUUID()
  SecureStore.setItem(ENCRYPTION_KEY_NAME, key)
  return key
}

// Initialize encrypted MMKV storage
const storage = new MMKV({
  id: "supabase-session",
  encryptionKey: getOrCreateEncryptionKey(),
})

/**
 * Supabase-compatible storage interface
 * Matches the Storage interface expected by @supabase/supabase-js
 */
export const getItem = (key: string): string | null => {
  return storage.getString(key) ?? null
}

export const setItem = (key: string, value: string): void => {
  storage.set(key, value)
}

export const removeItem = (key: string): void => {
  storage.delete(key)
}
