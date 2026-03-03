/**
 * WAVIUM - Sign Up Screen
 * Create account with email/password, matching glassmorphic aesthetic
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
  Alert,
  Linking,
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

export default function SignUpScreen() {
  const { colors } = useThemeStore();
  const { signUp, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    const result = await signUp(email.trim().toLowerCase(), password);

    if (result.error) {
      setError(result.error);
    } else {
      // Supabase may require email confirmation.
      // If auto-confirm is disabled, show info message.
      // If auto-confirm is enabled, onAuthStateChange fires and route guard navigates.
      Alert.alert(
        'Account Created',
        'Check your email to confirm your account, then sign in.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
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
                Create your account
              </Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <GlassmorphicCard style={styles.formCard}>
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
                      accessibilityLabel="Email address"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Password</Text>
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
                      value={password}
                      onChangeText={setPassword}
                      placeholder="At least 6 characters"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="new-password"
                      editable={!loading}
                      accessibilityLabel="Password"
                    />
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                    Confirm Password
                  </Text>
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
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="new-password"
                      editable={!loading}
                      accessibilityLabel="Confirm password"
                    />
                  </View>
                </View>

                {/* Error Message */}
                {error && (
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                )}

                {/* Sign Up Button */}
                <HapticButton
                  onPress={handleSignUp}
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </HapticButton>

                <Text style={[styles.legalText, { color: colors.textMuted }]}>
                  By creating an account, you agree to our{' '}
                  <Text
                    style={{ color: colors.primary }}
                    onPress={() => Linking.openURL('https://wavium-production.up.railway.app/terms')}
                  >
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={{ color: colors.primary }}
                    onPress={() => Linking.openURL('https://wavium-production.up.railway.app/privacy')}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </GlassmorphicCard>
            </Animated.View>

            {/* Links */}
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.links}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.linkButton}
                accessibilityLabel="Go to sign in"
                accessibilityRole="link"
              >
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  Already have an account?{' '}
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
  legalText: {
    ...typography.caption,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});
