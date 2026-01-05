/**
 * WAVIUM - Affirmation Spirals
 * Text particles that spiral toward Mindi and get absorbed
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { particles as particleConfig } from '../../theme/animations';
import { typography } from '../../theme/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT / 2;

interface AffirmationParticle {
  id: number;
  text: string;
  startX: number;
  startY: number;
  startAngle: number;
}

interface AffirmationSpiralsProps {
  affirmations: string[];
  isPlaying: boolean;
  audioLevel?: number;
  currentIndex?: number; // Current affirmation being spoken by TTS
}

// Single affirmation particle that spirals inward
const SpiralText = ({
  particle,
  onComplete,
  audioLevel = 0,
}: {
  particle: AffirmationParticle;
  onComplete: (id: number) => void;
  audioLevel?: number;
}) => {
  const { colors } = useThemeStore();

  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    // Fade in
    opacity.value = withTiming(0.8, { duration: 500 });
    scale.value = withSpring(1, { damping: 15, stiffness: 100 });

    // Spiral toward center
    progress.value = withTiming(1, {
      duration: particleConfig.textDriftDuration,
      easing: Easing.inOut(Easing.cubic),
    }, (finished) => {
      if (finished) {
        // Fade out as it reaches Mindi
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.3, { duration: 300 }, () => {
          runOnJS(onComplete)(particle.id);
        });
      }
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Spiral path calculation
    const startRadius = 250;
    const endRadius = 30;
    const rotations = 1.5; // Number of full rotations while spiraling

    const currentRadius = interpolate(
      progress.value,
      [0, 1],
      [startRadius, endRadius]
    );

    const currentAngle = particle.startAngle + (progress.value * rotations * Math.PI * 2);

    const x = CENTER_X + Math.cos(currentAngle) * currentRadius;
    const y = CENTER_Y + Math.sin(currentAngle) * currentRadius;

    // Audio reactive glow
    const glowIntensity = 1 + audioLevel * 0.3;

    return {
      transform: [
        { translateX: x - SCREEN_WIDTH / 2 },
        { translateY: y - SCREEN_HEIGHT / 2 },
        { scale: scale.value * glowIntensity },
        { rotate: `${currentAngle * 0.2}rad` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.textContainer, animatedStyle]}>
      <Text
        style={[
          styles.affirmationText,
          { color: colors.textPrimary },
        ]}
        numberOfLines={2}
      >
        {particle.text}
      </Text>
    </Animated.View>
  );
};

export default function AffirmationSpirals({
  affirmations,
  isPlaying,
  audioLevel = 0,
  currentIndex = 0,
}: AffirmationSpiralsProps) {
  const [activeParticles, setActiveParticles] = useState<AffirmationParticle[]>([]);
  const particleIdRef = useRef(0);
  const lastSpawnedIndexRef = useRef(-1);

  // Spawn particle when TTS changes to a new affirmation (synced with speech)
  useEffect(() => {
    if (!isPlaying || affirmations.length === 0) return;

    // Only spawn if this is a new affirmation index
    if (currentIndex !== lastSpawnedIndexRef.current) {
      lastSpawnedIndexRef.current = currentIndex;

      // Get the current affirmation being spoken
      const text = affirmations[currentIndex % affirmations.length];

      // Random start position on the edge
      const angle = Math.random() * Math.PI * 2;

      const particle: AffirmationParticle = {
        id: particleIdRef.current++,
        text,
        startX: CENTER_X + Math.cos(angle) * 250,
        startY: CENTER_Y + Math.sin(angle) * 250,
        startAngle: angle,
      };

      setActiveParticles(prev => {
        // Limit max particles on screen
        if (prev.length >= particleConfig.textMaxOnScreen) {
          return [...prev.slice(1), particle];
        }
        return [...prev, particle];
      });
    }
  }, [isPlaying, affirmations, currentIndex]);

  // Reset when stopped
  useEffect(() => {
    if (!isPlaying) {
      lastSpawnedIndexRef.current = -1;
    }
  }, [isPlaying]);

  // Handle particle completion (absorbed by Mindi)
  const handleParticleComplete = useCallback((id: number) => {
    setActiveParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  if (!isPlaying) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {activeParticles.map(particle => (
        <SpiralText
          key={particle.id}
          particle={particle}
          onComplete={handleParticleComplete}
          audioLevel={audioLevel}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    maxWidth: 200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  affirmationText: {
    ...typography.bodySmall,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
