/**
 * WAVIUM - Streak Display
 * Shows user's current listening streak with fire emoji
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMindiStore } from '@/stores/useMindiStore';
import { useThemeStore } from '@/stores/useThemeStore';

interface StreakDisplayProps {
  /** Show longest streak below current streak */
  showBest?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
}

/**
 * StreakDisplay - Shows the user's current listening streak
 *
 * @example
 * <StreakDisplay />
 * <StreakDisplay showBest size="large" />
 */
export function StreakDisplay({
  showBest = true,
  size = 'medium',
}: StreakDisplayProps) {
  const currentStreak = useMindiStore((state) => state.currentStreak);
  const longestStreak = useMindiStore((state) => state.longestStreak);
  const { colors } = useThemeStore();

  // Size-based styling
  const sizeStyles = {
    small: { emoji: 16, count: 14, best: 10 },
    medium: { emoji: 20, count: 18, best: 12 },
    large: { emoji: 28, count: 24, best: 14 },
  };

  const sizes = sizeStyles[size];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.emoji, { fontSize: sizes.emoji }]}>
          {currentStreak > 0 ? '\u{1F525}' : '\u{2744}\uFE0F'}
        </Text>
        <Text
          style={[
            styles.count,
            {
              fontSize: sizes.count,
              color: currentStreak > 0 ? colors.primary : colors.textMuted,
            },
          ]}
        >
          {currentStreak}
        </Text>
        <Text style={[styles.label, { color: colors.textMuted, fontSize: sizes.best }]}>
          day{currentStreak !== 1 ? 's' : ''}
        </Text>
      </View>

      {showBest && longestStreak > currentStreak && (
        <Text
          style={[
            styles.bestStreak,
            { color: colors.textMuted, fontSize: sizes.best },
          ]}
        >
          Best: {longestStreak} days
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emoji: {
    marginRight: 2,
  },
  count: {
    fontWeight: 'bold',
  },
  label: {
    marginLeft: 2,
  },
  bestStreak: {
    marginTop: 2,
    opacity: 0.7,
  },
});
