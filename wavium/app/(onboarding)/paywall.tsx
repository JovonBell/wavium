/**
 * WAVIUM - Paywall Screen
 * Premium subscription with outcome-driven copy, dual pricing, social proof,
 * trial timeline, and Apple compliance (restore, terms, privacy, skip).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Linking,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
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
import { useMindiStore } from '../../src/stores/useMindiStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSubscriptionStore } from '../../src/stores/useSubscriptionStore';
import { SubscriptionTier } from '../../src/lib/revenuecat';
import { supabase } from '../../src/lib/supabase';
import { HapticButton, SafeContainer, GlassmorphicCard, GlowText } from '../../src/components/ui';
import { MindiRenderer } from '../../src/components/mindi';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

const TERMS_URL = 'https://wavium-production.up.railway.app/terms';
const PRIVACY_URL = 'https://wavium-production.up.railway.app/privacy';

const BENEFITS = [
  { icon: 'ear' as const, text: 'Hear affirmations in YOUR voice — 10x more powerful' },
  { icon: 'moon' as const, text: 'Reprogram your subconscious while you sleep' },
  { icon: 'infinite' as const, text: 'Unlimited custom sessions for any goal' },
  { icon: 'musical-notes' as const, text: '10+ ambient soundscapes for deep absorption' },
];

export default function PaywallScreen() {
  const { colors } = useThemeStore();
  const { setUserId, userName } = useMindiStore();
  const { purchase, restore, loading } = useSubscriptionStore();

  const [restoring, setRestoring] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('annual');
  const [showSkip, setShowSkip] = useState(false);
  const savedUserNameRef = React.useRef(userName);

  // Staggered entrance animations
  const headerOpacity = useSharedValue(0);
  const benefitsOpacity = useSharedValue(0);
  const pricingOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    headerOpacity.value = withDelay(300, withTiming(1, { duration: 600, easing: ease }));
    benefitsOpacity.value = withDelay(600, withTiming(1, { duration: 600, easing: ease }));
    pricingOpacity.value = withDelay(900, withTiming(1, { duration: 600, easing: ease }));
    ctaOpacity.value = withDelay(1200, withTiming(1, { duration: 600, easing: ease }));

    // Delay skip button appearance by 4 seconds
    const skipTimer = setTimeout(() => setShowSkip(true), 4000);
    return () => clearTimeout(skipTimer);
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const benefitsStyle = useAnimatedStyle(() => ({ opacity: benefitsOpacity.value }));
  const pricingStyle = useAnimatedStyle(() => ({ opacity: pricingOpacity.value }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));

  const completeOnboarding = () => {
    const authState = useAuthStore.getState();
    const supabaseUserId = authState.session?.user?.id ?? authState.user?.id;
    if (!supabaseUserId) {
      // Fix #16: Handle missing auth — redirect to sign-in
      Alert.alert('Session Expired', 'Please sign in again to continue.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/sign-in') },
      ]);
      return;
    }
    setUserId(supabaseUserId);
    router.replace('/(main)/home');

    if (savedUserNameRef.current) {
      supabase.auth.updateUser({ data: { display_name: savedUserNameRef.current } }).catch(() => {});
    }
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const result = await purchase(selectedTier);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeOnboarding();
    } else if (result.error && result.error !== 'cancelled') {
      Alert.alert('Purchase Failed', result.error);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restore();
    setRestoring(false);

    if (result.isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Restored!', 'Your subscription has been restored.', [
        { text: 'Continue', onPress: completeOnboarding },
      ]);
    } else {
      Alert.alert('No Subscription Found', 'We couldn\'t find an active subscription for this account.');
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
  };

  const isAnnual = selectedTier === 'annual';

  return (
    <SafeContainer style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <MindiRenderer size={90} showParticles={false} />
          <GlowText variant="h2" glowIntensity={1.5} animate>
            Your Voice. Your Transformation.
          </GlowText>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Rewire your mind with subliminals spoken in your own voice
          </Text>
        </Animated.View>

        {/* Benefits */}
        <Animated.View style={[styles.benefits, benefitsStyle]}>
          <GlassmorphicCard style={styles.benefitCard}>
            {BENEFITS.map((b) => (
              <View key={b.text} style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={b.icon} size={16} color={colors.primary} />
                </View>
                <Text style={[styles.benefitText, { color: colors.textPrimary }]}>
                  {b.text}
                </Text>
              </View>
            ))}
          </GlassmorphicCard>
        </Animated.View>

        {/* Social proof */}
        <Animated.View style={[styles.socialProof, benefitsStyle]}>
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Text style={[styles.socialText, { color: colors.textSecondary }]}>
            Join 1,000+ people transforming their mindset
          </Text>
        </Animated.View>

        {/* Pricing cards */}
        <Animated.View style={[styles.pricing, pricingStyle]}>
          {/* Annual — Best Value */}
          <HapticButton
            onPress={() => { setSelectedTier('annual'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            variant="ghost"
            size="large"
            style={styles.tierButtonWrapper}
          >
            <View
              style={[
                styles.tierCard,
                {
                  borderColor: isAnnual ? colors.primary : colors.glassBorder,
                  borderWidth: isAnnual ? 2 : 1,
                  backgroundColor: isAnnual ? colors.primary + '10' : 'transparent',
                },
              ]}
            >
              {/* Best Value badge */}
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>BEST VALUE</Text>
              </View>
              <View style={styles.tierContent}>
                <View style={styles.tierLeft}>
                  <View style={[styles.radio, { borderColor: isAnnual ? colors.primary : colors.textMuted }]}>
                    {isAnnual && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <View>
                    <Text style={[styles.tierName, { color: colors.textPrimary }]}>Annual</Text>
                    <Text style={[styles.tierSave, { color: colors.primary }]}>Save 17%</Text>
                  </View>
                </View>
                <View style={styles.tierRight}>
                  <Text style={[styles.tierPrice, { color: colors.textPrimary }]}>$49.99</Text>
                  <Text style={[styles.tierPer, { color: colors.textSecondary }]}>per year</Text>
                </View>
              </View>
            </View>
          </HapticButton>

          {/* Monthly */}
          <HapticButton
            onPress={() => { setSelectedTier('monthly'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            variant="ghost"
            size="large"
            style={styles.tierButtonWrapper}
          >
            <View
              style={[
                styles.tierCard,
                {
                  borderColor: !isAnnual ? colors.primary : colors.glassBorder,
                  borderWidth: !isAnnual ? 2 : 1,
                  backgroundColor: !isAnnual ? colors.primary + '10' : 'transparent',
                },
              ]}
            >
              <View style={styles.tierContent}>
                <View style={styles.tierLeft}>
                  <View style={[styles.radio, { borderColor: !isAnnual ? colors.primary : colors.textMuted }]}>
                    {!isAnnual && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <View>
                    <Text style={[styles.tierName, { color: colors.textPrimary }]}>Monthly</Text>
                  </View>
                </View>
                <View style={styles.tierRight}>
                  <Text style={[styles.tierPrice, { color: colors.textPrimary }]}>$4.99</Text>
                  <Text style={[styles.tierPer, { color: colors.textSecondary }]}>per month</Text>
                </View>
              </View>
            </View>
          </HapticButton>
        </Animated.View>

        {/* Trial timeline */}
        <Animated.View style={[styles.timeline, pricingStyle]}>
          <View style={styles.timelineRow}>
            <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
            <View style={[styles.timelineLine, { backgroundColor: colors.glassBorder }]} />
            <View style={[styles.timelineDot, { backgroundColor: colors.textMuted }]} />
            <View style={[styles.timelineLine, { backgroundColor: colors.glassBorder }]} />
            <View style={[styles.timelineDot, { backgroundColor: colors.textMuted }]} />
          </View>
          <View style={styles.timelineLabels}>
            <View style={styles.timelineLabel}>
              <Text style={[styles.timelineBold, { color: colors.primary }]}>Today</Text>
              <Text style={[styles.timelineSmall, { color: colors.textMuted }]}>Full access</Text>
            </View>
            <View style={styles.timelineLabel}>
              <Text style={[styles.timelineBold, { color: colors.textSecondary }]}>Day 5</Text>
              <Text style={[styles.timelineSmall, { color: colors.textMuted }]}>Reminder</Text>
            </View>
            <View style={styles.timelineLabel}>
              <Text style={[styles.timelineBold, { color: colors.textSecondary }]}>Day 7</Text>
              <Text style={[styles.timelineSmall, { color: colors.textMuted }]}>Billing starts</Text>
            </View>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[styles.cta, ctaStyle]}>
          {/* Trust text */}
          <Text style={[styles.trustText, { color: colors.textSecondary }]}>
            No payment due now  ·  Cancel anytime
          </Text>

          <HapticButton
            onPress={handleSubscribe}
            variant="primary"
            size="large"
            fullWidth
            haptic="heavy"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              'Start My Free Trial'
            )}
          </HapticButton>

          {/* Apple disclosure */}
          <Text style={[styles.disclosure, { color: colors.textMuted }]}>
            Payment will be charged to your Apple ID account at the confirmation of purchase.
            Subscription automatically renews unless canceled at least 24 hours before
            the end of the current period. You can manage and cancel your subscriptions
            in your App Store account settings.
          </Text>

          {/* Secondary actions */}
          <View style={styles.secondaryActions}>
            <HapticButton
              onPress={handleRestore}
              variant="ghost"
              size="small"
              haptic="light"
              disabled={restoring}
            >
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                {restoring ? 'Restoring...' : 'Restore Purchases'}
              </Text>
            </HapticButton>

            {showSkip && (
              <HapticButton
                onPress={handleSkip}
                variant="ghost"
                size="small"
                haptic="light"
              >
                <Text style={[styles.linkText, { color: colors.textMuted, fontSize: 11 }]}>
                  Skip
                </Text>
              </HapticButton>
            )}
          </View>

          {/* Legal */}
          <View style={styles.legalLinks}>
            <Text
              style={[styles.legalText, { color: colors.textMuted }]}
              onPress={() => Linking.openURL(TERMS_URL).catch((err) => {
                if (__DEV__) console.warn('Failed to open Terms URL:', err);
                Alert.alert('Could not open link', 'Please visit our website for Terms of Service.');
              })}
            >
              Terms of Service
            </Text>
            <Text style={[styles.legalDivider, { color: colors.textMuted }]}>|</Text>
            <Text
              style={[styles.legalText, { color: colors.textMuted }]}
              onPress={() => Linking.openURL(PRIVACY_URL).catch((err) => {
                if (__DEV__) console.warn('Failed to open Privacy URL:', err);
                Alert.alert('Could not open link', 'Please visit our website for our Privacy Policy.');
              })}
            >
              Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  // Benefits
  benefits: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  benefitCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    ...typography.bodySmall,
    flex: 1,
  },
  // Social proof
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: spacing.md,
  },
  socialText: {
    ...typography.bodySmall,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  // Pricing
  pricing: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  tierButtonWrapper: {
    width: '100%',
  },
  tierCard: {
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  tierContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierRight: {
    alignItems: 'flex-end',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tierName: {
    ...typography.button,
    fontSize: 15,
  },
  tierSave: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  tierPrice: {
    ...typography.displayHeading,
    fontSize: 20,
    letterSpacing: 0,
  },
  tierPer: {
    ...typography.caption,
    fontSize: 11,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 14,
  },
  badgeText: {
    ...typography.label,
    fontSize: 9,
    color: '#fff',
    letterSpacing: 1,
  },
  // Trial timeline
  timeline: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    flex: 1,
    height: 2,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timelineLabel: {
    alignItems: 'center',
  },
  timelineBold: {
    ...typography.label,
    fontSize: 11,
  },
  timelineSmall: {
    ...typography.caption,
    fontSize: 10,
  },
  // CTA
  cta: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  trustText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  disclosure: {
    ...typography.bodySmall,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  linkText: {
    ...typography.bodySmall,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  legalText: {
    ...typography.bodySmall,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    ...typography.bodySmall,
    fontSize: 11,
  },
});
