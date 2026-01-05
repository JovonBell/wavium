/**
 * WAVIUM - Parallax Layer
 * Gyroscope-based parallax container for immersive depth
 */

import React, { useEffect, useCallback, ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { springs } from '../../theme/animations';

interface ParallaxLayerProps {
  children: ReactNode;
  onGyroUpdate?: (x: number, y: number) => void;
  sensitivity?: number;
  enabled?: boolean;
}

export default function ParallaxLayer({
  children,
  onGyroUpdate,
  sensitivity = 1,
  enabled = true,
}: ParallaxLayerProps) {
  // Gyroscope values with smoothing
  const gyroX = useSharedValue(0);
  const gyroY = useSharedValue(0);

  // Calibration offset (set when entering the void)
  const calibrationX = useSharedValue(0);
  const calibrationY = useSharedValue(0);

  // Raw accumulated rotation
  const rawX = useSharedValue(0);
  const rawY = useSharedValue(0);

  useEffect(() => {
    if (!enabled) return;

    let subscription: { remove: () => void } | null = null;

    const startGyroscope = async () => {
      try {
        // Check if gyroscope is available
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable) {
          console.log('Gyroscope not available');
          return;
        }

        // Set update interval (60fps)
        Gyroscope.setUpdateInterval(16);

        // Calibrate after a short delay
        setTimeout(() => {
          calibrationX.value = rawX.value;
          calibrationY.value = rawY.value;
        }, 500);

        // Subscribe to gyroscope updates
        subscription = Gyroscope.addListener(({ x, y, z }) => {
          // Accumulate rotation (gyroscope gives angular velocity)
          // We integrate over time to get rotation
          const dt = 0.016; // 16ms
          rawX.value += x * dt * sensitivity;
          rawY.value += y * dt * sensitivity;

          // Clamp to prevent extreme values
          rawX.value = Math.max(-1, Math.min(1, rawX.value));
          rawY.value = Math.max(-1, Math.min(1, rawY.value));

          // Apply calibration offset and spring smoothing
          const calibratedX = rawX.value - calibrationX.value;
          const calibratedY = rawY.value - calibrationY.value;

          // Smooth with spring physics
          gyroX.value = withSpring(calibratedX, springs.parallax);
          gyroY.value = withSpring(calibratedY, springs.parallax);

          // Notify parent
          onGyroUpdate?.(calibratedX, calibratedY);
        });
      } catch (error) {
        console.error('Error starting gyroscope:', error);
      }
    };

    startGyroscope();

    return () => {
      subscription?.remove();
    };
  }, [enabled, sensitivity, onGyroUpdate]);

  // Animated style for the main container
  const animatedStyle = useAnimatedStyle(() => {
    // Subtle overall tilt effect
    const rotateX = interpolate(
      gyroY.value,
      [-1, 1],
      [2, -2],
      Extrapolation.CLAMP
    );
    const rotateY = interpolate(
      gyroX.value,
      [-1, 1],
      [-2, 2],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotateX}deg` },
        { rotateY: `${rotateY}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// Hook for child components to access gyro values
export function useGyroscope(enabled = true) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  useEffect(() => {
    if (!enabled) return;

    let subscription: { remove: () => void } | null = null;

    const start = async () => {
      const isAvailable = await Gyroscope.isAvailableAsync();
      if (!isAvailable) return;

      Gyroscope.setUpdateInterval(16);

      subscription = Gyroscope.addListener((data) => {
        const dt = 0.016;
        x.value = withSpring(
          Math.max(-1, Math.min(1, x.value + data.x * dt)),
          springs.parallax
        );
        y.value = withSpring(
          Math.max(-1, Math.min(1, y.value + data.y * dt)),
          springs.parallax
        );
      });
    };

    start();

    return () => {
      subscription?.remove();
    };
  }, [enabled]);

  return { x, y };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
