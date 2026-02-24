/**
 * WAVIUM - Mindi Character Renderer
 * Beautiful, simple Skia-based AI companion
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  cancelAnimation,
  Easing as REasing,
} from 'react-native-reanimated';
import { useMindiStore, MindiState } from '../../stores/useMindiStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { mindiCycles, springs } from '../../theme/animations';
import MindiGlow from './MindiGlow';
import MindiParticles from './MindiParticles';
import MindiEyes from './MindiEyes';

interface MindiRendererProps {
  size?: number;
  showParticles?: boolean;
  audioLevel?: SharedValue<number>;
}

export default function MindiRenderer({
  size = 200,
  showParticles = true,
  audioLevel,
}: MindiRendererProps) {
  const { currentState } = useMindiStore();
  const { colors } = useThemeStore();

  // Animation values
  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);
  const breathScale = useSharedValue(1);
  const glowIntensity = useSharedValue(1);
  const headTilt = useSharedValue(0);

  // Beautiful default colors
  const mindiColors = useMemo(() => ({
    primary: colors.mindiBase,
    secondary: colors.mindiGlow,
    accent: colors.mindiHighlight,
  }), [colors]);

  // Idle floating animation
  useEffect(() => {
    const amplitude = currentState === 'peaceful'
      ? mindiCycles.peacefulFloatAmplitude
      : mindiCycles.floatAmplitude;
    const duration = currentState === 'peaceful'
      ? mindiCycles.peacefulFloatDuration
      : mindiCycles.floatDuration;

    floatY.value = withRepeat(
      withTiming(-amplitude, {
        duration: duration / 2,
        easing: REasing.inOut(REasing.sin),
      }),
      -1,
      true
    );
  }, [currentState]);

  // Glow pulse animation
  useEffect(() => {
    const duration = currentState === 'peaceful'
      ? mindiCycles.peacefulGlowPulseDuration
      : mindiCycles.glowPulseDuration;

    glowIntensity.value = withRepeat(
      withTiming(mindiCycles.glowPulseMax, {
        duration: duration / 2,
        easing: REasing.inOut(REasing.sin),
      }),
      -1,
      true
    );
  }, [currentState]);

  // State-specific animations (with idle breathing)
  useEffect(() => {
    switch (currentState) {
      case 'listening':
        cancelAnimation(breathScale);
        breathScale.value = 1;
        headTilt.value = withSpring(mindiCycles.listenTiltAngle, springs.gentle);
        break;
      case 'happy':
        cancelAnimation(breathScale);
        breathScale.value = 1;
        scale.value = withSequence(
          withSpring(mindiCycles.happyBounceScale, springs.bouncy),
          withSpring(1, springs.gentle)
        );
        headTilt.value = withSpring(0, springs.gentle);
        break;
      case 'excited':
        cancelAnimation(breathScale);
        breathScale.value = 1;
        scale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 150 }),
            withTiming(1, { duration: 150 })
          ),
          3,
          false
        );
        break;
      case 'generating':
        cancelAnimation(breathScale);
        breathScale.value = 1;
        // Pulsing while generating
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 800 }),
            withTiming(0.98, { duration: 800 })
          ),
          -1,
          true
        );
        break;
      default:
        // Idle breathing: slow 1.0 -> 1.02 pulse over ~4s (2s up, 2s down)
        headTilt.value = withSpring(0, springs.gentle);
        scale.value = withSpring(1, springs.gentle);
        breathScale.value = withRepeat(
          withTiming(1.02, {
            duration: 2000,
            easing: REasing.inOut(REasing.sin),
          }),
          -1,
          true
        );
    }

    return () => {
      cancelAnimation(breathScale);
    };
  }, [currentState]);

  // Animated container style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: scale.value * breathScale.value * (1 + (audioLevel?.value ?? 0) * 0.05) },
      { rotate: `${headTilt.value}deg` },
    ],
  }));

  // Body proportions - always beautiful, no evolution
  const bodyProps = useMemo(() => {
    const baseRadius = size * 0.35;
    return {
      bodyRadius: baseRadius,
      hasFeatures: true,
      glowLayers: 3,
      particleIntensity: 0.7,
    };
  }, [size]);

  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Particle layer (behind Mindi) */}
      {showParticles && (
        <MindiParticles
          size={size}
          intensity={bodyProps.particleIntensity}
          colors={mindiColors}
          absorbing={currentState === 'generating' || currentState === 'peaceful'}
        />
      )}

      {/* Glow layer */}
      <MindiGlow
        size={size}
        intensity={0.7}
        layers={bodyProps.glowLayers}
        color={mindiColors.secondary}
        audioLevel={audioLevel}
      />

      {/* Main Mindi body */}
      <Animated.View style={[styles.mindiBody, animatedStyle]}>
        <Canvas style={{ width: size, height: size }}>
          <Group>
            {/* Main body gradient */}
            <Circle cx={center} cy={center} r={bodyProps.bodyRadius}>
              <RadialGradient
                c={vec(center, center - bodyProps.bodyRadius * 0.3)}
                r={bodyProps.bodyRadius * 1.5}
                colors={[
                  mindiColors.accent,
                  mindiColors.primary,
                  mindiColors.secondary,
                ]}
              />
              <BlurMask blur={2} style="solid" />
            </Circle>

            {/* Inner glow */}
            <Circle
              cx={center}
              cy={center - bodyProps.bodyRadius * 0.2}
              r={bodyProps.bodyRadius * 0.5}
            >
              <RadialGradient
                c={vec(center, center - bodyProps.bodyRadius * 0.3)}
                r={bodyProps.bodyRadius * 0.6}
                colors={[
                  'rgba(255, 255, 255, 0.6)',
                  'rgba(255, 255, 255, 0.2)',
                  'rgba(255, 255, 255, 0)',
                ]}
              />
            </Circle>
          </Group>
        </Canvas>

        {/* Eyes layer */}
        {bodyProps.hasFeatures && (
          <MindiEyes
            size={size}
            bodyRadius={bodyProps.bodyRadius}
            state={currentState}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mindiBody: {
    position: 'absolute',
  },
});
