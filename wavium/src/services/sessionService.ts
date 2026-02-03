/**
 * Session Service
 * Handles recording listening history and user streak tracking
 */

import { supabase } from "@/lib/supabase"

// Database row type (snake_case from Supabase)
interface SessionRow {
  id: string
  user_id: string
  subliminal_id: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number
  completed: boolean
  created_at: string
}

// App type (camelCase for React Native)
export interface Session {
  id: string
  userId: string
  subliminalId: string | null
  startedAt: string
  endedAt: string | null
  durationSeconds: number
  completed: boolean
  createdAt: string
}

// Streak data returned by get_user_streak RPC
export interface UserStreak {
  currentStreak: number
  longestStreak: number
  lastSessionDate: string | null
}

/**
 * Transform database row to app type
 */
function transformSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    subliminalId: row.subliminal_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    completed: row.completed,
    createdAt: row.created_at,
  }
}

/**
 * Start a new listening session
 * Returns the created session record
 */
export async function startSession(subliminalId: string): Promise<Session> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      subliminal_id: subliminalId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to start session: ${error.message}`)
  }

  return transformSession(data as SessionRow)
}

/**
 * End an existing session
 * Updates duration and completion status
 */
export async function endSession(
  sessionId: string,
  durationSeconds: number,
  completed: boolean
): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      completed,
    })
    .eq("id", sessionId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to end session: ${error.message}`)
  }

  return transformSession(data as SessionRow)
}

/**
 * Get user's streak information via RPC
 * Returns current streak, longest streak, and last session date
 */
export async function getUserStreak(): Promise<UserStreak> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase.rpc("get_user_streak", {
    p_user_id: user.id,
  })

  if (error) {
    throw new Error(`Failed to get user streak: ${error.message}`)
  }

  // RPC returns array, get first row (or defaults if no sessions)
  const row = data?.[0]

  return {
    currentStreak: row?.current_streak ?? 0,
    longestStreak: row?.longest_streak ?? 0,
    lastSessionDate: row?.last_session_date ?? null,
  }
}

/**
 * Get user's session history
 * Returns sessions ordered by most recent first
 */
export async function getSessionHistory(limit = 50): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to get session history: ${error.message}`)
  }

  return (data as SessionRow[]).map(transformSession)
}
