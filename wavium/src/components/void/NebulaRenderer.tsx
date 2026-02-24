/**
 * WAVIUM - Nebula Renderer
 * Audio-reactive cosmic nebula using Skia shaders
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  vec,
  RadialGradient,
  Group,
  BlurMask,
  Circle,
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
import { useThemeStore } from '../../stores/useThemeStore';
import { nebula } from '../../theme/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NebulaRendererProps {
  audioLevel: SharedValue<number>;
  gyroX: number;
  gyroY: number;
}

// Nebula cloud component with audio-reactive Skia props via useDerivedValue
const NebulaCloud = ({
  x,
  y,
  baseRadius,
  color,
  baseOpacity,
  blur,
  audioLevel,
  bassMultiplier,
}: {
  x: number;
  y: number;
  baseRadius: number;
  color: string;
  baseOpacity: number;
  blur: number;
  audioLevel: SharedValue<number>;
  bassMultiplier: number;
}) => {
  const derivedRadius = useDerivedValue(() => {
    return baseRadius * (1 + audioLevel.value * bassMultiplier);
  });
  const derivedOpacity = useDerivedValue(() => {
    return baseOpacity + audioLevel.value * 0.05;
  });

  return (
    <Circle cx={x} cy={y} r={derivedRadius} opacity={derivedOpacity}>
      <RadialGradient
        c={vec(x, y)}
        r={baseRadius}
        colors={[color, `${color}60`, `${color}20`, 'transparent']}
      />
      <BlurMask blur={blur} style="normal" />
    </Circle>
  );
};

export default function NebulaRenderer({
  audioLevel,
  gyroX,
  gyroY,
}: NebulaRendererProps) {
  const { colors } = useThemeStore();
  const [nebulaP, nebulaS, nebulaT] = colors.primaryGradient;

  // Animation values
  const morphProgress = useSharedValue(0);
  const pulseValue = useSharedValue(0);

  useEffect(() => {
    // Slow morphing animation
    morphProgress.value = withRepeat(
      withTiming(1, { duration: 20000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Pulse animation
    pulseValue.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  // Nebula cloud positions with parallax
  const clouds = useMemo(() => [
    {
      id: 1,
      baseX: SCREEN_WIDTH * 0.3,
      baseY: SCREEN_HEIGHT * 0.25,
      radius: 200,
      color: nebulaP,
      opacity: 0.15,
      blur: 80,
      parallaxFactor: 0.15,
    },
    {
      id: 2,
      baseX: SCREEN_WIDTH * 0.7,
      baseY: SCREEN_HEIGHT * 0.35,
      radius: 180,
      color: nebulaS,
      opacity: 0.12,
      blur: 70,
      parallaxFactor: 0.2,
    },
    {
      id: 3,
      baseX: SCREEN_WIDTH * 0.5,
      baseY: SCREEN_HEIGHT * 0.6,
      radius: 220,
      color: nebulaT,
      opacity: 0.1,
      blur: 90,
      parallaxFactor: 0.1,
    },
    {
      id: 4,
      baseX: SCREEN_WIDTH * 0.2,
      baseY: SCREEN_HEIGHT * 0.75,
      radius: 160,
      color: nebulaP,
      opacity: 0.08,
      blur: 60,
      parallaxFactor: 0.25,
    },
    {
      id: 5,
      baseX: SCREEN_WIDTH * 0.8,
      baseY: SCREEN_HEIGHT * 0.8,
      radius: 140,
      color: nebulaS,
      opacity: 0.1,
      blur: 50,
      parallaxFactor: 0.18,
    },
  ], [nebulaP, nebulaS, nebulaT]);

  // Calculate cloud positions with gyro offset
  const getCloudPosition = (cloud: typeof clouds[0]) => {
    const gyroOffsetX = gyroX * cloud.parallaxFactor * 50;
    const gyroOffsetY = gyroY * cloud.parallaxFactor * 50;
    return {
      x: cloud.baseX + gyroOffsetX,
      y: cloud.baseY + gyroOffsetY,
    };
  };

  const animatedStyle = useAnimatedStyle(() => {
    const audioVal = audioLevel.value;
    const audioScale = 1 + audioVal * nebula.bassIntensityMultiplier;
    const scale = interpolate(
      pulseValue.value,
      [0, 1],
      [1, 1.02]
    ) * audioScale;

    return {
      transform: [{ scale }],
      opacity: 0.8 + audioVal * 0.2,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Canvas style={styles.canvas}>
        <Group>
          {clouds.map((cloud) => {
            const pos = getCloudPosition(cloud);
            return (
              <NebulaCloud
                key={cloud.id}
                x={pos.x}
                y={pos.y}
                baseRadius={cloud.radius}
                color={cloud.color}
                baseOpacity={cloud.opacity}
                blur={cloud.blur}
                audioLevel={audioLevel}
                bassMultiplier={nebula.bassIntensityMultiplier}
              />
            );
          })}
        </Group>
      </Canvas>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    flex: 1,
  },
});
