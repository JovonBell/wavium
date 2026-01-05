/**
 * WAVIUM - Welcome Screen
 * First screen of the onboarding ceremony
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { HapticButton, SafeContainer, GlowText } from '../../src/components/ui';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { colors } = useThemeStore();

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  useEffect(() => {
    // Staggered entrance animation
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(500, withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }));

    subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));

    buttonOpacity.value = withDelay(1500, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(1500, withTiming(0, { duration: 500 }));
  }, []);

  const handleBegin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/breath');
  };

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <SafeContainer style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Title */}
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <GlowText variant="h1" glowIntensity={1.5} animate>
            WAVIUM
          </GlowText>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={[styles.subtitleContainer, subtitleStyle]}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            You're not just opening an app.
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            You're entering a portal where reality dissolves,
          </Text>
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            Mindi awaits, and your mind begins to heal.
          </Text>
        </Animated.View>
      </View>

      {/* Begin button */}
      <Animated.View style={[styles.buttonContainer, buttonStyle]}>
        <HapticButton
          onPress={handleBegin}
          variant="primary"
          size="large"
          fullWidth
          haptic="heavy"
        >
          Begin Your Journey
        </HapticButton>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          This will take about 2-3 minutes
        </Text>
      </Animated.View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  titleContainer: {
    marginBottom: spacing.xl,
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 28,
  },
  buttonContainer: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
