/**
 * WAVIUM - Script Screen
 * Display the AI-generated affirmations for the user to read
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useMindiStore } from '../../src/stores/useMindiStore';
import { GlassmorphicCard, HapticButton, GlowText } from '../../src/components/ui';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

export default function ScriptScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { creation } = useMindiStore();

  const { intention, affirmations } = creation;

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(main)/tracks');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Animated.View entering={FadeIn.duration(400)}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
            <Text style={[styles.backText, { color: colors.textSecondary }]}>
              Back
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
          <View style={[styles.checkBadge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
          </View>
          <GlowText variant="h2" glowIntensity={0.4}>
            Your Affirmations
          </GlowText>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Here's what we created for you
          </Text>
        </Animated.View>

        {/* Intention reminder */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassmorphicCard style={styles.intentionCard}>
            <Text style={[styles.intentionLabel, { color: colors.textSecondary }]}>
              Your intention
            </Text>
            <Text style={[styles.intentionText, { color: colors.textPrimary }]}>
              "{intention}"
            </Text>
          </GlassmorphicCard>
        </Animated.View>

        {/* Affirmations list */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.affirmationsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Your personalized script
          </Text>
          <GlassmorphicCard style={styles.affirmationsCard}>
            {affirmations.map((affirmation, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(400 + index * 50).duration(400)}
                style={[
                  styles.affirmationItem,
                  index < affirmations.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.textMuted + '20',
                  },
                ]}
              >
                <View style={[styles.affirmationNumber, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.affirmationNumberText, { color: colors.primary }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.affirmationText, { color: colors.textPrimary }]}>
                  {affirmation}
                </Text>
              </Animated.View>
            ))}
          </GlassmorphicCard>
        </Animated.View>

        {/* Info note */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.infoSection}
        >
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              These affirmations will be spoken softly beneath your chosen soundtrack, working with your subconscious mind.
            </Text>
          </View>
        </Animated.View>

        {/* Continue button */}
        <Animated.View
          entering={FadeInUp.delay(700).duration(500)}
          style={styles.buttonSection}
        >
          <HapticButton
            onPress={handleContinue}
            variant="primary"
            size="large"
            fullWidth
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Choose Your Sound</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </HapticButton>
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backText: {
    ...typography.body,
    marginLeft: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  intentionCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  intentionLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  intentionText: {
    ...typography.body,
    fontStyle: 'italic',
  },
  affirmationsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  affirmationsCard: {
    padding: spacing.sm,
  },
  affirmationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  affirmationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  affirmationNumberText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  affirmationText: {
    ...typography.body,
    flex: 1,
    lineHeight: 24,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 20,
  },
  buttonSection: {
    marginTop: spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    ...typography.button,
    color: '#fff',
  },
});
