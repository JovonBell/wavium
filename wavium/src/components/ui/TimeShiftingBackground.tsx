/**
 * WAVIUM - Time Shifting Background
 * Background that transitions based on time of day
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Rect,
  LinearGradient,
  vec,
  Circle,
  RadialGradient,
  BlurMask,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { TimeOfDay } from '../../theme/colors';
import { timing } from '../../theme/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TimeShiftingBackgroundProps {
  children?: React.ReactNode;
}

// Gradient colors for each time of day
const GRADIENTS: Record<TimeOfDay, [string, string, string]> = {
  morning: ['#1a1520', '#2d1f35', '#3d2845'],
  afternoon: ['#0f0f1a', '#151525', '#1a1a2e'],
  evening: ['#1a1210', '#2a1a15', '#3a2520'],
  night: ['#050510', '#0a0a1a', '#0f0f25'],
};

// Ambient orb colors
const AMBIENT_ORBS: Record<TimeOfDay, { color: string; opacity: number }> = {
  morning: { color: '#ffb366', opacity: 0.08 },
  afternoon: { color: '#a78bfa', opacity: 0.06 },
  evening: { color: '#f59e0b', opacity: 0.1 },
  night: { color: '#6366f1', opacity: 0.05 },
};

// Generate stable star positions once
const STARS = Array.from({ length: 30 }, (_, i) => ({
  cx: Math.random() * SCREEN_WIDTH,
  cy: Math.random() * SCREEN_HEIGHT * 0.5,
  r: Math.random() * 1 + 0.5,
  opacity: Math.random() * 0.4 + 0.2,
}));

export default function TimeShiftingBackground({
  children,
}: TimeShiftingBackgroundProps) {
  const { timeOfDay, colors } = useThemeStore();

  // Transition progress
  const transitionProgress = useSharedValue(0);

  // Trigger transition when time changes
  useEffect(() => {
    transitionProgress.value = 0;
    transitionProgress.value = withTiming(1, { duration: timing.themeShift });
  }, [timeOfDay]);

  const gradient = GRADIENTS[timeOfDay];
  const orb = AMBIENT_ORBS[timeOfDay];

  return (
    <>
      <Canvas style={styles.canvas}>
        {/* Main gradient background */}
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <LinearGradient
            start={vec(SCREEN_WIDTH / 2, 0)}
            end={vec(SCREEN_WIDTH / 2, SCREEN_HEIGHT)}
            colors={gradient}
          />
        </Rect>

        {/* Ambient orbs for depth */}
        <Circle
          cx={SCREEN_WIDTH * 0.2}
          cy={SCREEN_HEIGHT * 0.3}
          r={SCREEN_WIDTH * 0.4}
          opacity={orb.opacity}
        >
          <RadialGradient
            c={vec(SCREEN_WIDTH * 0.2, SCREEN_HEIGHT * 0.3)}
            r={SCREEN_WIDTH * 0.4}
            colors={[orb.color, 'transparent']}
          />
          <BlurMask blur={60} style="normal" />
        </Circle>

        <Circle
          cx={SCREEN_WIDTH * 0.8}
          cy={SCREEN_HEIGHT * 0.7}
          r={SCREEN_WIDTH * 0.35}
          opacity={orb.opacity * 0.7}
        >
          <RadialGradient
            c={vec(SCREEN_WIDTH * 0.8, SCREEN_HEIGHT * 0.7)}
            r={SCREEN_WIDTH * 0.35}
            colors={[orb.color, 'transparent']}
          />
          <BlurMask blur={50} style="normal" />
        </Circle>

        {/* Subtle stars (night only) */}
        {timeOfDay === 'night' && (
          <>
            {STARS.map((star, i) => (
              <Circle
                key={i}
                cx={star.cx}
                cy={star.cy}
                r={star.r}
                color={`rgba(255, 255, 255, ${star.opacity})`}
              />
            ))}
          </>
        )}
      </Canvas>
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});
