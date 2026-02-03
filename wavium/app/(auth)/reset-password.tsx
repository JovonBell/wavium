/**
 * WAVIUM - Reset Password Screen
 * Request password reset email
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { SafeContainer, HapticButton, GlowText } from '@/components/ui';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

export default function ResetPasswordScreen() {
  const { colors } = useThemeStore();
  const { resetPassword } = useAuthContext();

  // Form state
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    // Validate email
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    router.push('/(auth)/');
  };

  // Clear error when user starts typing
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) setError(null);
  };

  // Success state - show email sent message
  if (success) {
    return (
      <SafeContainer style={styles.container}>
        <View style={styles.successContainer}>
          <GlowText variant="h2" glowIntensity={1.2}>
            Check Your Email!
          </GlowText>
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            We sent a password reset link to
          </Text>
          <Text style={[styles.emailText, { color: colors.primary }]}>
            {email}
          </Text>
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            Click the link to reset your password.
          </Text>
          <View style={styles.successButtonContainer}>
            <HapticButton
              onPress={handleBackToSignIn}
              variant="primary"
              size="large"
              fullWidth
            >
              Back to Sign In
            </HapticButton>
          </View>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <GlowText variant="h2" glowIntensity={1.2}>
              Reset Password
            </GlowText>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email to receive a reset link
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  borderColor: colors.textMuted,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />

            {/* Error Message */}
            {error && (
              <Text style={[styles.error, { color: colors.error }]}>
                {error}
              </Text>
            )}

            {/* Send Reset Link Button */}
            <HapticButton
              onPress={handleReset}
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Send Reset Link
            </HapticButton>

            {/* Back to Sign In Link */}
            <TouchableOpacity
              onPress={handleBackToSignIn}
              style={styles.linkButton}
            >
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  input: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  error: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkText: {
    ...typography.body,
  },
  // Success state styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  successMessage: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  emailText: {
    ...typography.h3,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  successButtonContainer: {
    width: '100%',
    marginTop: spacing['2xl'],
  },
});
