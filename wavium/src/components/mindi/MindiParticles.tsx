/**
 * WAVIUM - Mindi Particles
 * Ethereal orbs that float around and get absorbed by Mindi
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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
  withSpring,
  withDelay,
  Easing,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { particles } from '../../theme/animations';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  angle: number;
  distance: number;
  speed: number;
}

interface MindiParticlesProps {
  size: number;
  intensity: number; // 0-1
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  absorbing?: boolean;
}

const AnimatedParticle = ({
  particle,
  center,
  absorbing,
  color,
  onAbsorbed,
}: {
  particle: Particle;
  center: number;
  absorbing: boolean;
  color: string;
  onAbsorbed: (id: number) => void;
}) => {
  const translateX = useSharedValue(particle.x);
  const translateY = useSharedValue(particle.y);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(particle.opacity);

  useEffect(() => {
    if (absorbing) {
      // Move towards center (Mindi)
      translateX.value = withTiming(center, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.inOut(Easing.cubic),
      });
      translateY.value = withTiming(center, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.inOut(Easing.cubic),
      });
      scale.value = withTiming(0, { duration: 2500 });
      opacity.value = withTiming(0, { duration: 2500 }, (finished) => {
        if (finished) {
          runOnJS(onAbsorbed)(particle.id);
        }
      });
    } else {
      // Orbital floating motion
      const orbitDuration = particles.driftDuration[0] +
        Math.random() * (particles.driftDuration[1] - particles.driftDuration[0]);

      // Continuous orbital movement
      translateX.value = withRepeat(
        withTiming(
          center + Math.cos(particle.angle + Math.PI) * particle.distance,
          { duration: orbitDuration, easing: Easing.inOut(Easing.sin) }
        ),
        -1,
        true
      );

      translateY.value = withRepeat(
        withTiming(
          center + Math.sin(particle.angle + Math.PI) * particle.distance,
          { duration: orbitDuration * 1.1, easing: Easing.inOut(Easing.sin) }
        ),
        -1,
        true
      );

      // Subtle size pulsing
      scale.value = withRepeat(
        withTiming(1.2, { duration: orbitDuration / 2 }),
        -1,
        true
      );
    }
  }, [absorbing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value - particle.size / 2 },
      { translateY: translateY.value - particle.size / 2 },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: particle.size,
          height: particle.size,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: particle.size, height: particle.size }}>
        <Circle cx={particle.size / 2} cy={particle.size / 2} r={particle.size / 2}>
          <RadialGradient
            c={vec(particle.size / 2, particle.size / 2)}
            r={particle.size / 2}
            colors={[color, `${color}80`, 'transparent']}
          />
          <BlurMask blur={2} style="normal" />
        </Circle>
      </Canvas>
    </Animated.View>
  );
};

export default function MindiParticles({
  size,
  intensity,
  colors,
  absorbing = false,
}: MindiParticlesProps) {
  const center = size / 2;
  const particleCount = Math.floor(particles.count * intensity);

  const [particleList, setParticleList] = useState<Particle[]>(() => {
    return generateParticles(particleCount, center, size);
  });

  // Regenerate particles when absorbed
  const handleParticleAbsorbed = (id: number) => {
    if (!absorbing) {
      // Respawn the particle at a new position
      setParticleList(prev => {
        const newParticle = createParticle(id, center, size);
        return prev.map(p => p.id === id ? newParticle : p);
      });
    }
  };

  // Regenerate when intensity changes significantly
  useEffect(() => {
    const newCount = Math.floor(particles.count * intensity);
    if (newCount !== particleList.length) {
      setParticleList(generateParticles(newCount, center, size));
    }
  }, [intensity]);

  const particleColors = [colors.primary, colors.secondary, colors.accent];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {particleList.map((particle, index) => (
        <AnimatedParticle
          key={particle.id}
          particle={particle}
          center={center}
          absorbing={absorbing}
          color={particleColors[index % particleColors.length]}
          onAbsorbed={handleParticleAbsorbed}
        />
      ))}
    </View>
  );
}

function generateParticles(count: number, center: number, size: number): Particle[] {
  return Array.from({ length: count }, (_, i) => createParticle(i, center, size));
}

function createParticle(id: number, center: number, size: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const distance = particles.spawnRadius * 0.5 + Math.random() * particles.spawnRadius * 0.5;
  const x = center + Math.cos(angle) * distance;
  const y = center + Math.sin(angle) * distance;

  return {
    id,
    x,
    y,
    size: particles.minSize + Math.random() * (particles.maxSize - particles.minSize),
    opacity: particles.minOpacity + Math.random() * (particles.maxOpacity - particles.minOpacity),
    angle,
    distance,
    speed: 0.5 + Math.random() * 0.5,
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
