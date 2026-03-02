/**
 * WAVIUM - Star Field
 * Procedurally generated stars with parallax and twinkling
 */

import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { starField } from '../../theme/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleOffset: number;
  twinkleDuration: number;
}

interface StarFieldProps {
  layer: 'deep' | 'medium' | 'near';
  gyroX: number;
  gyroY: number;
  audioLevel?: SharedValue<number>;
}

// Generate stars for a layer
function generateStars(layer: 'deep' | 'medium' | 'near'): Star[] {
  const config = {
    deep: {
      count: starField.deepCount,
      minSize: starField.deepMinSize,
      maxSize: starField.deepMaxSize,
    },
    medium: {
      count: starField.mediumCount,
      minSize: starField.mediumMinSize,
      maxSize: starField.mediumMaxSize,
    },
    near: {
      count: starField.nearCount,
      minSize: starField.nearMinSize,
      maxSize: starField.nearMaxSize,
    },
  }[layer];

  return Array.from({ length: config.count }, (_, i) => ({
    id: i,
    x: Math.random() * (SCREEN_WIDTH + 100) - 50,
    y: Math.random() * (SCREEN_HEIGHT + 100) - 50,
    size: config.minSize + Math.random() * (config.maxSize - config.minSize),
    opacity: starField.twinkleMinOpacity +
      Math.random() * (starField.twinkleMaxOpacity - starField.twinkleMinOpacity),
    twinkleOffset: Math.random() * 1000,
    twinkleDuration: starField.twinkleDuration[0] +
      Math.random() * (starField.twinkleDuration[1] - starField.twinkleDuration[0]),
  }));
}

// Individual twinkling star
const TwinklingStar = ({
  star,
  audioLevel,
}: {
  star: Star;
  audioLevel?: SharedValue<number>;
}) => {
  const opacity = useSharedValue(star.opacity);

  useEffect(() => {
    // Random twinkle animation
    opacity.value = withDelay(
      star.twinkleOffset,
      withRepeat(
        withTiming(
          starField.twinkleMinOpacity,
          { duration: star.twinkleDuration / 2, easing: Easing.inOut(Easing.sin) }
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      opacity.value + (audioLevel?.value ?? 0) * 0.3,
      [0, 1],
      [starField.twinkleMinOpacity, starField.twinkleMaxOpacity]
    ),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: star.x,
          top: star.y,
          width: star.size * 2,
          height: star.size * 2,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: star.size * 2, height: star.size * 2 }}>
        <Circle cx={star.size} cy={star.size} r={star.size}>
          <RadialGradient
            c={vec(star.size, star.size)}
            r={star.size}
            colors={['#ffffff', '#ffffff80', 'transparent']}
          />
        </Circle>
      </Canvas>
    </Animated.View>
  );
};

// ─── ShootingStar ──────────────────────────────────────────────────

interface ShootingStarData {
  id: number;
  startX: number;
  startY: number;
  length: number;
}

const ShootingStar = React.memo(function ShootingStar({
  star,
  onDone,
}: {
  star: ShootingStarData;
  onDone: (id: number) => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const duration = 650 + Math.random() * 200;
    translateX.value = withTiming(-(star.length * 1.5), { duration });
    translateY.value = withTiming(star.length * 0.7, { duration });
    opacity.value = withDelay(
      duration * 0.5,
      withTiming(0, { duration: duration * 0.5 }, (finished) => {
        if (finished) {
          // Schedule removal outside of worklet
        }
      })
    );
    // Remove after animation completes
    const timer = setTimeout(() => onDone(star.id), duration + 100);
    return () => clearTimeout(timer);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: star.startX,
          top: star.startY,
          width: star.length,
          height: 2,
          borderRadius: 1,
          transform: [{ rotate: '-30deg' }],
        },
        style,
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
});

// ─── StarField ────────────────────────────────────────────────────

export default function StarField({
  layer,
  gyroX,
  gyroY,
  audioLevel,
}: StarFieldProps) {
  // Memoize stars so they don't regenerate on every render
  const stars = useMemo(() => generateStars(layer), [layer]);

  // Shooting stars — only on 'near' layer to avoid triple-spawning
  const [shootingStars, setShootingStars] = useState<ShootingStarData[]>([]);
  const shootingStarIdRef = React.useRef(0);

  useEffect(() => {
    if (layer !== 'near') return;

    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 7000; // 8-15 seconds
      return setTimeout(() => {
        setShootingStars((prev) => {
          if (prev.length >= 1) return prev; // max 1 at a time
          const id = ++shootingStarIdRef.current;
          return [
            ...prev,
            {
              id,
              startX: SCREEN_WIDTH * 0.5 + Math.random() * SCREEN_WIDTH * 0.4,
              startY: 50 + Math.random() * SCREEN_HEIGHT * 0.3,
              length: 80 + Math.random() * 40,
            },
          ];
        });
        intervalRef.current = scheduleNext();
      }, delay);
    };

    const intervalRef = { current: scheduleNext() };
    return () => clearTimeout(intervalRef.current);
  }, [layer]);

  // Get parallax multiplier for this layer
  const parallaxMultiplier = {
    deep: starField.deepParallax,
    medium: starField.mediumParallax,
    near: starField.nearParallax,
  }[layer];

  // Animated container for parallax effect
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -gyroX * parallaxMultiplier * 30 },
      { translateY: -gyroY * parallaxMultiplier * 30 },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {stars.map((star) => (
        <TwinklingStar
          key={star.id}
          star={star}
          audioLevel={audioLevel}
        />
      ))}
      {shootingStars.map((star) => (
        <ShootingStar
          key={star.id}
          star={star}
          onDone={(id) => setShootingStars((prev) => prev.filter((s) => s.id !== id))}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    // Extend beyond screen for parallax movement
    left: -50,
    top: -50,
    right: -50,
    bottom: -50,
  },
});
