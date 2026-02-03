/**
 * Mindi Service
 * Handles Mindi character state persistence and XP progression
 */

import { supabase } from "@/lib/supabase"

// Database row type (snake_case from Supabase)
interface MindiStateRow {
  id: string
  user_id: string
  name: string
  xp: number
  glow_level: number
  total_sessions: number
  total_minutes: number
  created_at: string
  updated_at: string
}

// App type (camelCase for React Native)
export interface MindiStateData {
  id: string
  userId: string
  name: string
  xp: number
  glowLevel: number
  totalSessions: number
  totalMinutes: number
  createdAt: string
  updatedAt: string
}

/**
 * Transform database row to app type
 */
function transformMindiState(row: MindiStateRow): MindiStateData {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    xp: row.xp,
    glowLevel: row.glow_level,
    totalSessions: row.total_sessions,
    totalMinutes: row.total_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Get current user's Mindi state
 * Note: mindi_state is auto-created by database trigger on signup
 */
export async function getMindiState(): Promise<MindiStateData> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("mindi_state")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error) {
    throw new Error(`Failed to get Mindi state: ${error.message}`)
  }

  return transformMindiState(data as MindiStateRow)
}

/**
 * Update Mindi's state fields
 * Can update name, xp, glow_level, etc.
 */
export async function updateMindiState(
  updates: Partial<
    Pick<MindiStateData, "name" | "xp" | "glowLevel" | "totalSessions" | "totalMinutes">
  >
): Promise<MindiStateData> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Transform camelCase to snake_case for database
  const dbUpdates: Partial<MindiStateRow> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.xp !== undefined) dbUpdates.xp = updates.xp
  if (updates.glowLevel !== undefined) dbUpdates.glow_level = updates.glowLevel
  if (updates.totalSessions !== undefined) dbUpdates.total_sessions = updates.totalSessions
  if (updates.totalMinutes !== undefined) dbUpdates.total_minutes = updates.totalMinutes

  const { data, error } = await supabase
    .from("mindi_state")
    .update(dbUpdates)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update Mindi state: ${error.message}`)
  }

  return transformMindiState(data as MindiStateRow)
}

/**
 * Update Mindi's name
 * Convenience function for name-only updates
 */
export async function updateMindiName(name: string): Promise<MindiStateData> {
  return updateMindiState({ name })
}

/**
 * Add XP from a completed session via RPC
 * Atomically updates XP, total_sessions, total_minutes, and recalculates glow_level
 */
export async function addSessionXP(xp: number, minutes: number): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase.rpc("add_session_xp", {
    p_user_id: user.id,
    p_xp: xp,
    p_minutes: minutes,
  })

  if (error) {
    throw new Error(`Failed to add session XP: ${error.message}`)
  }
}
