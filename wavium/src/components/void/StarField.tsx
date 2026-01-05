/**
 * WAVIUM - Star Field
 * Procedurally generated stars with parallax and twinkling
 */

import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
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
  audioLevel?: number;
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
  audioLevel = 0,
}: {
  star: Star;
  audioLevel?: number;
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
      opacity.value + audioLevel * 0.3,
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

export default function StarField({
  layer,
  gyroX,
  gyroY,
  audioLevel = 0,
}: StarFieldProps) {
  // Memoize stars so they don't regenerate on every render
  const stars = useMemo(() => generateStars(layer), [layer]);

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
