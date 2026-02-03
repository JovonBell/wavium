/**
 * useSyncedLibrary Hook
 * Realtime-synced subliminal library for cross-device updates
 * Subscribes to Supabase Realtime for INSERT/UPDATE/DELETE events
 */
import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Subliminal, SoundTrack } from "@/stores/useMindiStore"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

/**
 * Database row type (snake_case from PostgreSQL)
 */
interface SubliminalRow {
  id: string
  user_id: string
  title: string
  intention: string
  affirmations: string[]
  track: string
  audio_url: string
  created_at: string
  updated_at: string
}

/**
 * Transform database row to app Subliminal type
 * Converts snake_case to camelCase
 */
function transformRow(row: SubliminalRow): Subliminal {
  return {
    id: row.id,
    title: row.title,
    intention: row.intention,
    affirmations: row.affirmations,
    track: row.track as SoundTrack,
    audioUrl: row.audio_url,
    createdAt: row.created_at,
  }
}

/**
 * Hook return type
 */
export interface UseSyncedLibraryResult {
  subliminals: Subliminal[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * useSyncedLibrary - Realtime-synced subliminal library
 *
 * @param userId - User ID to subscribe to (null = no subscription)
 * @returns { subliminals, loading, error, refetch }
 *
 * Features:
 * - Initial fetch on mount
 * - Realtime subscription for INSERT/UPDATE/DELETE
 * - Automatic cleanup on unmount
 * - Manual refetch function
 */
export function useSyncedLibrary(userId: string | null): UseSyncedLibraryResult {
  const [subliminals, setSubliminals] = useState<Subliminal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch all subliminals for the user
   */
  const fetchSubliminals = useCallback(async () => {
    if (!userId) {
      setSubliminals([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("subliminals")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw new Error(`Failed to fetch subliminals: ${fetchError.message}`)
      }

      setSubliminals((data as SubliminalRow[]).map(transformRow))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [userId])

  /**
   * Set up Realtime subscription and initial fetch
   */
  useEffect(() => {
    // No user = no subscription
    if (!userId) {
      setSubliminals([])
      setLoading(false)
      return
    }

    // Fetch initial data
    fetchSubliminals()

    // Create Realtime channel for this user's subliminals
    const channel: RealtimeChannel = supabase
      .channel(`subliminals:user:${userId}`)
      .on<SubliminalRow>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subliminals",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<SubliminalRow>) => {
          const { eventType, new: newRow, old: oldRow } = payload

          if (eventType === "INSERT" && newRow) {
            // Prepend new subliminal to list
            setSubliminals((prev) => [transformRow(newRow as SubliminalRow), ...prev])
          } else if (eventType === "UPDATE" && newRow) {
            // Replace updated subliminal in list
            setSubliminals((prev) =>
              prev.map((s) =>
                s.id === (newRow as SubliminalRow).id
                  ? transformRow(newRow as SubliminalRow)
                  : s
              )
            )
          } else if (eventType === "DELETE" && oldRow) {
            // Remove deleted subliminal from list
            setSubliminals((prev) =>
              prev.filter((s) => s.id !== (oldRow as { id: string }).id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup on unmount or userId change
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchSubliminals])

  return {
    subliminals,
    loading,
    error,
    refetch: fetchSubliminals,
  }
}
