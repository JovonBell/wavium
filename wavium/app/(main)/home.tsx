/**
 * WAVIUM - Home Screen
 * Simple: Mindi greeting, Create button, Your subliminals
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useMindiStore, Subliminal } from '../../src/stores/useMindiStore';
import { MindiRenderer, MindiSpeech } from '../../src/components/mindi';
import { GlassmorphicCard, HapticButton, GlowText, StreakCard } from '../../src/components/ui';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { mindiGreetings } from '../../src/theme/colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, timeOfDay } = useThemeStore();
  const { name: mindiName, subliminals, streak, setCurrentState, checkInToday, resetOnboarding } = useMindiStore();

  const [showSpeech, setShowSpeech] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');
  const [resetTapCount, setResetTapCount] = useState(0);
  const [isNewDay, setIsNewDay] = useState(false);

  // Refs for timeout cleanup
  const showSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden reset: tap "Welcome back" 5 times to reset onboarding
  const handleSecretReset = () => {
    if (resetTapTimeoutRef.current) {
      clearTimeout(resetTapTimeoutRef.current);
    }

    const newCount = resetTapCount + 1;
    setResetTapCount(newCount);

    if (newCount >= 5) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Reset App?',
        'This will clear all data and show onboarding again. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setResetTapCount(0) },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: () => {
              resetOnboarding();
              router.replace('/(onboarding)');
            },
          },
        ]
      );
      setResetTapCount(0);
    } else {
      // Reset counter after 2 seconds of no taps
      resetTapTimeoutRef.current = setTimeout(() => {
        setResetTapCount(0);
      }, 2000);
    }
  };

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Check in for streak
    const result = checkInToday();
    setIsNewDay(result.isNewDay);

    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));

    // Show Mindi greeting (or streak message)
    showSpeechTimeoutRef.current = setTimeout(() => {
      if (result.isNewDay && streak.currentStreak > 1) {
        setSpeechMessage(`${streak.currentStreak + 1} days strong! Keep going!`);
      } else if (result.streakBroken) {
        setSpeechMessage("Welcome back! Let's start fresh today.");
      } else {
        const greetings = mindiGreetings[timeOfDay];
        setSpeechMessage(greetings[Math.floor(Math.random() * greetings.length)]);
      }
      setShowSpeech(true);
      setCurrentState('idle');
    }, 800);

    // Hide speech after a while
    hideSpeechTimeoutRef.current = setTimeout(() => {
      setShowSpeech(false);
    }, 5000);

    // Cleanup timeouts on unmount
    return () => {
      if (showSpeechTimeoutRef.current) {
        clearTimeout(showSpeechTimeoutRef.current);
      }
      if (hideSpeechTimeoutRef.current) {
        clearTimeout(hideSpeechTimeoutRef.current);
      }
    };
  }, [timeOfDay]);

  const handleCreateNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(main)/create');
  };

  const handlePlaySubliminal = (subliminal: Subliminal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/player/${subliminal.id}`);
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const getGreeting = () => {
    switch (timeOfDay) {
      case 'morning': return 'Good morning';
      case 'afternoon': return 'Good afternoon';
      case 'evening': return 'Good evening';
      default: return 'Good night';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header - tap "Welcome back" 5 times quickly to reset app */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          {getGreeting()}
        </Text>
        <TouchableOpacity onPress={handleSecretReset} activeOpacity={1}>
          <GlowText variant="h2" glowIntensity={0.5}>
            Welcome back
          </GlowText>
        </TouchableOpacity>
      </Animated.View>

      {/* Mindi section */}
      <Animated.View style={[styles.mindiSection, contentStyle]}>
        <MindiSpeech message={speechMessage} visible={showSpeech} />
        <MindiRenderer size={160} showParticles={true} />
        <Text style={[styles.mindiName, { color: colors.textPrimary }]}>
          {mindiName}
        </Text>
      </Animated.View>

      {/* Create Button - The main CTA */}
      <Animated.View style={[styles.createSection, contentStyle]}>
        <HapticButton
          onPress={handleCreateNew}
          variant="primary"
          size="large"
          fullWidth
        >
          <View style={styles.createButtonContent}>
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.createButtonText}>Create New Subliminal</Text>
          </View>
        </HapticButton>
      </Animated.View>

      {/* Streak Card */}
      <Animated.View style={[styles.streakSection, contentStyle]}>
        <StreakCard
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
          totalSessions={streak.totalSessions}
          isNewDay={isNewDay}
        />
      </Animated.View>

      {/* My Subliminals Library */}
      {subliminals.length > 0 && (
        <Animated.View
          style={contentStyle}
          entering={FadeInDown.delay(400).duration(500)}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            My Subliminals
          </Text>

          <View style={styles.subliminalGrid}>
            {subliminals.map((subliminal, index) => (
              <Animated.View
                key={subliminal.id}
                entering={FadeInDown.delay(500 + index * 100).duration(400)}
              >
                <TouchableOpacity
                  onPress={() => handlePlaySubliminal(subliminal)}
                  activeOpacity={0.8}
                >
                  <GlassmorphicCard style={styles.subliminalCard}>
                    <View style={styles.subliminalContent}>
                      <Text
                        style={[styles.subliminalTitle, { color: colors.textPrimary }]}
                        numberOfLines={2}
                      >
                        {subliminal.title}
                      </Text>
                      <Text
                        style={[styles.subliminalIntention, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {subliminal.intention}
                      </Text>
                    </View>
                    <View style={[styles.playButton, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="play" size={20} color={colors.primary} />
                    </View>
                  </GlassmorphicCard>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Empty state if no subliminals */}
      {subliminals.length === 0 && (
        <Animated.View style={[styles.emptyState, contentStyle]}>
          <GlassmorphicCard style={styles.emptyCard}>
            <Ionicons name="sparkles" size={40} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Ready to transform?
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Create your first personalized subliminal and start your journey.
            </Text>
          </GlassmorphicCard>
        </Animated.View>
      )}

      {/* Bottom padding for tab bar */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.bodySmall,
    marginBottom: 4,
  },
  mindiSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  mindiName: {
    ...typography.h3,
    marginTop: spacing.sm,
  },
  createSection: {
    marginVertical: spacing.lg,
  },
  streakSection: {
    marginBottom: spacing.lg,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    ...typography.button,
    color: '#fff',
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  subliminalGrid: {
    gap: spacing.sm,
  },
  subliminalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  subliminalContent: {
    flex: 1,
  },
  subliminalTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  subliminalIntention: {
    ...typography.bodySmall,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  emptyState: {
    marginTop: spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
});
