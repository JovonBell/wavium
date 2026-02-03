/**
 * WAVIUM - Signup Screen
 * Email/password registration with validation and email verification
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

export default function SignupScreen() {
  const { colors } = useThemeStore();
  const { signUp } = useAuthContext();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    // Validate email
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signUp(email.trim(), password);
      // Show success message - user needs to verify email
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/');
  };

  // Clear error when user starts typing
  const handleFieldChange = (
    setter: (value: string) => void,
    value: string
  ) => {
    setter(value);
    if (error) setError(null);
  };

  // Success state - show email verification message
  if (success) {
    return (
      <SafeContainer style={styles.container}>
        <View style={styles.successContainer}>
          <GlowText variant="h2" glowIntensity={1.2}>
            Check Your Email!
          </GlowText>
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            We sent a verification link to
          </Text>
          <Text style={[styles.emailText, { color: colors.primary }]}>
            {email}
          </Text>
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            Click the link to complete your account.
          </Text>
          <View style={styles.successButtonContainer}>
            <HapticButton
              onPress={handleSignIn}
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
              Create Account
            </GlowText>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Begin your transformation
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
              onChangeText={(text) => handleFieldChange(setEmail, text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />

            {/* Password Input */}
            <View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: colors.textMuted,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(text) => handleFieldChange(setPassword, text)}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                At least 6 characters
              </Text>
            </View>

            {/* Confirm Password Input */}
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  borderColor: colors.textMuted,
                },
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={(text) =>
                handleFieldChange(setConfirmPassword, text)
              }
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />

            {/* Error Message */}
            {error && (
              <Text style={[styles.error, { color: colors.error }]}>
                {error}
              </Text>
            )}

            {/* Create Account Button */}
            <HapticButton
              onPress={handleSignUp}
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Create Account
            </HapticButton>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSignIn} style={styles.signinLink}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <Text style={[styles.footerText, { color: colors.primary }]}>
                Sign In
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
  hint: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  error: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  footer: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  signinLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
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
