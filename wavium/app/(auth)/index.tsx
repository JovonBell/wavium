/**
 * WAVIUM - Login Screen
 * Email/password sign in with navigation to signup and password reset
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

export default function LoginScreen() {
  const { colors } = useThemeStore();
  const { signIn } = useAuthContext();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    // Validate inputs
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
      // Navigation handled automatically by _layout.tsx session routing
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/reset-password');
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup');
  };

  // Clear error when user starts typing
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) setError(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (error) setError(null);
  };

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
              Welcome Back
            </GlowText>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to continue your journey
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

            {/* Password Input */}
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
              onChangeText={handlePasswordChange}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />

            {/* Error Message */}
            {error && (
              <Text style={[styles.error, { color: colors.error }]}>
                {error}
              </Text>
            )}

            {/* Sign In Button */}
            <HapticButton
              onPress={handleSignIn}
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Sign In
            </HapticButton>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.linkButton}
            >
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSignUp} style={styles.signupLink}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <Text style={[styles.footerText, { color: colors.primary }]}>
                Sign Up
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
  footer: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  signupLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
  },
});
