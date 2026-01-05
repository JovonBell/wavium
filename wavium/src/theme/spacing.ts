/**
 * WAVIUM Design System - Spacing
 */

// Base spacing unit (4px)
const BASE = 4;

export const spacing = {
  none: 0,
  xs: BASE, // 4px
  sm: BASE * 2, // 8px
  md: BASE * 4, // 16px
  lg: BASE * 6, // 24px
  xl: BASE * 8, // 32px
  '2xl': BASE * 12, // 48px
  '3xl': BASE * 16, // 64px
  '4xl': BASE * 24, // 96px
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 48,
} as const;

// Component-specific sizes
export const componentSizes = {
  // Buttons
  buttonHeight: {
    sm: 36,
    md: 48,
    lg: 56,
  },

  // Mindi
  mindi: {
    small: 60, // Chat corner
    medium: 150, // Home
    large: 280, // Player
  },

  // Cards
  cardPadding: spacing.lg,

  // Input
  inputHeight: 48,

  // Player controls
  playerControlSize: 64,
  playerControlSmall: 44,

  // Progress ring
  progressRingSize: 300,
  progressRingStroke: 4,
} as const;
