/**
 * WAVIUM - Light Coalescing
 * Particles of light coalesce to birth Mindi
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
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
  withSpring,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/useThemeStore';
import { MindiRenderer } from '../mindi';
import { typography } from '../../theme/typography';
import { springs } from '../../theme/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LightParticle {
  id: number;
  startX: number;
  startY: number;
  delay: number;
  color: string;
  size: number;
}

interface LightCoalescingProps {
  onBirthComplete?: () => void;
}

// Single coalescing particle
const CoalescingParticle = ({
  particle,
  centerX,
  centerY,
  onComplete,
}: {
  particle: LightParticle;
  centerX: number;
  centerY: number;
  onComplete: () => void;
}) => {
  const x = useSharedValue(particle.startX);
  const y = useSharedValue(particle.startY);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in
    opacity.value = withDelay(
      particle.delay,
      withTiming(0.8, { duration: 300 })
    );

    // Move toward center
    x.value = withDelay(
      particle.delay,
      withTiming(centerX, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    y.value = withDelay(
      particle.delay,
      withTiming(centerY, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    // Shrink and fade as approaching center
    scale.value = withDelay(
      particle.delay + 1500,
      withTiming(0, { duration: 800 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );

    opacity.value = withDelay(
      particle.delay + 1800,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value - particle.size / 2,
    top: y.value - particle.size / 2,
    width: particle.size,
    height: particle.size,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Canvas style={{ width: particle.size, height: particle.size }}>
        <Circle
          cx={particle.size / 2}
          cy={particle.size / 2}
          r={particle.size / 2}
        >
          <RadialGradient
            c={vec(particle.size / 2, particle.size / 2)}
            r={particle.size / 2}
            colors={[particle.color, `${particle.color}60`, 'transparent']}
          />
          <BlurMask blur={3} style="normal" />
        </Circle>
      </Canvas>
    </Animated.View>
  );
};

export default function LightCoalescing({
  onBirthComplete,
}: LightCoalescingProps) {
  const { colors } = useThemeStore();

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  // Animation values
  const mindiScale = useSharedValue(0);
  const mindiOpacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  const [particlesComplete, setParticlesComplete] = useState(0);
  const [showMindi, setShowMindi] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Generate particles
  const particles = useMemo(() => {
    const particleColors = [
      colors.primary,
      colors.secondary,
      colors.accent,
      colors.mindiGlow,
      '#ffffff',
    ];

    return Array.from({ length: 40 }, (_, i) => {
      const angle = (i / 40) * Math.PI * 2;
      const distance = 150 + Math.random() * 200;

      return {
        id: i,
        startX: centerX + Math.cos(angle) * distance,
        startY: centerY + Math.sin(angle) * distance,
        delay: i * 50,
        color: particleColors[i % particleColors.length],
        size: 8 + Math.random() * 12,
      };
    });
  }, [colors]);

  // Track particle completion
  const handleParticleComplete = useCallback(() => {
    setParticlesComplete(prev => {
      const newCount = prev + 1;

      // When enough particles have coalesced, reveal Mindi
      if (newCount === Math.floor(particles.length * 0.7) && !showMindi) {
        setShowMindi(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Mindi appears
        mindiScale.value = withSpring(1, springs.bouncy);
        mindiOpacity.value = withTiming(1, { duration: 500 });
        glowIntensity.value = withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.7, { duration: 300 })
        );
      }

      // Show welcome text
      if (newCount === particles.length && !showWelcome) {
        setShowWelcome(true);
        textOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));

        // Complete callback
        setTimeout(() => {
          onBirthComplete?.();
        }, 2500);
      }

      return newCount;
    });
  }, [particles.length, showMindi, showWelcome, onBirthComplete]);

  const mindiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mindiScale.value }],
    opacity: mindiOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
    transform: [{ scale: 1 + glowIntensity.value * 0.2 }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background stars */}
      <Canvas style={StyleSheet.absoluteFill}>
        {Array.from({ length: 30 }, (_, i) => (
          <Circle
            key={i}
            cx={Math.random() * SCREEN_WIDTH}
            cy={Math.random() * SCREEN_HEIGHT}
            r={Math.random() * 1.5 + 0.5}
            color={`rgba(255, 255, 255, ${Math.random() * 0.4 + 0.2})`}
          />
        ))}
      </Canvas>

      {/* Coalescing particles */}
      {particles.map(particle => (
        <CoalescingParticle
          key={particle.id}
          particle={particle}
          centerX={centerX}
          centerY={centerY}
          onComplete={handleParticleComplete}
        />
      ))}

      {/* Center glow */}
      <Animated.View
        style={[
          styles.centerGlow,
          { left: centerX - 100, top: centerY - 100 },
          glowStyle,
        ]}
      >
        <Canvas style={{ width: 200, height: 200 }}>
          <Circle cx={100} cy={100} r={80}>
            <RadialGradient
              c={vec(100, 100)}
              r={80}
              colors={[colors.mindiGlow, `${colors.mindiGlow}40`, 'transparent']}
            />
            <BlurMask blur={30} style="normal" />
          </Circle>
        </Canvas>
      </Animated.View>

      {/* Mindi */}
      {showMindi && (
        <Animated.View style={[styles.mindiContainer, mindiStyle]}>
          <MindiRenderer size={150} showParticles={false} />
        </Animated.View>
      )}

      {/* Welcome text */}
      {showWelcome && (
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
            I am Mindi
          </Text>
          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            Your companion on this journey
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  mindiContainer: {
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.25,
    alignItems: 'center',
  },
  welcomeText: {
    ...typography.h1,
    textAlign: 'center',
  },
  subText: {
    ...typography.body,
    marginTop: 8,
    textAlign: 'center',
  },
});
