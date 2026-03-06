/**
 * WAVIUM - Paywall Screen
 * Subscription screen with Apple compliance (restore, terms, privacy, skip)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Linking,
  Alert,
  ActivityIndicator,
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
import { supabase } from '../../src/lib/supabase';
import { HapticButton, SafeContainer, GlassmorphicCard, GlowText } from '../../src/components/ui';
import { MindiRenderer } from '../../src/components/mindi';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

const TERMS_URL = 'https://wavium-production.up.railway.app/terms';
const PRIVACY_URL = 'https://wavium-production.up.railway.app/privacy';

const FEATURES = [
  { icon: 'infinite' as const, text: 'Unlimited subliminal generation' },
  { icon: 'mic' as const, text: 'Voice cloning with your own voice' },
  { icon: 'musical-notes' as const, text: '10+ ambient soundscapes' },
  { icon: 'sparkles' as const, text: 'AI-crafted personalized affirmations' },
];

export default function PaywallScreen() {
  const { colors } = useThemeStore();
  const { setUserId, setUserName, userName } = useMindiStore();
  const { purchase, restore, loading } = useSubscriptionStore();

  const [restoring, setRestoring] = useState(false);
  // Store userName for deferred Supabase update
  const savedUserNameRef = React.useRef(userName);

  // Animations
  const headerOpacity = useSharedValue(0);
  const featuresOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    headerOpacity.value = withDelay(300, withTiming(1, { duration: 600, easing: ease }));
    featuresOpacity.value = withDelay(700, withTiming(1, { duration: 600, easing: ease }));
    ctaOpacity.value = withDelay(1100, withTiming(1, { duration: 600, easing: ease }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const featuresStyle = useAnimatedStyle(() => ({ opacity: featuresOpacity.value }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));

  /** Complete onboarding: set userId, navigate to home, update Supabase */
  const completeOnboarding = () => {
    const authState = useAuthStore.getState();
    const supabaseUserId = authState.session?.user?.id ?? authState.user?.id;
    if (supabaseUserId) {
      setUserId(supabaseUserId);
      router.replace('/(main)/home');

      // Deferred Supabase metadata update (safe after setUserId)
      if (savedUserNameRef.current) {
        supabase.auth.updateUser({ data: { display_name: savedUserNameRef.current } }).catch((err) => {
          console.warn('Failed to update user metadata:', err);
        });
      }
    }
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const result = await purchase();

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

  return (
    <SafeContainer style={styles.container}>
      {/* Header with Mindi */}
      <Animated.View style={[styles.header, headerStyle]}>
        <MindiRenderer size={100} showParticles={false} />
        <GlowText variant="h2" glowIntensity={1.5} animate>
          Unlock Your Mind
        </GlowText>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Start your 7-day free trial
        </Text>
      </Animated.View>

      {/* Feature list */}
      <Animated.View style={[styles.features, featuresStyle]}>
        <GlassmorphicCard style={styles.featureCard}>
          {FEATURES.map((feature) => (
            <View key={feature.text} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={feature.icon} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                {feature.text}
              </Text>
            </View>
          ))}
        </GlassmorphicCard>
      </Animated.View>

      {/* CTA section */}
      <Animated.View style={[styles.cta, ctaStyle]}>
        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            $2.99
          </Text>
          <Text style={[styles.priceDetail, { color: colors.textSecondary }]}>
            /month after 7-day free trial
          </Text>
        </View>

        {/* Subscribe button */}
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
            'Start Free Trial'
          )}
        </HapticButton>

        {/* Auto-renewal disclosure (Apple requirement) */}
        <Text style={[styles.disclosure, { color: colors.textMuted }]}>
          Payment will be charged to your Apple ID account at the confirmation of purchase.
          Subscription automatically renews unless it is canceled at least 24 hours before
          the end of the current period. Your account will be charged for renewal within
          24 hours prior to the end of the current period. You can manage and cancel your
          subscriptions in your App Store account settings.
        </Text>

        {/* Restore + Skip */}
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

          <HapticButton
            onPress={handleSkip}
            variant="ghost"
            size="small"
            haptic="light"
          >
            <Text style={[styles.linkText, { color: colors.textMuted }]}>
              Skip
            </Text>
          </HapticButton>
        </View>

        {/* Terms & Privacy */}
        <View style={styles.legalLinks}>
          <Text
            style={[styles.legalText, { color: colors.textMuted }]}
            onPress={() => Linking.openURL(TERMS_URL)}
          >
            Terms of Service
          </Text>
          <Text style={[styles.legalDivider, { color: colors.textMuted }]}>|</Text>
          <Text
            style={[styles.legalText, { color: colors.textMuted }]}
            onPress={() => Linking.openURL(PRIVACY_URL)}
          >
            Privacy Policy
          </Text>
        </View>
      </Animated.View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  featureCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
  cta: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  price: {
    ...typography.displayHeading,
    fontSize: 28,
  },
  priceDetail: {
    ...typography.bodySmall,
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
