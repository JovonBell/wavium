/**
 * WAVIUM - Loading Overlay
 * Full-screen loading with Mindi animation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number; // 0-100
}

export default function LoadingOverlay({
  visible,
  message = 'Loading...',
  progress,
}: LoadingOverlayProps) {
  const { colors } = useThemeStore();

  // Animation values
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const orbitProgress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );

      // Rotation
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );

      // Orbiting particles
      orbitProgress.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!visible) return null;

  const center = 60;
  const orbitRadius = 40;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, { backgroundColor: colors.background + 'f0' }]}
    >
      {/* Loading animation */}
      <View style={styles.loaderContainer}>
        {/* Core glow */}
        <Animated.View style={[styles.core, pulseStyle]}>
          <Canvas style={{ width: 120, height: 120 }}>
            <Circle cx={center} cy={center} r={30}>
              <RadialGradient
                c={vec(center, center)}
                r={30}
                colors={[colors.mindiGlow, `${colors.mindiGlow}60`, 'transparent']}
              />
              <BlurMask blur={15} style="normal" />
            </Circle>
            <Circle cx={center} cy={center} r={15}>
              <RadialGradient
                c={vec(center, center - 5)}
                r={15}
                colors={[colors.mindiHighlight, colors.mindiBase]}
              />
            </Circle>
          </Canvas>
        </Animated.View>

        {/* Orbiting particles */}
        <Animated.View style={[styles.orbit, rotationStyle]}>
          <Canvas style={{ width: 120, height: 120 }}>
            <Group>
              {[0, 120, 240].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = center + Math.cos(rad) * orbitRadius;
                const y = center + Math.sin(rad) * orbitRadius;
                return (
                  <Circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={4}
                    color={colors.primary}
                    opacity={0.8 - i * 0.2}
                  >
                    <BlurMask blur={2} style="normal" />
                  </Circle>
                );
              })}
            </Group>
          </Canvas>
        </Animated.View>
      </View>

      {/* Message */}
      <Text style={[styles.message, { color: colors.textPrimary }]}>
        {message}
      </Text>

      {/* Progress bar (if provided) */}
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: `${colors.textMuted}40` },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  core: {
    position: 'absolute',
  },
  orbit: {
    position: 'absolute',
  },
  message: {
    ...typography.body,
    marginTop: 24,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: 200,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    marginTop: 8,
  },
});
