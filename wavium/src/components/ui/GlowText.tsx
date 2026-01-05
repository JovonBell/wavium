/**
 * WAVIUM - Glow Text
 * Text with ethereal glow effect
 */

import React from 'react';
import { Text, StyleSheet, TextStyle, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';

interface GlowTextProps {
  children: string;
  style?: TextStyle;
  glowColor?: string;
  glowIntensity?: number;
  animate?: boolean;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
}

export default function GlowText({
  children,
  style,
  glowColor,
  glowIntensity = 1,
  animate = false,
  variant = 'body',
}: GlowTextProps) {
  const { colors } = useThemeStore();

  const pulseValue = useSharedValue(0);

  React.useEffect(() => {
    if (animate) {
      pulseValue.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }
  }, [animate]);

  const color = glowColor || colors.primary;
  const textStyles = typography[variant] || typography.body;

  const animatedStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(
      pulseValue.value,
      [0, 1],
      [10 * glowIntensity, 20 * glowIntensity]
    );

    return {
      textShadowRadius: shadowRadius,
    };
  });

  return (
    <Animated.Text
      style={[
        textStyles,
        {
          color: colors.textPrimary,
          textShadowColor: color,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10 * glowIntensity,
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
}
