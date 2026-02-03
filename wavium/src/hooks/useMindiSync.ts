/**
 * useMindiSync Hook
 * Auth-aware sync for Mindi state and subliminals
 * Syncs data from Supabase when user logs in
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMindiStore } from '@/stores/useMindiStore';
import { useSyncedLibrary } from '@/hooks/useSyncedLibrary';
import { getMindiState } from '@/services/mindiService';
import { getUserStreak } from '@/services/sessionService';

export interface UseMindiSyncResult {
  loading: boolean;
  error: Error | null;
}

/**
 * useMindiSync - Syncs Mindi state and subliminals on auth change
 *
 * @returns { loading, error }
 *
 * Features:
 * - Syncs subliminals via useSyncedLibrary (Realtime subscription)
 * - Fetches Mindi state (name, xp, glowLevel) on login
 * - Fetches streak data on login
 * - Updates Zustand store with server data
 *
 * Usage:
 * Call this hook at app root level (inside AuthProvider/RootNavigator)
 */
export function useMindiSync(): UseMindiSyncResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get auth state
  const { user } = useAuth();

  // Get store actions
  const setSubliminals = useMindiStore((state) => state.setSubliminals);
  const setName = useMindiStore((state) => state.setName);
  const setEvolutionState = useMindiStore((state) => state.setEvolutionState);
  const setStreakData = useMindiStore((state) => state.setStreakData);

  // Use synced library hook for realtime subliminal sync
  const { subliminals, loading: libraryLoading } = useSyncedLibrary(user?.id ?? null);

  // Sync subliminals to store when they change
  useEffect(() => {
    setSubliminals(subliminals);
  }, [subliminals, setSubliminals]);

  // Fetch Mindi state and streak data on user login
  useEffect(() => {
    if (!user?.id) {
      // User logged out - no sync needed
      return;
    }

    let cancelled = false;

    async function syncMindiData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch Mindi state and streak in parallel
        const [mindiState, streakData] = await Promise.all([
          getMindiState(),
          getUserStreak(),
        ]);

        if (cancelled) return;

        // Update store with server data
        if (mindiState) {
          setName(mindiState.name);
          setEvolutionState({
            xp: mindiState.xp,
            glowLevel: mindiState.glowLevel,
            totalSessions: mindiState.totalSessions,
            totalMinutes: mindiState.totalMinutes,
          });
        }

        if (streakData) {
          setStreakData({
            currentStreak: streakData.currentStreak,
            longestStreak: streakData.longestStreak,
          });
        }
      } catch (err) {
        if (cancelled) return;
        console.warn('Mindi sync error:', err);
        setError(err instanceof Error ? err : new Error('Failed to sync Mindi data'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    syncMindiData();

    return () => {
      cancelled = true;
    };
  }, [user?.id, setName, setEvolutionState, setStreakData]);

  return {
    loading: loading || libraryLoading,
    error,
  };
}
