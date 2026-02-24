/**
 * WAVIUM Design System - Typography
 */

import { TextStyle } from 'react-native';

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const fontFamilies = {
  // Display — Roman inscription gravity (TYPO-01)
  displayRegular: 'Cinzel_400Regular',
  displayBold: 'Cinzel_700Bold',

  // Editorial serif — luxury affirmations (TYPO-02)
  editorialRegular: 'CormorantGaramond_400Regular',
  editorialItalic: 'CormorantGaramond_400Regular_Italic',

  // Geometric sans — body and UI (TYPO-03)
  bodyRegular: 'Raleway_400Regular',
  bodyMedium: 'Raleway_500Medium',
} as const;

// Pre-defined text styles
export const textStyles: Record<string, TextStyle> = {
  // Headings (legacy — system font, kept for backward compatibility)
  h1: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
  },
  h2: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  },
  h3: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.lg * lineHeights.tight,
  },

  // Body (legacy — system font, kept for backward compatibility)
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },

  // Mindi speech
  mindi: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },
  mindiLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.lg * lineHeights.relaxed,
  },

  // UI elements (legacy — kept for backward compatibility)
  buttonSmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.sm * lineHeights.tight,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },

  // Special (legacy — kept for backward compatibility)
  stat: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
  },

  // Display variants — Cinzel (TYPO-01, TYPO-04)
  displayHero: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 32,
    letterSpacing: 4,
    lineHeight: 38,
  } as TextStyle,
  displayHeading: {
    fontFamily: fontFamilies.displayRegular,
    fontSize: 22,
    letterSpacing: 2,
    lineHeight: 28,
  } as TextStyle,

  // Affirmation variants — Cormorant Garamond (TYPO-02, TYPO-04)
  affirmation: {
    fontFamily: fontFamilies.editorialRegular,
    fontSize: 24,
    lineHeight: 36,
  } as TextStyle,
  affirmationItalic: {
    fontFamily: fontFamilies.editorialItalic,
    fontSize: 22,
    lineHeight: 34,
  } as TextStyle,

  // Body variants — Raleway (TYPO-03, TYPO-04)
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,
  bodySmall: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
  } as TextStyle,
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 12,
    letterSpacing: 0.5,
    lineHeight: 16,
  } as TextStyle,
  button: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    letterSpacing: 0.5,
    lineHeight: 20,
  } as TextStyle,
};

// Alias for compatibility
export const typography = textStyles;
