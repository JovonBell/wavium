/**
 * WAVIUM - Name Mindi Screen
 * User names their companion
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useMindiStore } from '../../src/stores/useMindiStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { supabase } from '../../src/lib/supabase';
import { MindiRenderer, MindiSpeech } from '../../src/components/mindi';
import { HapticButton, SafeContainer } from '../../src/components/ui';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function NameMindiScreen() {
  const { colors } = useThemeStore();
  const { setName, setUserId, setUserName, setCurrentState } = useMindiStore();

  // Two-step flow: first ask user's name, then companion's name
  const [step, setStep] = useState<'user' | 'companion'>('user');
  const [userNameInput, setUserNameInput] = useState('');
  const [companionNameInput, setCompanionNameInput] = useState('Mindi');
  const [showSpeech, setShowSpeech] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');

  // Prevent double-submit
  const isCompletingRef = useRef(false);
  // Store the user's display name to update Supabase after navigation
  const savedUserNameRef = useRef('');

  // Animation values
  const contentOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    inputOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));

    // Show Mindi's greeting — ask for user's name first
    setTimeout(() => {
      setSpeechMessage("Hi! What's your name?");
      setShowSpeech(true);
      setCurrentState('listening');
    }, 1000);
  }, []);

  const handleContinue = async () => {
    if (step === 'user') {
      // Step 1: Save user's name, then ask for companion name
      const trimmedUserName = userNameInput.trim();
      if (trimmedUserName.length === 0) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Store the user's own name in Zustand (local only)
      setUserName(trimmedUserName);
      // Save for deferred Supabase update (after onboarding completes)
      savedUserNameRef.current = trimmedUserName;

      // NOTE: We do NOT call supabase.auth.updateUser() here because it
      // triggers onAuthStateChange, which creates a new session object
      // reference, which would re-trigger the route guard in _layout.tsx.
      // Since userId is still null at this point, the route guard would
      // redirect back to /(onboarding), creating an infinite loop.
      // The Supabase metadata update is deferred to after setUserId().

      // Transition to companion naming step
      setShowSpeech(false);
      setCurrentState('happy');

      setTimeout(() => {
        setSpeechMessage(`Nice to meet you, ${trimmedUserName}! What would you like to call me?`);
        setShowSpeech(true);
        setCurrentState('listening');
        setStep('companion');
        // Reset input animation for second step
        inputOpacity.value = 0;
        inputOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
      }, 400);
      return;
    }

    // Step 2: Save companion name and finish onboarding
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    const trimmedName = companionNameInput.trim();
    if (trimmedName.length === 0) {
      isCompletingRef.current = false;
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Save the Mindi companion name
    setName(trimmedName);

    // Show excited response
    setShowSpeech(false);
    setCurrentState('happy');

    setTimeout(() => {
      setSpeechMessage(`I love it! I'm ${trimmedName}!`);
      setShowSpeech(true);
    }, 300);

    // Complete onboarding: set userId FIRST (marks onboarding as done),
    // then navigate directly, then update Supabase metadata in the background.
    setTimeout(() => {
      const authState = useAuthStore.getState();
      const supabaseUserId = authState.session?.user?.id ?? authState.user?.id;
      if (supabaseUserId) {
        // 1. Set userId synchronously in Zustand — this marks onboarding complete
        setUserId(supabaseUserId);

        // 2. Navigate directly to home — don't rely on the route guard
        router.replace('/(main)/home');

        // 3. Now it's safe to update Supabase metadata (even if onAuthStateChange
        //    fires, the route guard will see userId is set and won't redirect)
        if (savedUserNameRef.current) {
          supabase.auth.updateUser({ data: { display_name: savedUserNameRef.current } }).catch((err) => {
            console.warn('Failed to update user metadata:', err);
          });
        }
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

        {/* Name input — changes based on step */}
        <Animated.View style={[styles.inputContainer, inputStyle]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {step === 'user' ? "What's your name?" : 'Give me a name'}
          </Text>

          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.surface, borderColor: colors.primary + '40' },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={step === 'user' ? userNameInput : companionNameInput}
              onChangeText={step === 'user' ? setUserNameInput : setCompanionNameInput}
              placeholder={step === 'user' ? 'Your name' : 'Mindi'}
              placeholderTextColor={colors.textMuted}
              maxLength={20}
              autoCorrect={false}
              textAlign="center"
              accessibilityLabel={step === 'user' ? 'Your name' : 'Companion name'}
            />
          </View>

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            {step === 'user' ? 'For your personalized experience' : 'You can always change this later'}
          </Text>
        </Animated.View>

        {/* Continue button */}
        <Animated.View style={[styles.buttonContainer, inputStyle]}>
          <HapticButton
            onPress={handleContinue}
            variant="primary"
            size="large"
            fullWidth
            disabled={step === 'user' ? userNameInput.trim().length === 0 : companionNameInput.trim().length === 0}
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
