/**
 * Subliminal Service
 * CRUD operations for subliminal audio records
 * Uses Supabase client with RLS for user isolation
 */
import { supabase } from "@/lib/supabase"
import type { Subliminal, SoundTrack } from "@/stores/useMindiStore"

/**
 * Input type for creating a new subliminal
 */
export interface CreateSubliminalInput {
  title: string
  intention: string
  affirmations: string[]
  track: SoundTrack
  audioUrl: string
}

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
 * Save a new subliminal to the database
 * @throws Error if not authenticated or insert fails
 */
export async function saveSubliminal(input: CreateSubliminalInput): Promise<Subliminal> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Not authenticated")
  }

  // Insert into subliminals table
  const { data, error } = await supabase
    .from("subliminals")
    .insert({
      user_id: user.id,
      title: input.title,
      intention: input.intention,
      affirmations: input.affirmations,
      track: input.track,
      audio_url: input.audioUrl,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save subliminal: ${error.message}`)
  }

  return transformRow(data as SubliminalRow)
}

/**
 * Delete a subliminal by ID
 * RLS ensures users can only delete their own subliminals
 * @throws Error if delete fails
 */
export async function deleteSubliminal(id: string): Promise<void> {
  const { error } = await supabase
    .from("subliminals")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to delete subliminal: ${error.message}`)
  }
}

/**
 * Get all subliminals for the current user
 * RLS automatically filters to current user's subliminals
 * @returns Array of subliminals ordered by creation date (newest first)
 */
export async function getUserSubliminals(): Promise<Subliminal[]> {
  const { data, error } = await supabase
    .from("subliminals")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch subliminals: ${error.message}`)
  }

  return (data as SubliminalRow[]).map(transformRow)
}
