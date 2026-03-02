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
  | 'cosmic-drift'
  | 'lofi-chill'
  | 'lofi-dream'
  | 'lofi-jazz'
  | 'zen-garden'
  | 'night-drive'
  | 'forest-dawn';

export const SOUND_TRACKS: Record<SoundTrack, { name: string; description: string; frequency: string }> = {
  'ocean-waves': {
    name: 'Ocean Waves',
    description: 'Gentle waves with theta frequencies',
    frequency: 'Theta (4-8Hz)',
  },
  'rainfall': {
    name: 'Rainfall',
    description: 'Soft rain with alpha waves',
    frequency: 'Alpha (8-12Hz)',
  },
  'deep-focus': {
    name: 'Deep Focus',
    description: 'Pure binaural beats',
    frequency: 'Gamma (40Hz)',
  },
  'cosmic-drift': {
    name: 'Cosmic Drift',
    description: 'Ambient space sounds with delta waves',
    frequency: 'Delta (0.5-4Hz)',
  },
  'lofi-chill': {
    name: 'Lofi Chill',
    description: 'Warm lofi hip-hop vibes',
    frequency: '85 BPM',
  },
  'lofi-dream': {
    name: 'Lofi Dream',
    description: 'Dreamy lofi with hazy pads',
    frequency: '75 BPM',
  },
  'lofi-jazz': {
    name: 'Lofi Jazz',
    description: 'Jazz-inspired mellow beats',
    frequency: '80 BPM',
  },
  'zen-garden': {
    name: 'Zen Garden',
    description: 'Singing bowls & meditation tones',
    frequency: 'Solfeggio',
  },
  'night-drive': {
    name: 'Night Drive',
    description: 'Dark synth ambient atmosphere',
    frequency: '65 Hz drone',
  },
  'forest-dawn': {
    name: 'Forest Dawn',
    description: 'Morning birdsong & gentle wind',
    frequency: 'Natural',
  },
};

// Voice options
export type VoiceId = 'ava' | 'emma' | 'andrew' | 'sonia' | 'brian';

export const VOICES: Record<VoiceId, { name: string; gender: 'male' | 'female'; description: string; icon: string }> = {
  'ava': { name: 'Ava', gender: 'female', description: 'Warm & smooth', icon: 'person-circle' },
  'emma': { name: 'Emma', gender: 'female', description: 'Gentle & soothing', icon: 'person-circle' },
  'andrew': { name: 'Andrew', gender: 'male', description: 'Calm & deep', icon: 'person-circle' },
  'sonia': { name: 'Sonia', gender: 'female', description: 'Warm & elegant', icon: 'person-circle' },
  'brian': { name: 'Brian', gender: 'male', description: 'Steady & reassuring', icon: 'person-circle' },
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

// Streak tracking
export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // ISO date string (YYYY-MM-DD)
  totalSessions: number;
}

// Current creation in progress
export interface CreationState {
  intention: string;
  affirmations: string[];
  selectedTrack: SoundTrack | null;
  selectedVoice: VoiceId | null;
  audioUrl: string | null;
}

interface MindiStoreState {
  // Identity
  name: string;
  userId: string | null;
  userName: string;

  // Mindi state
  currentState: MindiState;

  // Persisted player settings
  voiceVolume: number;
  backgroundVolume: number;

  // Library of saved subliminals
  subliminals: Subliminal[];

  // Current creation flow
  creation: CreationState;

  // Streak
  streak: StreakState;

  // Actions
  setName: (name: string) => void;
  setUserId: (id: string) => void;
  setUserName: (name: string) => void;
  setVoiceVolume: (v: number) => void;
  setBackgroundVolume: (v: number) => void;
  setCurrentState: (state: MindiState) => void;

  // Creation flow actions
  setIntention: (intention: string) => void;
  setAffirmations: (affirmations: string[]) => void;
  setSelectedTrack: (track: SoundTrack) => void;
  setSelectedVoice: (voice: VoiceId) => void;
  setAudioUrl: (audioUrl: string) => void;
  clearCreation: () => void;

  // Subliminal library actions
  saveSubliminal: (title: string, audioUrl: string) => Subliminal;
  deleteSubliminal: (id: string) => void;
  getSubliminal: (id: string) => Subliminal | undefined;

  // Streak actions
  checkInToday: () => { isNewDay: boolean; streakBroken: boolean };

  // Reset for development/testing
  resetOnboarding: () => void;
}

const initialCreation: CreationState = {
  intention: '',
  affirmations: [],
  selectedTrack: null,
  selectedVoice: null,
  audioUrl: null,
};

const initialStreak: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  totalSessions: 0,
};

function getToday(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export const useMindiStore = create<MindiStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      name: 'Mindi',
      userId: null,
      userName: '',
      currentState: 'idle',
      voiceVolume: 0.15,
      backgroundVolume: 0.7,
      subliminals: [],
      creation: { ...initialCreation },
      streak: { ...initialStreak },

      // Actions
      setName: (name) => set({ name }),
      setUserId: (id) => set({ userId: id }),
      setUserName: (name) => set({ userName: name }),
      setCurrentState: (state) => set({ currentState: state }),
      setVoiceVolume: (v) => set({ voiceVolume: v }),
      setBackgroundVolume: (v) => set({ backgroundVolume: v }),

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

      setSelectedVoice: (voice) =>
        set((state) => ({
          creation: { ...state.creation, selectedVoice: voice },
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

      // Streak: call on app open / session start
      checkInToday: () => {
        const { streak } = get();
        const today = getToday();
        const yesterday = getYesterday();

        // Already checked in today
        if (streak.lastActiveDate === today) {
          return { isNewDay: false, streakBroken: false };
        }

        let newStreak = streak.currentStreak;
        let streakBroken = false;

        if (streak.lastActiveDate === yesterday) {
          // Consecutive day — keep the streak going
          newStreak = streak.currentStreak + 1;
        } else if (streak.lastActiveDate === null) {
          // First ever check-in
          newStreak = 1;
        } else {
          // Missed a day — streak breaks, start fresh
          newStreak = 1;
          streakBroken = streak.currentStreak > 1;
        }

        const newLongest = Math.max(streak.longestStreak, newStreak);

        set({
          streak: {
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastActiveDate: today,
            totalSessions: streak.totalSessions + 1,
          },
        });

        return { isNewDay: true, streakBroken };
      },

      // Reset onboarding state (for development/testing and logout)
      resetOnboarding: () => set({
        userId: null,
        userName: '',
        name: 'Mindi',
        subliminals: [],
        creation: { ...initialCreation },
        streak: { ...initialStreak },
      }),
    }),
    {
      name: 'wavium-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
