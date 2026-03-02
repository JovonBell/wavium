/**
 * WAVIUM - Forgot Password Screen
 * Send password reset email
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import {
  GlassmorphicCard,
  HapticButton,
  GlowText,
  SafeContainer,
  TimeShiftingBackground,
} from '../../src/components/ui';
import { typography, fontFamilies } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function ForgotPasswordScreen() {
  const { colors } = useThemeStore();
  const { resetPassword, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setError(null);
    const result = await resetPassword(email.trim().toLowerCase());

    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
      // Auto-navigate back to sign-in after 3 seconds
      setTimeout(() => {
        router.back();
      }, 3000);
    }
  };

  return (
    <View style={styles.root}>
      <TimeShiftingBackground />
      <SafeContainer>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Animated.View entering={FadeInDown.duration(600)} style={styles.titleSection}>
              <GlowText variant="h1" glowIntensity={0.6}>
                WAVIUM
              </GlowText>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Reset your password
              </Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <GlassmorphicCard style={styles.formCard}>
                {sent ? (
                  /* Success State */
                  <View style={styles.successContainer}>
                    <Text style={[styles.successIcon]}>
                      ✓
                    </Text>
                    <Text style={[styles.successTitle, { color: colors.success }]}>
                      Reset Link Sent
                    </Text>
                    <Text style={[styles.successText, { color: colors.textSecondary }]}>
                      Check your email for a password reset link. Redirecting to sign in...
                    </Text>
                  </View>
                ) : (
                  /* Form State */
                  <>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                      Enter your email address and we'll send you a link to reset your password.
                    </Text>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Email</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.primary + '40',
                          },
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.textPrimary }]}
                          value={email}
                          onChangeText={setEmail}
                          placeholder="your@email.com"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect={false}
                          editable={!loading}
                        />
                      </View>
                    </View>

                    {/* Error Message */}
                    {error && (
                      <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    )}

                    {/* Reset Button */}
                    <HapticButton
                      onPress={handleResetPassword}
                      variant="primary"
                      size="large"
                      fullWidth
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </HapticButton>
                  </>
                )}
              </GlassmorphicCard>
            </Animated.View>

            {/* Back Link */}
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.links}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.linkButton}
              >
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  Back to{' '}
                  <Text style={{ color: colors.primary, fontFamily: fontFamilies.bodyMedium }}>
                    Sign In
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  formCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.label,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  inputWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    ...typography.body,
    padding: 0,
  },
  errorText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  successIcon: {
    fontSize: 48,
    color: '#34d399',
    marginBottom: spacing.sm,
  },
  successTitle: {
    ...typography.h3,
    fontFamily: 'Raleway_500Medium',
  },
  successText: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  links: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  linkButton: {
    padding: spacing.sm,
  },
  linkText: {
    ...typography.body,
    textAlign: 'center',
  },
});
