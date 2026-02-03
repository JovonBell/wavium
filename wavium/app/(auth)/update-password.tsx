/**
 * WAVIUM - Update Password Screen
 * Set new password after clicking reset link
 *
 * This screen is shown when user clicks the reset link in their email.
 * The useAuth hook detects PASSWORD_RECOVERY event and sets isPasswordRecovery=true,
 * which routes here via _layout.tsx.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { SafeContainer, HapticButton, GlowText } from '@/components/ui';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

export default function UpdatePasswordScreen() {
  const { colors } = useThemeStore();
  const { updatePassword } = useAuthContext();

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
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
      await updatePassword(password);
      // Navigation handled automatically by _layout.tsx
      // isPasswordRecovery becomes false after USER_UPDATED event
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Clear error when user starts typing
  const handleFieldChange = (
    setter: (value: string) => void,
    value: string
  ) => {
    setter(value);
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
              Set New Password
            </GlowText>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your new password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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
                placeholder="New Password"
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
              placeholder="Confirm New Password"
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

            {/* Update Password Button */}
            <HapticButton
              onPress={handleUpdate}
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Update Password
            </HapticButton>
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
});
