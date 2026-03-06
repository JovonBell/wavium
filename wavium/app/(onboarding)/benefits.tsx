/**
 * WAVIUM - Benefits Screen
 * Social proof & value proposition — hooks users early in onboarding
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { HapticButton, SafeContainer, GlassmorphicCard, GlowText } from '../../src/components/ui';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

const BENEFITS = [
  {
    icon: 'sparkles' as const,
    title: 'AI-Powered Affirmations',
    description: 'Personalized subliminal messages crafted by AI, tuned to your intentions.',
  },
  {
    icon: 'musical-notes' as const,
    title: 'Immersive Soundscapes',
    description: 'Binaural beats & ambient tracks that rewire your subconscious while you relax.',
  },
  {
    icon: 'mic' as const,
    title: 'Your Voice, Your Power',
    description: 'Clone your own voice for subliminals — the most effective way to reprogram your mind.',
  },
];

export default function BenefitsScreen() {
  const { colors } = useThemeStore();

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);
  const card0Opacity = useSharedValue(0);
  const card0TranslateY = useSharedValue(30);
  const card1Opacity = useSharedValue(0);
  const card1TranslateY = useSharedValue(30);
  const card2Opacity = useSharedValue(0);
  const card2TranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    headerOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    headerTranslateY.value = withDelay(300, withTiming(0, { duration: 600, easing: ease }));

    card0Opacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    card0TranslateY.value = withDelay(600, withTiming(0, { duration: 500, easing: ease }));

    card1Opacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    card1TranslateY.value = withDelay(900, withTiming(0, { duration: 500, easing: ease }));

    card2Opacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
    card2TranslateY.value = withDelay(1200, withTiming(0, { duration: 500, easing: ease }));

    buttonOpacity.value = withDelay(1600, withTiming(1, { duration: 500 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const cardStyles = [
    useAnimatedStyle(() => ({ opacity: card0Opacity.value, transform: [{ translateY: card0TranslateY.value }] })),
    useAnimatedStyle(() => ({ opacity: card1Opacity.value, transform: [{ translateY: card1TranslateY.value }] })),
    useAnimatedStyle(() => ({ opacity: card2Opacity.value, transform: [{ translateY: card2TranslateY.value }] })),
  ];

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/breath');
  };

  return (
    <SafeContainer style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.header, headerStyle]}>
          <GlowText variant="h2" glowIntensity={1.2}>
            Transform Your Mind
          </GlowText>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Wavium uses science-backed subliminal technology
          </Text>
        </Animated.View>

        <View style={styles.cards}>
          {BENEFITS.map((benefit, index) => (
            <Animated.View key={benefit.title} style={cardStyles[index]}>
              <GlassmorphicCard style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name={benefit.icon} size={24} color={colors.primary} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                      {benefit.title}
                    </Text>
                    <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                      {benefit.description}
                    </Text>
                  </View>
                </View>
              </GlassmorphicCard>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View style={[styles.buttonContainer, buttonStyle]}>
        <HapticButton
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
          haptic="medium"
        >
          Continue
        </HapticButton>
      </Animated.View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.button,
    marginBottom: 4,
  },
  cardDescription: {
    ...typography.bodySmall,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
});
