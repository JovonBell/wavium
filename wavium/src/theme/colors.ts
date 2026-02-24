/**
 * WAVIUM Design System - Colors
 * Time-shifting theme with 4 variants
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export const goldScale = {
  light: '#F7C873',  // warm gold — gradient start
  mid:   '#D4A017',  // primary gold — gradient middle
  deep:  '#A0720C',  // deep amber — gradient end
} as const;

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

  // Gradient tokens (COLR-04)
  primaryGradient: [string, string, string];  // 3-stop tuple for LinearGradient + Skia
  glassOverlay: string;                        // rgba — colored surface tint for glass cards
  glassBorder: string;                         // rgba — glass card edge highlight
}

// Morning Theme (5am - 12pm): Warm, fresh, awakening
export const morningTheme: ThemeColors = {
  background: '#0A0A0F',
  backgroundAlt: '#0E0E18',
  surface: '#14141F',
  surfaceGlow: 'rgba(255, 179, 102, 0.1)',

  primary: '#ffb366',
  primaryLight: '#ffd699',
  secondary: '#ff9f43',
  accent: '#ffe4b3',

  mindiBase: '#ffd4e0',
  mindiGlow: '#ffb366',
  mindiHighlight: '#fff5eb',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.82)',
  textMuted: 'rgba(255, 255, 255, 0.55)',

  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',

  particlePrimary: '#ffe4b3',
  particleSecondary: '#ffb366',

  primaryGradient: ['#F7C873', '#D4A017', '#A0720C'],
  glassOverlay: 'rgba(247, 200, 115, 0.08)',
  glassBorder: 'rgba(212, 160, 23, 0.20)',
};

// Afternoon Theme (12pm - 5pm): Clear, balanced, focused
export const afternoonTheme: ThemeColors = {
  background: '#0A0A12',
  backgroundAlt: '#0E0E1A',
  surface: '#141425',
  surfaceGlow: 'rgba(167, 139, 250, 0.1)',

  primary: '#a78bfa',
  primaryLight: '#c4b5fd',
  secondary: '#60a5fa',
  accent: '#f0abfc',

  mindiBase: '#fbc7d4',
  mindiGlow: '#e879f9',
  mindiHighlight: '#ffe4ec',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.82)',
  textMuted: 'rgba(255, 255, 255, 0.55)',

  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',

  particlePrimary: '#f0abfc',
  particleSecondary: '#a78bfa',

  primaryGradient: ['#a78bfa', '#8b5cf6', '#7c3aed'],
  glassOverlay: 'rgba(167, 139, 250, 0.08)',
  glassBorder: 'rgba(139, 92, 246, 0.20)',
};

// Evening Theme (5pm - 9pm): Golden hour, warm, relaxing
export const eveningTheme: ThemeColors = {
  background: '#0A0A0E',
  backgroundAlt: '#0E0E18',
  surface: '#14141E',
  surfaceGlow: 'rgba(245, 158, 11, 0.1)',

  primary: '#f59e0b',
  primaryLight: '#fbbf24',
  secondary: '#f97316',
  accent: '#fcd34d',

  mindiBase: '#fde8d0',
  mindiGlow: '#f97316',
  mindiHighlight: '#fff7ed',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.82)',
  textMuted: 'rgba(255, 255, 255, 0.55)',

  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',

  particlePrimary: '#fcd34d',
  particleSecondary: '#f59e0b',

  primaryGradient: ['#F7C873', '#D4A017', '#A0720C'],
  glassOverlay: 'rgba(245, 158, 11, 0.08)',
  glassBorder: 'rgba(251, 191, 36, 0.20)',
};

// Night Theme (9pm - 5am): Cosmic, deep, dreamy
export const nightTheme: ThemeColors = {
  background: '#0A0A12',
  backgroundAlt: '#0D0D18',
  surface: '#12121F',
  surfaceGlow: 'rgba(99, 102, 241, 0.1)',

  primary: '#6366f1',
  primaryLight: '#818cf8',
  secondary: '#8b5cf6',
  accent: '#a78bfa',

  mindiBase: '#e0d4f0',
  mindiGlow: '#8b5cf6',
  mindiHighlight: '#f0e8ff',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.82)',
  textMuted: 'rgba(255, 255, 255, 0.55)',

  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',

  particlePrimary: '#a78bfa',
  particleSecondary: '#6366f1',

  primaryGradient: ['#6366f1', '#8b5cf6', '#a78bfa'],
  glassOverlay: 'rgba(99, 102, 241, 0.08)',
  glassBorder: 'rgba(167, 139, 250, 0.20)',
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
