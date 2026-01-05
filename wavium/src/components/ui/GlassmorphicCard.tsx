/**
 * WAVIUM - Glassmorphic Card
 * Frosted glass effect cards
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
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

export default function GlassmorphicCard({
  children,
  style,
  intensity = 20,
  borderGlow = false,
  padding = 'medium',
}: GlassmorphicCardProps) {
  const { colors } = useThemeStore();

  return (
    <View
      style={[
        styles.container,
        borderGlow && {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[
          styles.blur,
          {
            padding: PADDING_MAP[padding],
            borderColor: borderGlow ? `${colors.primary}40` : `${colors.textMuted}20`,
          },
        ]}
      >
        {/* Subtle gradient overlay */}
        <View
          style={[
            styles.overlay,
            { backgroundColor: colors.surfaceGlow },
          ]}
        />
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
});
