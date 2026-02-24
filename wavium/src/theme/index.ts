/**
 * WAVIUM Design System - Main Export
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './animations';

// Re-export commonly used items for convenience
export {
  themes,
  getCurrentTimeOfDay,
  getThemeForTime,
  mindiGreetings,
  type TimeOfDay,
  type ThemeColors,
} from './colors';

export { textStyles, fontSizes, fontWeights, fontFamilies } from './typography';
export { spacing, borderRadius, componentSizes } from './spacing';
export { springs, timing, easings, mindiCycles, particles, hapticPatterns } from './animations';
