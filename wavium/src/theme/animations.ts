/**
 * WAVIUM Design System - Animation Constants
 * All animations use native driver compatible properties
 */

import { Easing } from 'react-native-reanimated';

// Spring configurations for different feels
export const springs = {
  // Snappy - quick responses (buttons, selections)
  snappy: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  // Gentle - smooth, relaxed motion (Mindi, particles)
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },

  // Bouncy - playful, celebratory (celebrations, success)
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 1,
  },

  // Slow - dreamy, ethereal (transitions, fades)
  slow: {
    damping: 25,
    stiffness: 50,
    mass: 1,
  },

  // Parallax - for gyroscope motion
  parallax: {
    damping: 20,
    stiffness: 80,
    mass: 1,
  },
} as const;

// Timing configurations
export const timing = {
  instant: 100,
  fast: 150,
  medium: 300,
  slow: 500,
  verySlow: 800,

  // Specific animations
  buttonPress: 80,
  cardTap: 100,
  modalSlide: 300,
  mindiStateChange: 400,
  particleFloat: 3000,
  glowPulse: 2000,
  confettiBurst: 1500,
  screenTransition: 300,
  themeShift: 30000, // 30 seconds for time theme transitions
} as const;

// Easing functions
export const easings = {
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  easeOut: Easing.bezier(0, 0, 0.2, 1),
  easeIn: Easing.bezier(0.4, 0, 1, 1),
  easeInOut: Easing.bezier(0.4, 0, 0.2, 1),
  bounce: Easing.bezier(0.175, 0.885, 0.32, 1.275),
} as const;

// Mindi animation cycles
export const mindiCycles = {
  // Idle floating
  floatDuration: 2000,
  floatAmplitude: 5, // pixels

  // Breathing glow
  glowPulseDuration: 3000,
  glowPulseMin: 0.9,
  glowPulseMax: 1.0,

  // Blink
  blinkInterval: [4000, 6000], // random between 4-6 seconds
  blinkDuration: 200,

  // Peaceful (player) - slower everything
  peacefulFloatDuration: 3000,
  peacefulFloatAmplitude: 3,
  peacefulGlowPulseDuration: 2500,

  // Listening - subtle head tilt
  listenTiltAngle: 8, // degrees
  listenTiltDuration: 300,

  // Happy - celebration bounce
  happyBounceDuration: 300,
  happyBounceScale: 1.15,
} as const;

// Particle configurations
export const particles = {
  // Standard orbs
  count: 15,
  minSize: 8,
  maxSize: 15,
  minOpacity: 0.4,
  maxOpacity: 0.7,
  driftDuration: [3000, 5000], // random between 3-5 seconds
  spawnRadius: 200, // spawn at this distance from Mindi
  absorptionDistance: 20, // absorbed when this close

  // Affirmation text particles
  textSpawnInterval: 2000,
  textDriftDuration: 5000,
  textMaxOnScreen: 10,
} as const;

// Haptic patterns
export const hapticPatterns = {
  // Button tap
  tap: 'impactLight' as const,

  // Selection
  selection: 'impactMedium' as const,

  // Success
  success: 'notificationSuccess' as const,

  // Error
  error: 'notificationError' as const,

  // Mindi reaction (double tap)
  mindiReaction: ['impactLight', 'impactLight'] as const,

  // Celebration
  celebration: ['notificationSuccess', 'impactHeavy'] as const,

  // Breathing pattern intervals (ms)
  breatheIn: 4000,
  breatheHold: 4000,
  breatheOut: 4000,
} as const;

// Star field configurations (for The Void)
export const starField = {
  // Layer 1 - Deep (slow parallax)
  deepCount: 100,
  deepParallax: 0.2,
  deepMinSize: 1,
  deepMaxSize: 2,

  // Layer 2 - Medium
  mediumCount: 60,
  mediumParallax: 0.5,
  mediumMinSize: 2,
  mediumMaxSize: 3,

  // Layer 3 - Near (fast parallax)
  nearCount: 40,
  nearParallax: 1.0,
  nearMinSize: 2,
  nearMaxSize: 4,

  // Twinkle
  twinkleDuration: [2000, 4000],
  twinkleMinOpacity: 0.3,
  twinkleMaxOpacity: 1.0,
} as const;

// Nebula shader parameters
export const nebula = {
  // Animation speed
  morphSpeed: 0.1,

  // Audio reactivity multipliers
  bassIntensityMultiplier: 0.4,
  colorShiftSpeed: 0.05,

  // Default colors (can be overridden by theme)
  color1: [0.6, 0.2, 0.9], // Purple
  color2: [0.2, 0.5, 0.9], // Blue
  color3: [0.9, 0.3, 0.6], // Pink
} as const;
