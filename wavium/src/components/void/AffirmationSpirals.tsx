/**
 * WAVIUM - Affirmation Ceremony + Highlighting
 * Vertical list of affirmations with staggered reveal and current-item glow.
 * VOID-02: one-by-one reveal with staggered fade/translate animation
 * VOID-03: current affirmation highlighted with glow pulse, others dimmed
 */

import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { useThemeStore } from '../../stores/useThemeStore';
import { springs, timing } from '../../theme/animations';
import { textStyles, fontFamilies } from '../../theme/typography';

// ─── Types ───────────────────────────────────────────────────────────

interface AffirmationSpiralsProps {
  affirmations: string[];
  isPlaying: boolean;
  audioLevel?: SharedValue<number>;
  currentIndex?: number; // Current affirmation being spoken by TTS
}

interface AffirmationItemProps {
  text: string;
  index: number;
  isCurrent: boolean;
  isRevealed: boolean;
  glowColor: string;
  textColor: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const STAGGER_DELAY = 250; // ms between each item reveal
const REVEAL_FADE_DURATION = 500;
const TRANSLATE_Y_START = 20;
const DIM_OPACITY = 0.4;
const FULL_OPACITY = 1.0;
const HIGHLIGHT_TRANSITION_MS = 300;
const GLOW_PULSE_MIN = 10;
const GLOW_PULSE_MAX = 25;
const GLOW_PULSE_DURATION = timing.glowPulse; // 2000ms

// ─── AffirmationItem ─────────────────────────────────────────────────

const AffirmationItem = React.memo(function AffirmationItem({
  text,
  index,
  isCurrent,
  isRevealed,
  glowColor,
  textColor,
}: AffirmationItemProps) {
  // Reveal animation values
  const revealOpacity = useSharedValue(0);
  const revealTranslateY = useSharedValue(TRANSLATE_Y_START);

  // Highlight animation values
  const highlightOpacity = useSharedValue(DIM_OPACITY);
  const glowRadius = useSharedValue(GLOW_PULSE_MIN);

  // Staggered reveal on mount
  useEffect(() => {
    if (isRevealed) {
      revealOpacity.value = withDelay(
        index * STAGGER_DELAY,
        withTiming(1, { duration: REVEAL_FADE_DURATION })
      );
      revealTranslateY.value = withDelay(
        index * STAGGER_DELAY,
        withSpring(0, springs.gentle)
      );
    }
  }, [isRevealed]);

  // Highlight/dim transition when currentIndex changes
  useEffect(() => {
    if (!isRevealed) return;

    if (isCurrent) {
      highlightOpacity.value = withTiming(FULL_OPACITY, {
        duration: HIGHLIGHT_TRANSITION_MS,
      });
      // Pulsing glow on current item
      glowRadius.value = withRepeat(
        withTiming(GLOW_PULSE_MAX, {
          duration: GLOW_PULSE_DURATION,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      );
    } else {
      highlightOpacity.value = withTiming(DIM_OPACITY, {
        duration: HIGHLIGHT_TRANSITION_MS,
      });
      cancelAnimation(glowRadius);
      glowRadius.value = withTiming(GLOW_PULSE_MIN, { duration: 200 });
    }
  }, [isCurrent, isRevealed]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimation(revealOpacity);
      cancelAnimation(revealTranslateY);
      cancelAnimation(highlightOpacity);
      cancelAnimation(glowRadius);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const combinedOpacity = revealOpacity.value * highlightOpacity.value;

    return {
      opacity: combinedOpacity,
      transform: [{ translateY: revealTranslateY.value }],
      textShadowRadius: glowRadius.value,
    };
  });

  return (
    <Animated.Text
      style={[
        styles.affirmationText,
        {
          color: textColor,
          textShadowColor: glowColor,
        },
        animatedStyle,
      ]}
    >
      {text}
    </Animated.Text>
  );
});

// ─── AffirmationSpirals (main) ───────────────────────────────────────

export default function AffirmationSpirals({
  affirmations,
  isPlaying,
  audioLevel,
  currentIndex = 0,
}: AffirmationSpiralsProps) {
  const { colors } = useThemeStore();

  const glowColor = colors.primaryGradient[0];
  const textColor = colors.textPrimary;

  // Memoize item data to avoid re-renders
  const items = useMemo(
    () => affirmations.map((text, i) => ({ text, key: `aff-${i}` })),
    [affirmations]
  );

  if (!isPlaying || affirmations.length === 0) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      pointerEvents="none"
    >
      {items.map((item, index) => (
        <AffirmationItem
          key={item.key}
          text={item.text}
          index={index}
          isCurrent={index === currentIndex}
          isRevealed={isPlaying}
          glowColor={glowColor}
          textColor={textColor}
        />
      ))}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  affirmationText: {
    ...textStyles.affirmation,
    fontFamily: fontFamilies.editorialRegular,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginVertical: 12,
  },
});
