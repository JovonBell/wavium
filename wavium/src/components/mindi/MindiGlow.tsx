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
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
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
  audioLevel?: SharedValue<number>;
}

// Sub-component for each glow circle so useDerivedValue can be called per-layer
const GlowCircle = ({
  cx,
  cy,
  radius,
  baseOpacity,
  color,
  blur,
  audioLevel,
}: {
  cx: number;
  cy: number;
  radius: number;
  baseOpacity: number;
  color: string;
  blur: number;
  audioLevel?: SharedValue<number>;
}) => {
  const derivedOpacity = useDerivedValue(() => {
    return baseOpacity + (audioLevel?.value ?? 0) * 0.1;
  });

  return (
    <Circle cx={cx} cy={cy} r={radius} opacity={derivedOpacity}>
      <RadialGradient
        c={vec(cx, cy)}
        r={radius}
        colors={[color, `${color}80`, `${color}40`, 'transparent']}
      />
      <BlurMask blur={blur} style="normal" />
    </Circle>
  );
};

export default function MindiGlow({
  size,
  intensity,
  layers,
  color,
  audioLevel,
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
    const audioVal = audioLevel?.value ?? 0;
    const scale = interpolate(
      pulseAnim.value,
      [0, 1],
      [1, 1 + (intensity * 0.1) + (audioVal * 0.2)]
    );
    const opacityMod = interpolate(
      pulseAnim.value,
      [0, 1],
      [0.7 + audioVal * 0.15, 1]
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
            <GlowCircle
              key={index}
              cx={center}
              cy={center}
              radius={layer.radius}
              baseOpacity={layer.opacity}
              color={color}
              blur={layer.blur}
              audioLevel={audioLevel}
            />
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
