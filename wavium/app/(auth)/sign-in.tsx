/**
 * WAVIUM - Sign In Screen
 * Email/password authentication with glassmorphic Wavium aesthetic
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
import { typography, fontFamilies, textStyles } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function SignInScreen() {
  const { colors } = useThemeStore();
  const { signIn, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    const result = await signIn(email.trim().toLowerCase(), password);
    if (result.error) {
      setError(result.error);
    }
    // On success, onAuthStateChange updates session -> route guard navigates
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
                Welcome back
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
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="password"
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Error Message */}
                {error && (
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                )}

                {/* Sign In Button */}
                <HapticButton
                  onPress={handleSignIn}
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </HapticButton>
              </GlassmorphicCard>
            </Animated.View>

            {/* Links */}
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.links}>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/sign-up')}
                style={styles.linkButton}
              >
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  Don't have an account?{' '}
                  <Text style={{ color: colors.primary, fontFamily: fontFamilies.bodyMedium }}>
                    Sign Up
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.linkButton}
              >
                <Text style={[styles.linkText, { color: colors.textMuted }]}>
                  Forgot password?
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
});
