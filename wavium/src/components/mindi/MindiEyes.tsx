/**
 * WAVIUM - Mindi Eyes
 * Expressive eyes that convey emotion and state
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  Oval,
  Group,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { MindiState } from '../../stores/useMindiStore';
import { mindiCycles } from '../../theme/animations';

interface MindiEyesProps {
  size: number;
  bodyRadius: number;
  state: MindiState;
  touchX?: SharedValue<number>;
  touchY?: SharedValue<number>;
}

export default function MindiEyes({
  size,
  bodyRadius,
  state,
  touchX,
  touchY,
}: MindiEyesProps) {
  const blinkProgress = useSharedValue(0);
  const eyeOpenness = useSharedValue(1);
  const pupilX = useSharedValue(0);
  const pupilY = useSharedValue(0);
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const center = size / 2;

  // Eye dimensions - always expressive
  const eyeProps = useMemo(() => {
    const baseEyeWidth = bodyRadius * 0.25;
    const baseEyeHeight = bodyRadius * 0.3;
    const eyeSpacing = bodyRadius * 0.35;
    const eyeY = center - bodyRadius * 0.1;
    const expressiveness = 1.0; // Always fully expressive

    return {
      width: baseEyeWidth * expressiveness,
      height: baseEyeHeight * expressiveness,
      leftX: center - eyeSpacing,
      rightX: center + eyeSpacing,
      y: eyeY,
      pupilRadius: baseEyeWidth * 0.35 * expressiveness,
    };
  }, [bodyRadius, center]);

  // Touch-based pupil offset
  const touchPupilOffsetX = useDerivedValue(() => {
    if (!touchX) return 0;
    const dx = (touchX.value - center) * 0.015;
    const maxOffset = eyeProps.pupilRadius * 0.5;
    return Math.max(-maxOffset, Math.min(maxOffset, dx));
  });

  const touchPupilOffsetY = useDerivedValue(() => {
    if (!touchY) return 0;
    const dy = (touchY.value - center) * 0.015;
    const maxOffset = eyeProps.pupilRadius * 0.4;
    return Math.max(-maxOffset, Math.min(maxOffset, dy));
  });

  // Derived pupil positions (touch offset + state-driven offset)
  const leftPupilCx = useDerivedValue(() => eyeProps.leftX + touchPupilOffsetX.value + pupilX.value);
  const leftPupilCy = useDerivedValue(() => eyeProps.y + touchPupilOffsetY.value + pupilY.value);
  const rightPupilCx = useDerivedValue(() => eyeProps.rightX + touchPupilOffsetX.value + pupilX.value);
  const rightPupilCy = useDerivedValue(() => eyeProps.y + touchPupilOffsetY.value + pupilY.value);

  // Derived highlight positions (track with pupils)
  const leftHighlightCx = useDerivedValue(() => eyeProps.leftX - eyeProps.pupilRadius * 0.3 + touchPupilOffsetX.value + pupilX.value);
  const leftHighlightCy = useDerivedValue(() => eyeProps.y - eyeProps.pupilRadius * 0.3 + touchPupilOffsetY.value + pupilY.value);
  const rightHighlightCx = useDerivedValue(() => eyeProps.rightX - eyeProps.pupilRadius * 0.3 + touchPupilOffsetX.value + pupilX.value);
  const rightHighlightCy = useDerivedValue(() => eyeProps.y - eyeProps.pupilRadius * 0.3 + touchPupilOffsetY.value + pupilY.value);

  // Random blinking
  useEffect(() => {
    const triggerBlink = () => {
      blinkProgress.value = withSequence(
        withTiming(1, { duration: mindiCycles.blinkDuration / 2 }),
        withTiming(0, { duration: mindiCycles.blinkDuration / 2 })
      );
    };

    const scheduleNextBlink = () => {
      const delay = mindiCycles.blinkInterval[0] +
        Math.random() * (mindiCycles.blinkInterval[1] - mindiCycles.blinkInterval[0]);

      blinkTimeoutRef.current = setTimeout(() => {
        triggerBlink();
        scheduleNextBlink();
      }, delay);
    };

    scheduleNextBlink();

    // Cleanup timeout on unmount
    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
    };
  }, []);

  // State-specific eye behavior
  useEffect(() => {
    switch (state) {
      case 'peaceful':
        eyeOpenness.value = withTiming(0.4, { duration: 500 });
        break;
      case 'happy':
        eyeOpenness.value = withSequence(
          withTiming(1.2, { duration: 150 }),
          withTiming(1, { duration: 200 })
        );
        break;
      case 'excited':
        eyeOpenness.value = withTiming(1.3, { duration: 200 });
        pupilY.value = withTiming(-2, { duration: 200 });
        break;
      case 'listening':
        pupilX.value = withTiming(1, { duration: 300 });
        break;
      case 'generating':
        // Focused look while generating
        eyeOpenness.value = withTiming(0.9, { duration: 300 });
        break;
      default:
        eyeOpenness.value = withTiming(1, { duration: 300 });
        pupilX.value = withTiming(0, { duration: 300 });
        pupilY.value = withTiming(0, { duration: 300 });
    }
  }, [state]);

  const animatedEyeStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(
      blinkProgress.value,
      [0, 1],
      [eyeOpenness.value, 0.1]
    );

    return {
      transform: [{ scaleY }],
    };
  });

  const eyeColor = '#2d2d44';
  const pupilColor = '#1a1a2e';
  const highlightColor = '#ffffff';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedEyeStyle]}>
        <Canvas style={{ width: size, height: size }}>
          <Group>
            {/* Left Eye */}
            <Group>
              <Oval
                x={eyeProps.leftX - eyeProps.width / 2}
                y={eyeProps.y - eyeProps.height / 2}
                width={eyeProps.width}
                height={eyeProps.height}
              >
                <RadialGradient
                  c={vec(eyeProps.leftX, eyeProps.y)}
                  r={eyeProps.width}
                  colors={['#ffffff', '#f0f0f5', eyeColor]}
                />
              </Oval>
              <Circle
                cx={leftPupilCx}
                cy={leftPupilCy}
                r={eyeProps.pupilRadius}
                color={pupilColor}
              />
              <Circle
                cx={leftHighlightCx}
                cy={leftHighlightCy}
                r={eyeProps.pupilRadius * 0.3}
                color={highlightColor}
                opacity={0.8}
              />
            </Group>

            {/* Right Eye */}
            <Group>
              <Oval
                x={eyeProps.rightX - eyeProps.width / 2}
                y={eyeProps.y - eyeProps.height / 2}
                width={eyeProps.width}
                height={eyeProps.height}
              >
                <RadialGradient
                  c={vec(eyeProps.rightX, eyeProps.y)}
                  r={eyeProps.width}
                  colors={['#ffffff', '#f0f0f5', eyeColor]}
                />
              </Oval>
              <Circle
                cx={rightPupilCx}
                cy={rightPupilCy}
                r={eyeProps.pupilRadius}
                color={pupilColor}
              />
              <Circle
                cx={rightHighlightCx}
                cy={rightHighlightCy}
                r={eyeProps.pupilRadius * 0.3}
                color={highlightColor}
                opacity={0.8}
              />
            </Group>

            {/* Happy sparkles */}
            {(state === 'happy' || state === 'excited') && (
              <>
                <Circle
                  cx={eyeProps.leftX + eyeProps.width * 0.4}
                  cy={eyeProps.y - eyeProps.height * 0.3}
                  r={2}
                  color="#fff"
                  opacity={0.9}
                />
                <Circle
                  cx={eyeProps.rightX + eyeProps.width * 0.4}
                  cy={eyeProps.y - eyeProps.height * 0.3}
                  r={2}
                  color="#fff"
                  opacity={0.9}
                />
              </>
            )}
          </Group>
        </Canvas>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
