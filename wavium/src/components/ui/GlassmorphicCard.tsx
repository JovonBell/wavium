/**
 * WAVIUM - Glassmorphic Card
 * Three-layer frosted glass effect cards with ambient glow
 *
 * Layer 1: BlurView (or Android pre-31 fallback)
 * Layer 2: Tint overlay using glassOverlay token
 * Layer 3: Top-edge highlight using glassBorder token
 *
 * Requirements: SURF-01, SURF-02, SURF-04, PERF-03
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { spacing, borderRadius } from '../../theme/spacing';

interface GlassmorphicCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderGlow?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const PADDING_MAP = {
  none: 0,
  small: spacing.sm,
  medium: spacing.md,
  large: spacing.lg,
};

/**
 * Android pre-API-31 cannot render BlurView reliably.
 * Use a semi-transparent fallback instead (SURF-04).
 */
const needsBlurFallback =
  Platform.OS === 'android' &&
  typeof Platform.Version === 'number' &&
  Platform.Version < 31;

const isAndroid31Plus =
  Platform.OS === 'android' &&
  typeof Platform.Version === 'number' &&
  Platform.Version >= 31;

export default function GlassmorphicCard({
  children,
  style,
  intensity = 20,
  borderGlow = false,
  padding = 'medium',
}: GlassmorphicCardProps) {
  const { colors } = useThemeStore();

  // SURF-02: Ambient glow always applied; borderGlow increases intensity
  const shadowOpacity = borderGlow ? 0.3 : 0.15;

  const contentStyle: ViewStyle = {
    padding: PADDING_MAP[padding],
    borderColor: colors.glassBorder,
  };

  // Layer 1: Blur background (or fallback)
  const renderBlurLayer = () => {
    if (needsBlurFallback) {
      // SURF-04: Android pre-31 fallback — opaque tinted view
      return (
        <View
          style={[
            styles.blur,
            contentStyle,
            { backgroundColor: colors.glassOverlay, opacity: 0.85 },
          ]}
        >
          {/* Layer 2: Tint overlay */}
          <View
            style={[
              styles.overlay,
              { backgroundColor: colors.glassOverlay },
            ]}
          />
          {/* Layer 3: Top-edge highlight */}
          <LinearGradient
            colors={['transparent', colors.glassBorder, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topHighlight}
          />
          {children}
        </View>
      );
    }

    // BlurView for iOS and Android API 31+
    return (
      <BlurView
        intensity={intensity} // PERF-03: static, never animated
        tint="dark"
        style={[styles.blur, contentStyle]}
        {...(isAndroid31Plus && { experimentalBlurMethod: 'dimezisBlurView' })}
      >
        {/* Layer 2: Tint overlay */}
        <View
          style={[
            styles.overlay,
            { backgroundColor: colors.glassOverlay },
          ]}
        />
        {/* Layer 3: Top-edge highlight */}
        <LinearGradient
          colors={['transparent', colors.glassBorder, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.topHighlight}
        />
        {children}
      </BlurView>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          // SURF-02: Ambient glow shadow always applied
          shadowColor: colors.primaryGradient[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity,
          shadowRadius: 16,
          elevation: 8,
        },
        style,
      ]}
    >
      {renderBlurLayer()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
