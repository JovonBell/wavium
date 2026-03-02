/**
 * WAVIUM - Name Mindi Screen
 * User names their companion
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useMindiStore } from '../../src/stores/useMindiStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { supabase } from '../../src/lib/supabase';
import { MindiRenderer, MindiSpeech } from '../../src/components/mindi';
import { HapticButton, SafeContainer } from '../../src/components/ui';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { springs } from '../../src/theme/animations';

export default function NameMindiScreen() {
  const { colors } = useThemeStore();
  const { setName, setUserId, setUserName, setCurrentState } = useMindiStore();

  const [name, setNameInput] = useState('Mindi');
  const [showSpeech, setShowSpeech] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');

  // Animation values
  const contentOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    inputOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));

    // Show Mindi's greeting
    setTimeout(() => {
      setSpeechMessage("What would you like to call me?");
      setShowSpeech(true);
      setCurrentState('listening');
    }, 1000);
  }, []);

  const handleContinue = async () => {
    if (name.trim().length === 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const trimmedName = name.trim();

    // Save the Mindi companion name
    setName(trimmedName);

    // Store userName in Zustand (persisted locally)
    setUserName(trimmedName);

    // Store display name in Supabase user metadata (server-side, survives device changes)
    supabase.auth.updateUser({ data: { display_name: trimmedName } }).catch((err) => {
      console.warn('Failed to update user metadata:', err);
    });

    // Show excited response
    setShowSpeech(false);
    setCurrentState('happy');

    setTimeout(() => {
      setSpeechMessage(`I love it! I'm ${trimmedName}!`);
      setShowSpeech(true);
    }, 300);

    // Wait a moment for the animation, then set userId with Supabase UUID
    // The route guard in _layout.tsx will handle navigation when userId changes
    setTimeout(() => {
      const supabaseUserId = useAuthStore.getState().user?.id;
      if (supabaseUserId) {
        setUserId(supabaseUserId);
      }
    }, 1500);
  };

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const inputStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
  }));

  return (
    <SafeContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Mindi */}
        <Animated.View style={[styles.mindiContainer, contentStyle]}>
          <MindiSpeech
            message={speechMessage}
            visible={showSpeech}
          />
          <MindiRenderer size={150} showParticles={true} />
        </Animated.View>

        {/* Name input */}
        <Animated.View style={[styles.inputContainer, inputStyle]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Give me a name
          </Text>

          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.surface, borderColor: colors.primary + '40' },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={name}
              onChangeText={setNameInput}
              placeholder="Mindi"
              placeholderTextColor={colors.textMuted}
              maxLength={20}
              autoCorrect={false}
              textAlign="center"
            />
          </View>

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            You can always change this later
          </Text>
        </Animated.View>

        {/* Continue button */}
        <Animated.View style={[styles.buttonContainer, inputStyle]}>
          <HapticButton
            onPress={handleContinue}
            variant="primary"
            size="large"
            fullWidth
            disabled={name.trim().length === 0}
          >
            Continue
          </HapticButton>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mindiContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  inputContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  inputWrapper: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  input: {
    ...typography.h2,
    textAlign: 'center',
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.md,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
});
