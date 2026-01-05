/**
 * WAVIUM Design System - Colors
 * Time-shifting theme with 4 variants
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceGlow: string;

  // Accents
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;

  // Mindi
  mindiBase: string;
  mindiGlow: string;
  mindiHighlight: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // States
  success: string;
  error: string;
  warning: string;

  // Particles
  particlePrimary: string;
  particleSecondary: string;
}

// Morning Theme (5am - 12pm): Warm, fresh, awakening
export const morningTheme: ThemeColors = {
  background: '#1a1520',
  backgroundAlt: '#2d1f35',
  surface: '#2a2035',
  surfaceGlow: 'rgba(255, 179, 102, 0.1)',

  primary: '#ffb366',
  primaryLight: '#ffd699',
  secondary: '#ff9f43',
  accent: '#ffe4b3',

  mindiBase: '#ffd4e0',
  mindiGlow: '#ffb366',
  mindiHighlight: '#fff5eb',

  textPrimary: '#fff5eb',
  textSecondary: '#ccb399',
  textMuted: '#998866',

  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',

  particlePrimary: '#ffe4b3',
  particleSecondary: '#ffb366',
};

// Afternoon Theme (12pm - 5pm): Clear, balanced, focused
export const afternoonTheme: ThemeColors = {
  background: '#0f0f1a',
  backgroundAlt: '#151525',
  surface: '#1a1a2e',
  surfaceGlow: 'rgba(167, 139, 250, 0.1)',

  primary: '#a78bfa',
  primaryLight: '#c4b5fd',
  secondary: '#60a5fa',
  accent: '#f0abfc',

  mindiBase: '#fbc7d4',
  mindiGlow: '#e879f9',
  mindiHighlight: '#ffe4ec',

  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',

  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',

  particlePrimary: '#f0abfc',
  particleSecondary: '#a78bfa',
};

// Evening Theme (5pm - 9pm): Golden hour, warm, relaxing
export const eveningTheme: ThemeColors = {
  background: '#1a1210',
  backgroundAlt: '#2a1a15',
  surface: '#2a1f1a',
  surfaceGlow: 'rgba(245, 158, 11, 0.1)',

  primary: '#f59e0b',
  primaryLight: '#fbbf24',
  secondary: '#f97316',
  accent: '#fcd34d',

  mindiBase: '#fde8d0',
  mindiGlow: '#f97316',
  mindiHighlight: '#fff7ed',

  textPrimary: '#fff7ed',
  textSecondary: '#d6a87a',
  textMuted: '#a67c52',

  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',

  particlePrimary: '#fcd34d',
  particleSecondary: '#f59e0b',
};

// Night Theme (9pm - 5am): Cosmic, deep, dreamy
export const nightTheme: ThemeColors = {
  background: '#050510',
  backgroundAlt: '#0a0a1a',
  surface: '#0f0f20',
  surfaceGlow: 'rgba(99, 102, 241, 0.1)',

  primary: '#6366f1',
  primaryLight: '#818cf8',
  secondary: '#8b5cf6',
  accent: '#a78bfa',

  mindiBase: '#e0d4f0',
  mindiGlow: '#8b5cf6',
  mindiHighlight: '#f0e8ff',

  textPrimary: '#e0e0ff',
  textSecondary: '#7070a0',
  textMuted: '#505080',

  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',

  particlePrimary: '#a78bfa',
  particleSecondary: '#6366f1',
};

// Theme map for easy lookup
export const themes: Record<TimeOfDay, ThemeColors> = {
  morning: morningTheme,
  afternoon: afternoonTheme,
  evening: eveningTheme,
  night: nightTheme,
};

// Get current theme based on time
export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getThemeForTime(time: TimeOfDay): ThemeColors {
  return themes[time];
}

// Mindi greetings for each time
export const mindiGreetings: Record<TimeOfDay, string[]> = {
  morning: [
    "Good morning! Ready to start fresh?",
    "Rise and shine! Let's set positive intentions.",
    "A new day, a new opportunity to grow together!",
  ],
  afternoon: [
    "Hey! Need a midday boost?",
    "Taking a moment for yourself? I'm here!",
    "Let's refresh your mind together.",
  ],
  evening: [
    "Winding down? Let's find some peace.",
    "Time to relax and reflect together.",
    "Let's end the day on a positive note!",
  ],
  night: [
    "Can't sleep? I'll help you drift off...",
    "Let's quiet your mind together.",
    "Time for peaceful rest. I'm here with you.",
  ],
};
