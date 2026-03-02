/**
 * WAVIUM - Affirmation Display (One-at-a-time crossfade)
 * Shows a single affirmation at a time in the lower half of the screen.
 * Crossfades between affirmations: out fades -20px up, in fades +20px up.
 * A subtle "breath" scale (1.0→1.02) gives a living feel.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { fontFamilies } from '../../theme/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────

interface AffirmationSpiralsProps {
  affirmations: string[];
  isPlaying: boolean;
  audioLevel?: SharedValue<number>;
  currentIndex?: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const FADE_DURATION_MS = 600;
const TRANSLATE_OFFSET = 20;
const OVERLAP_MS = 200;
const GLOW_PULSE_MAX = 25; // Static glow radius applied via stylesheet

// ─── AffirmationSpirals ──────────────────────────────────────────────

export default function AffirmationSpirals({
  affirmations,
  isPlaying,
  audioLevel,
  currentIndex = 0,
}: AffirmationSpiralsProps) {
  const { colors } = useThemeStore();
  const glowColor = colors.primaryGradient[0];

  // We maintain two "slots": current (visible) and next (fading in)
  // Each slot has its own text, opacity, translateY, and glow
  const slotAText = useRef(affirmations[currentIndex] ?? '');
  const slotBText = useRef('');
  const activeSlot = useRef<'A' | 'B'>('A');

  const opacityA = useSharedValue(isPlaying ? 1 : 0);
  const translateYA = useSharedValue(0);
  const opacityB = useSharedValue(0);
  const translateYB = useSharedValue(TRANSLATE_OFFSET);

  // Breath scale on active slot
  const breathScale = useSharedValue(1);

  // Track displayed text in state so React re-renders
  const [displayA, setDisplayA] = React.useState(affirmations[currentIndex] ?? '');
  const [displayB, setDisplayB] = React.useState('');

  // Start breath + glow on mount when playing
  useEffect(() => {
    if (!isPlaying) return;
    breathScale.value = withRepeat(
      withTiming(1.02, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    return () => {
      cancelAnimation(breathScale);
    };
  }, [isPlaying]);

  // Trigger crossfade when currentIndex changes
  const prevIndex = useRef(currentIndex);
  useEffect(() => {
    if (!isPlaying || affirmations.length === 0) return;
    if (currentIndex === prevIndex.current) return;
    prevIndex.current = currentIndex;

    const newText = affirmations[currentIndex] ?? '';

    if (activeSlot.current === 'A') {
      // A is active -> B fades in, A fades out
      slotBText.current = newText;
      setDisplayB(newText);
      opacityB.value = 0;
      translateYB.value = TRANSLATE_OFFSET;

      // After overlap ms, start incoming
      setTimeout(() => {
        opacityB.value = withTiming(1, { duration: FADE_DURATION_MS });
        translateYB.value = withTiming(0, { duration: FADE_DURATION_MS });
      }, OVERLAP_MS);

      // Outgoing fade starts now
      opacityA.value = withTiming(0, { duration: FADE_DURATION_MS });
      translateYA.value = withTiming(-TRANSLATE_OFFSET, { duration: FADE_DURATION_MS });

      activeSlot.current = 'B';
    } else {
      // B is active -> A fades in, B fades out
      slotAText.current = newText;
      setDisplayA(newText);
      opacityA.value = 0;
      translateYA.value = TRANSLATE_OFFSET;

      setTimeout(() => {
        opacityA.value = withTiming(1, { duration: FADE_DURATION_MS });
        translateYA.value = withTiming(0, { duration: FADE_DURATION_MS });
      }, OVERLAP_MS);

      opacityB.value = withTiming(0, { duration: FADE_DURATION_MS });
      translateYB.value = withTiming(-TRANSLATE_OFFSET, { duration: FADE_DURATION_MS });

      activeSlot.current = 'A';
    }
  }, [currentIndex, isPlaying, affirmations]);

  // Initial show when playback starts
  useEffect(() => {
    if (isPlaying && affirmations.length > 0) {
      setDisplayA(affirmations[0]);
      opacityA.value = withTiming(1, { duration: FADE_DURATION_MS });
      translateYA.value = withTiming(0, { duration: FADE_DURATION_MS });
    }
  }, [isPlaying]);

  const styleA = useAnimatedStyle(() => ({
    opacity: opacityA.value,
    transform: [
      { translateY: translateYA.value },
      { scale: breathScale.value },
    ],
  }));

  const styleB = useAnimatedStyle(() => ({
    opacity: opacityB.value,
    transform: [
      { translateY: translateYB.value },
      { scale: breathScale.value },
    ],
  }));

  if (!isPlaying || affirmations.length === 0) return null;

  return (
    <>
      <Animated.Text
        style={[
          styles.affirmationText,
          { color: colors.textPrimary, textShadowColor: glowColor },
          styleA,
        ]}
        numberOfLines={3}
        ellipsizeMode="tail"
        pointerEvents="none"
      >
        {displayA}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.affirmationText,
          { color: colors.textPrimary, textShadowColor: glowColor },
          styleB,
        ]}
        numberOfLines={3}
        ellipsizeMode="tail"
        pointerEvents="none"
      >
        {displayB}
      </Animated.Text>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  affirmationText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SCREEN_HEIGHT * 0.60,
    paddingHorizontal: 40,
    fontFamily: fontFamilies.editorialRegular,
    fontSize: 22,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    // textShadowRadius is kept as a static value here rather than animated
    // because Reanimated's useAnimatedStyle does not support textShadowRadius
    // as an animatable property on the new architecture (Fabric).
    textShadowRadius: GLOW_PULSE_MAX,
  },
});
