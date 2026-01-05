/**
 * WAVIUM - Simplified Store
 * Focused on what matters: creating and playing subliminals
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface MindiStoreState {
  // Identity
  name: string;
  userId: string | null;

  // Mindi state
  currentState: MindiState;

  // Library of saved subliminals
  subliminals: Subliminal[];

  // Current creation flow
  creation: CreationState;

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

  // Subliminal library actions
  saveSubliminal: (title: string, audioUrl: string) => Subliminal;
  deleteSubliminal: (id: string) => void;
  getSubliminal: (id: string) => Subliminal | undefined;

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

      // Library
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

      // Reset onboarding state (for development/testing)
      resetOnboarding: () => set({
        userId: null,
        name: 'Mindi',
        subliminals: [],
        creation: { ...initialCreation },
      }),
    }),
    {
      name: 'wavium-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
