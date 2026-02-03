/**
 * WAVIUM - Simplified Store
 * Focused on what matters: creating and playing subliminals
 * Integrates with Supabase for persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveSubliminal as saveSubliminalToSupabase,
  deleteSubliminal as deleteSubliminalFromSupabase,
} from '@/services/subliminalService';

// Mindi's current state (for animations)
export type MindiState =
  | 'idle'
  | 'listening'
  | 'peaceful'
  | 'happy'
  | 'excited'
  | 'generating';

// Sound track options
export type SoundTrack =
  | 'ocean-waves'
  | 'rainfall'
  | 'deep-focus'
  | 'cosmic-drift';

export const SOUND_TRACKS: Record<SoundTrack, { name: string; description: string; frequency: string; voice: string }> = {
  'ocean-waves': {
    name: 'Ocean Waves',
    description: 'Gentle waves with theta frequencies',
    frequency: 'Theta (4-8Hz)',
    voice: 'jenny', // Warm, female
  },
  'rainfall': {
    name: 'Rainfall',
    description: 'Soft rain with alpha waves',
    frequency: 'Alpha (8-12Hz)',
    voice: 'aria', // Soft, female
  },
  'deep-focus': {
    name: 'Deep Focus',
    description: 'Pure binaural beats',
    frequency: 'Gamma (40Hz)',
    voice: 'guy', // Calm, male
  },
  'cosmic-drift': {
    name: 'Cosmic Drift',
    description: 'Ambient space sounds with delta waves',
    frequency: 'Delta (0.5-4Hz)',
    voice: 'sonia', // UK, female
  },
};

// A saved subliminal
export interface Subliminal {
  id: string;
  title: string;
  intention: string;
  affirmations: string[];
  track: SoundTrack;
  audioUrl: string;
  createdAt: string;
}

// Current creation in progress
export interface CreationState {
  intention: string;
  affirmations: string[];
  selectedTrack: SoundTrack | null;
  audioUrl: string | null;
}

// Evolution state from Mindi
export interface EvolutionState {
  xp: number;
  glowLevel: number;
  totalSessions: number;
  totalMinutes: number;
}

// Streak data from sessions
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

interface MindiStoreState {
  // Identity
  name: string;
  userId: string | null;

  // Mindi state
  currentState: MindiState;

  // Library of saved subliminals (synced from Supabase)
  subliminals: Subliminal[];

  // Current creation flow
  creation: CreationState;

  // Evolution state (synced from Supabase)
  xp: number;
  glowLevel: number;
  totalSessions: number;
  totalMinutes: number;

  // Streak data (synced from Supabase)
  currentStreak: number;
  longestStreak: number;

  // Actions
  setName: (name: string) => void;
  setUserId: (id: string) => void;
  setCurrentState: (state: MindiState) => void;

  // Creation flow actions
  setIntention: (intention: string) => void;
  setAffirmations: (affirmations: string[]) => void;
  setSelectedTrack: (track: SoundTrack) => void;
  setAudioUrl: (audioUrl: string) => void;
  clearCreation: () => void;

  // Subliminal library actions (Supabase-backed)
  setSubliminals: (subliminals: Subliminal[]) => void;
  saveSubliminalToDb: (title: string, audioUrl: string) => Promise<Subliminal>;
  deleteSubliminalFromDb: (id: string) => Promise<void>;
  /**
   * @deprecated Use saveSubliminalToDb instead. This is kept for offline fallback.
   */
  saveSubliminal: (title: string, audioUrl: string) => Subliminal;
  deleteSubliminal: (id: string) => void;
  getSubliminal: (id: string) => Subliminal | undefined;

  // Evolution state actions
  setEvolutionState: (state: EvolutionState) => void;
  setStreakData: (data: StreakData) => void;

  // Reset for development/testing
  resetOnboarding: () => void;
}

const initialCreation: CreationState = {
  intention: '',
  affirmations: [],
  selectedTrack: null,
  audioUrl: null,
};

export const useMindiStore = create<MindiStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      name: 'Mindi',
      userId: null,
      currentState: 'idle',
      subliminals: [],
      creation: { ...initialCreation },

      // Evolution state defaults
      xp: 0,
      glowLevel: 1,
      totalSessions: 0,
      totalMinutes: 0,

      // Streak data defaults
      currentStreak: 0,
      longestStreak: 0,

      // Actions
      setName: (name) => set({ name }),
      setUserId: (id) => set({ userId: id }),
      setCurrentState: (state) => set({ currentState: state }),

      // Creation flow
      setIntention: (intention) =>
        set((state) => ({
          creation: { ...state.creation, intention },
        })),

      setAffirmations: (affirmations) =>
        set((state) => ({
          creation: { ...state.creation, affirmations },
        })),

      setSelectedTrack: (track) =>
        set((state) => ({
          creation: { ...state.creation, selectedTrack: track },
        })),

      setAudioUrl: (audioUrl) =>
        set((state) => ({
          creation: { ...state.creation, audioUrl },
        })),

      clearCreation: () => set({ creation: { ...initialCreation } }),

      // Subliminal library (Supabase-backed)
      setSubliminals: (subliminals) => set({ subliminals }),

      saveSubliminalToDb: async (title, audioUrl) => {
        const { creation } = get();
        const newSubliminal = await saveSubliminalToSupabase({
          title,
          intention: creation.intention,
          affirmations: creation.affirmations,
          track: creation.selectedTrack || 'ocean-waves',
          audioUrl,
        });

        // Clear creation state after successful save
        set({ creation: { ...initialCreation } });

        return newSubliminal;
      },

      deleteSubliminalFromDb: async (id) => {
        await deleteSubliminalFromSupabase(id);
        // Note: Realtime subscription will update the subliminals array
      },

      /**
       * @deprecated Use saveSubliminalToDb instead. This is kept for offline fallback.
       */
      saveSubliminal: (title, audioUrl) => {
        const { creation, subliminals } = get();
        const newSubliminal: Subliminal = {
          id: Date.now().toString(),
          title,
          intention: creation.intention,
          affirmations: creation.affirmations,
          track: creation.selectedTrack || 'ocean-waves',
          audioUrl,
          createdAt: new Date().toISOString(),
        };

        set({
          subliminals: [newSubliminal, ...subliminals],
          creation: { ...initialCreation },
        });

        return newSubliminal;
      },

      deleteSubliminal: (id) =>
        set((state) => ({
          subliminals: state.subliminals.filter((s) => s.id !== id),
        })),

      getSubliminal: (id) => get().subliminals.find((s) => s.id === id),

      // Evolution state actions
      setEvolutionState: (evolutionState) =>
        set({
          xp: evolutionState.xp,
          glowLevel: evolutionState.glowLevel,
          totalSessions: evolutionState.totalSessions,
          totalMinutes: evolutionState.totalMinutes,
        }),

      setStreakData: (streakData) =>
        set({
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
        }),

      // Reset onboarding state (for development/testing)
      resetOnboarding: () => set({
        userId: null,
        name: 'Mindi',
        subliminals: [],
        creation: { ...initialCreation },
        xp: 0,
        glowLevel: 1,
        totalSessions: 0,
        totalMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
      }),
    }),
    {
      name: 'wavium-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only local state - subliminals come from Supabase
      partialize: (state) => ({
        name: state.name,
        userId: state.userId,
        currentState: state.currentState,
        creation: state.creation,
        // Persist evolution state for offline access
        xp: state.xp,
        glowLevel: state.glowLevel,
        totalSessions: state.totalSessions,
        totalMinutes: state.totalMinutes,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
      }),
    }
  )
);
