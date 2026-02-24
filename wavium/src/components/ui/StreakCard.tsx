/**
 * WAVIUM - Streak Card
 * Shows daily login streak with motivational messaging
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  isNewDay: boolean;
}

// Motivational messages based on streak length
function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Start your journey today';
  if (streak === 1) return 'Day 1 — every journey starts here';
  if (streak === 2) return 'Back again — momentum is building';
  if (streak <= 4) return 'You\'re building a powerful habit';
  if (streak <= 7) return 'One full week of growth!';
  if (streak <= 14) return 'Your mind is transforming';
  if (streak <= 21) return 'Science says 21 days makes a habit';
  if (streak <= 30) return 'A whole month of self-improvement!';
  if (streak <= 60) return 'You\'re unstoppable';
  if (streak <= 100) return 'Elite mindset, elite results';
  return 'You\'ve mastered the art of consistency';
}

// Streak tier for visual styling
function getStreakTier(streak: number): { label: string; color: string } {
  if (streak >= 100) return { label: 'Diamond', color: '#b9f2ff' };
  if (streak >= 60) return { label: 'Platinum', color: '#e5e4e2' };
  if (streak >= 30) return { label: 'Gold', color: '#ffd700' };
  if (streak >= 14) return { label: 'Silver', color: '#c0c0c0' };
  if (streak >= 7) return { label: 'Bronze', color: '#cd7f32' };
  return { label: '', color: '' };
}

export default function StreakCard({
  currentStreak,
  longestStreak,
  totalSessions,
  isNewDay,
}: StreakCardProps) {
  const { colors } = useThemeStore();

  // Animate the streak number on new day
  const streakScale = useSharedValue(isNewDay ? 0.5 : 1);
  const fireScale = useSharedValue(1);

  useEffect(() => {
    if (isNewDay && currentStreak > 0) {
      streakScale.value = withSpring(1, { damping: 8, stiffness: 120 });
      fireScale.value = withSequence(
        withTiming(1.3, { duration: 300 }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [isNewDay]);

  const streakNumberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const message = getStreakMessage(currentStreak);
  const tier = getStreakTier(currentStreak);

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(500)}
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      {/* Streak count + fire */}
      <View style={styles.topRow}>
        <View style={styles.streakSection}>
          <Animated.View style={fireStyle}>
            <Text style={styles.fireEmoji}>
              {currentStreak >= 7 ? '🔥' : currentStreak > 0 ? '✨' : '🌱'}
            </Text>
          </Animated.View>
          <Animated.View style={streakNumberStyle}>
            <Text style={[styles.streakNumber, { color: colors.primary }]}>
              {currentStreak}
            </Text>
          </Animated.View>
          <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
            {currentStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          {tier.label ? (
            <View style={[styles.tierBadge, { borderColor: tier.color }]}>
              <Text style={[styles.tierText, { color: tier.color }]}>
                {tier.label}
              </Text>
            </View>
          ) : null}
          <View style={styles.statRow}>
            <Ionicons name="trophy-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.statText, { color: colors.textMuted }]}>
              Best: {longestStreak}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Ionicons name="headset-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.statText, { color: colors.textMuted }]}>
              {totalSessions} sessions
            </Text>
          </View>
        </View>
      </View>

      {/* Motivational message */}
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>

      {/* Weekly dots */}
      <View style={styles.weekDots}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
          const isActive = i < (currentStreak % 7 === 0 && currentStreak > 0 ? 7 : currentStreak % 7);
          return (
            <View key={i} style={styles.dayColumn}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? colors.primary : `${colors.textMuted}30`,
                  },
                ]}
              />
              <Text style={[styles.dayLabel, { color: colors.textMuted }]}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.card,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  fireEmoji: {
    fontSize: 24,
  },
  streakNumber: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
  },
  streakLabel: {
    ...typography.body,
    marginBottom: 4,
  },
  statsSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 2,
  },
  tierText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...typography.caption,
  },
  message: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
