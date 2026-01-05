/**
 * WAVIUM - Mindi Glow Effect
 * Multi-layered ethereal glow that pulses with audio
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  RadialGradient,
  vec,
  BlurMask,
  Group,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { mindiCycles } from '../../theme/animations';

interface MindiGlowProps {
  size: number;
  intensity: number; // 0-1
  layers: number; // 1-5
  color: string;
  audioLevel?: number;
}

export default function MindiGlow({
  size,
  intensity,
  layers,
  color,
  audioLevel = 0,
}: MindiGlowProps) {
  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, {
        duration: mindiCycles.glowPulseDuration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, []);

  const center = size / 2;
  const baseRadius = size * 0.35;

  // Generate glow layers with decreasing opacity
  const glowLayers = Array.from({ length: layers }, (_, i) => {
    const layerIndex = i + 1;
    const radiusMultiplier = 1 + (layerIndex * 0.3);
    const opacity = (0.3 / layerIndex) * intensity;
    const blur = 10 + (layerIndex * 8);

    return {
      radius: baseRadius * radiusMultiplier,
      opacity,
      blur,
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pulseAnim.value,
      [0, 1],
      [1, 1 + (intensity * 0.1) + (audioLevel * 0.15)]
    );
    const opacityMod = interpolate(
      pulseAnim.value,
      [0, 1],
      [0.8, 1]
    );

    return {
      transform: [{ scale }],
      opacity: opacityMod,
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: size, height: size }}>
        <Group>
          {glowLayers.map((layer, index) => (
            <Circle
              key={index}
              cx={center}
              cy={center}
              r={layer.radius}
              opacity={layer.opacity + (audioLevel * 0.1)}
            >
              <RadialGradient
                c={vec(center, center)}
                r={layer.radius}
                colors={[
                  color,
                  `${color}80`,
                  `${color}40`,
                  'transparent',
                ]}
              />
              <BlurMask blur={layer.blur} style="normal" />
            </Circle>
          ))}
        </Group>
      </Canvas>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
