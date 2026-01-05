/**
 * WAVIUM - Breathing Circle
 * Sacred breathing ritual that syncs with haptics
 * 4-4-4 breathing pattern (inhale-hold-exhale)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';
import { hapticPatterns } from '../../theme/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

interface BreathingCircleProps {
  cycles?: number;
  onComplete?: () => void;
  onPhaseChange?: (phase: BreathPhase) => void;
  onSkip?: () => void;
}

const PHASE_MESSAGES: Record<BreathPhase, string> = {
  inhale: 'Breathe in...',
  hold: 'Hold...',
  exhale: 'Release...',
  rest: 'Prepare...',
};

export default function BreathingCircle({
  cycles = 3,
  onComplete,
  onPhaseChange,
  onSkip,
}: BreathingCircleProps) {
  const { colors } = useThemeStore();

  const [currentPhase, setCurrentPhase] = useState<BreathPhase>('rest');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Animation values
  const circleScale = useSharedValue(0.3);
  const glowIntensity = useSharedValue(0.3);
  const textOpacity = useSharedValue(0);

  // Haptic feedback for breathing phases
  const triggerHaptic = useCallback((phase: BreathPhase) => {
    switch (phase) {
      case 'inhale':
        // Gradual intensity increase
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 1000);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 2000);
        break;
      case 'hold':
        // Gentle pulses
        const pulseInterval = setInterval(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 1000);
        setTimeout(() => clearInterval(pulseInterval), hapticPatterns.breatheHold);
        break;
      case 'exhale':
        // Gradual intensity decrease
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 1000);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 2000);
        break;
    }
  }, []);

  // Run breathing cycle
  useEffect(() => {
    if (isComplete) return;

    const runCycle = async (cycleNum: number) => {
      if (cycleNum >= cycles) {
        setIsComplete(true);
        onComplete?.();
        return;
      }

      // INHALE
      setCurrentPhase('inhale');
      onPhaseChange?.('inhale');
      triggerHaptic('inhale');
      circleScale.value = withTiming(1, {
        duration: hapticPatterns.breatheIn,
        easing: Easing.inOut(Easing.sin),
      });
      glowIntensity.value = withTiming(1, { duration: hapticPatterns.breatheIn });
      textOpacity.value = withTiming(1, { duration: 300 });

      await delay(hapticPatterns.breatheIn);

      // HOLD
      setCurrentPhase('hold');
      onPhaseChange?.('hold');
      triggerHaptic('hold');
      glowIntensity.value = withSequence(
        withTiming(0.8, { duration: 500 }),
        withTiming(1, { duration: 500 }),
        withTiming(0.8, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );

      await delay(hapticPatterns.breatheHold);

      // EXHALE
      setCurrentPhase('exhale');
      onPhaseChange?.('exhale');
      triggerHaptic('exhale');
      circleScale.value = withTiming(0.3, {
        duration: hapticPatterns.breatheOut,
        easing: Easing.inOut(Easing.sin),
      });
      glowIntensity.value = withTiming(0.3, { duration: hapticPatterns.breatheOut });

      await delay(hapticPatterns.breatheOut);

      // REST (brief pause)
      setCurrentPhase('rest');
      textOpacity.value = withTiming(0.5, { duration: 300 });

      await delay(500);

      // Next cycle
      setCurrentCycle(cycleNum + 1);
      runCycle(cycleNum + 1);
    };

    // Initial delay
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 500 });
      runCycle(0);
    }, 1000);
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const circleSize = SCREEN_WIDTH * 0.6;
  const center = circleSize / 2;

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsComplete(true);
    onSkip?.();
  }, [onSkip]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
      </TouchableOpacity>

      {/* Background glow */}
      <Animated.View
        style={[
          styles.glowContainer,
          { width: circleSize * 1.5, height: circleSize * 1.5 },
          glowStyle,
        ]}
      >
        <Canvas style={{ width: circleSize * 1.5, height: circleSize * 1.5 }}>
          <Circle
            cx={circleSize * 0.75}
            cy={circleSize * 0.75}
            r={circleSize * 0.6}
          >
            <RadialGradient
              c={vec(circleSize * 0.75, circleSize * 0.75)}
              r={circleSize * 0.6}
              colors={[colors.primary, `${colors.primary}40`, 'transparent']}
            />
            <BlurMask blur={40} style="normal" />
          </Circle>
        </Canvas>
      </Animated.View>

      {/* Breathing circle */}
      <Animated.View
        style={[
          styles.circleContainer,
          { width: circleSize, height: circleSize },
          circleStyle,
        ]}
      >
        <Canvas style={{ width: circleSize, height: circleSize }}>
          <Group>
            {/* Outer ring */}
            <Circle
              cx={center}
              cy={center}
              r={center - 4}
              strokeWidth={2}
              color={colors.primary}
              opacity={0.5}
            />

            {/* Main circle */}
            <Circle cx={center} cy={center} r={center - 10}>
              <RadialGradient
                c={vec(center, center - 20)}
                r={center}
                colors={[
                  colors.primaryLight,
                  colors.primary,
                  `${colors.primary}80`,
                ]}
              />
            </Circle>

            {/* Inner highlight */}
            <Circle
              cx={center}
              cy={center - 20}
              r={center * 0.4}
              opacity={0.3}
            >
              <RadialGradient
                c={vec(center, center - 30)}
                r={center * 0.4}
                colors={['#ffffff', 'transparent']}
              />
            </Circle>
          </Group>
        </Canvas>
      </Animated.View>

      {/* Phase text */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={[styles.phaseText, { color: colors.textPrimary }]}>
          {PHASE_MESSAGES[currentPhase]}
        </Text>
        <Text style={[styles.cycleText, { color: colors.textSecondary }]}>
          {currentCycle + 1} of {cycles}
        </Text>
      </Animated.View>

      {/* Instruction text */}
      <View style={styles.instructionContainer}>
        <Text style={[styles.instructionText, { color: colors.textMuted }]}>
          Follow the circle with your breath
        </Text>
      </View>
    </View>
  );
}

// Helper function
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  skipText: {
    ...typography.body,
    fontWeight: '500',
  },
  glowContainer: {
    position: 'absolute',
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  phaseText: {
    ...typography.h2,
    textAlign: 'center',
  },
  cycleText: {
    ...typography.body,
    marginTop: 8,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 100,
  },
  instructionText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});
