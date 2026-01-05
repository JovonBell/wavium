/**
 * WAVIUM - Void Portal
 * The swirling portal that leads into the void
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
  BlurMask,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/useThemeStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VoidPortalProps {
  onEnterComplete?: () => void;
  autoStart?: boolean;
}

// Generate spiral path
function createSpiralPath(
  centerX: number,
  centerY: number,
  startRadius: number,
  endRadius: number,
  turns: number,
  points: number
): string {
  const path = [];
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    const angle = progress * turns * Math.PI * 2;
    const radius = startRadius + (endRadius - startRadius) * progress;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    if (i === 0) {
      path.push(`M ${x} ${y}`);
    } else {
      path.push(`L ${x} ${y}`);
    }
  }
  return path.join(' ');
}

export default function VoidPortal({
  onEnterComplete,
  autoStart = true,
}: VoidPortalProps) {
  const { colors } = useThemeStore();

  // Animation values
  const rotation = useSharedValue(0);
  const portalScale = useSharedValue(0);
  const portalOpacity = useSharedValue(0);
  const vortexIntensity = useSharedValue(0);
  const screenDarkness = useSharedValue(0);

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;
  const maxRadius = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.45;

  // Spiral paths for the vortex effect
  const spiralPath1 = createSpiralPath(centerX, centerY, 20, maxRadius, 3, 100);
  const spiralPath2 = createSpiralPath(centerX, centerY, 30, maxRadius * 0.9, 2.5, 80);
  const spiralPath3 = createSpiralPath(centerX, centerY, 40, maxRadius * 0.8, 2, 60);

  useEffect(() => {
    if (!autoStart) return;

    // Start portal opening sequence
    const startSequence = async () => {
      // Portal appears
      portalOpacity.value = withTiming(1, { duration: 1000 });
      portalScale.value = withTiming(1, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      });

      // Start rotation
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await delay(1500);

      // Vortex intensifies
      vortexIntensity.value = withTiming(1, { duration: 2000 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      await delay(2000);

      // Pull into the void
      screenDarkness.value = withTiming(1, { duration: 1500 });
      portalScale.value = withTiming(3, {
        duration: 1500,
        easing: Easing.in(Easing.cubic),
      });

      await delay(1500);

      onEnterComplete?.();
    };

    startSequence();
  }, [autoStart]);

  const portalStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: portalScale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: portalOpacity.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${screenDarkness.value})`,
  }));

  const vortexStyle = useAnimatedStyle(() => ({
    opacity: interpolate(vortexIntensity.value, [0, 1], [0.3, 0.8]),
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background stars */}
      <Canvas style={StyleSheet.absoluteFill}>
        {Array.from({ length: 50 }, (_, i) => (
          <Circle
            key={i}
            cx={Math.random() * SCREEN_WIDTH}
            cy={Math.random() * SCREEN_HEIGHT}
            r={Math.random() * 2 + 0.5}
            color={`rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`}
          />
        ))}
      </Canvas>

      {/* Portal vortex */}
      <Animated.View
        style={[
          styles.portalContainer,
          { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
          portalStyle,
        ]}
      >
        <Canvas style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
          <Group>
            {/* Center void */}
            <Circle cx={centerX} cy={centerY} r={maxRadius * 0.15}>
              <RadialGradient
                c={vec(centerX, centerY)}
                r={maxRadius * 0.15}
                colors={['#000000', '#050510', colors.primary + '40']}
              />
            </Circle>

            {/* Inner glow rings */}
            {[0.2, 0.35, 0.5, 0.65, 0.8, 0.95].map((ratio, i) => (
              <Circle
                key={i}
                cx={centerX}
                cy={centerY}
                r={maxRadius * ratio}
                strokeWidth={2 - i * 0.2}
                opacity={0.3 - i * 0.03}
              >
                <RadialGradient
                  c={vec(centerX, centerY)}
                  r={maxRadius * ratio}
                  colors={[colors.primary, colors.secondary, 'transparent']}
                />
              </Circle>
            ))}

            {/* Spiral arms */}
            <Path
              path={Skia.Path.MakeFromSVGString(spiralPath1)!}
              strokeWidth={3}
              color={colors.primary}
              opacity={0.4}
            >
              <BlurMask blur={4} style="normal" />
            </Path>

            <Path
              path={Skia.Path.MakeFromSVGString(spiralPath2)!}
              strokeWidth={2}
              color={colors.secondary}
              opacity={0.3}
            >
              <BlurMask blur={3} style="normal" />
            </Path>

            <Path
              path={Skia.Path.MakeFromSVGString(spiralPath3)!}
              strokeWidth={1.5}
              color={colors.accent}
              opacity={0.2}
            >
              <BlurMask blur={2} style="normal" />
            </Path>

            {/* Outer glow */}
            <Circle cx={centerX} cy={centerY} r={maxRadius}>
              <RadialGradient
                c={vec(centerX, centerY)}
                r={maxRadius}
                colors={['transparent', `${colors.primary}20`, `${colors.primary}40`]}
              />
              <BlurMask blur={30} style="normal" />
            </Circle>
          </Group>
        </Canvas>
      </Animated.View>

      {/* Vortex overlay effect */}
      <Animated.View
        style={[styles.vortexOverlay, vortexStyle]}
        pointerEvents="none"
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Circle cx={centerX} cy={centerY} r={maxRadius * 1.2}>
            <RadialGradient
              c={vec(centerX, centerY)}
              r={maxRadius * 1.2}
              colors={['transparent', `${colors.primary}10`, `${colors.primary}30`]}
            />
          </Circle>
        </Canvas>
      </Animated.View>

      {/* Darkness overlay for transition */}
      <Animated.View
        style={[StyleSheet.absoluteFill, overlayStyle]}
        pointerEvents="none"
      />
    </View>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalContainer: {
    position: 'absolute',
  },
  vortexOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
