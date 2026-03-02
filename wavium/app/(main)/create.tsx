/**
 * WAVIUM - Create Screen
 * Simple: Enter your intention → Generate affirmations
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useMindiStore } from '../../src/stores/useMindiStore';
import { MindiRenderer } from '../../src/components/mindi';
import { GlassmorphicCard, HapticButton, GlowText, LoadingOverlay } from '../../src/components/ui';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { generateAffirmations as groqGenerateAffirmations } from '../../src/services/groq';

// Example intentions to inspire
const EXAMPLE_INTENTIONS = [
  "I want to improve my jump shot",
  "I want to feel more confident",
  "I want to attract abundance",
  "I want better sleep",
  "I want to focus better",
];

// Real AI affirmation generation using Groq (direct API call)
const generateAffirmations = async (intention: string, userName?: string): Promise<string[]> => {
  const response = await groqGenerateAffirmations(intention, userName);

  if (response.error) {
    console.error('Groq Error:', response.error);
  }

  return response.affirmations;
};

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { setCurrentState, setIntention, setAffirmations, name: mindiName, userName } = useMindiStore();

  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const inputRef = useRef<TextInput>(null);
  const inputScale = useSharedValue(1);

  useEffect(() => {
    setCurrentState('listening');
  }, []);

  const handleExamplePress = (example: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText(example);
    inputScale.value = withTiming(1.02, { duration: 100 }, () => {
      inputScale.value = withTiming(1, { duration: 100 });
    });
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    setIsGenerating(true);
    setCurrentState('generating');

    // Animate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress > 90) progress = 90;
      setGenerationProgress(progress);
    }, 300);

    try {
      // Save intention to store
      setIntention(inputText.trim());

      // Generate affirmations (pass userName for personalization)
      const affirmations = await generateAffirmations(inputText.trim(), userName || undefined);

      // Save affirmations to store
      setAffirmations(affirmations);

      // Complete progress
      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Navigate to script screen
      setTimeout(() => {
        setIsGenerating(false);
        setCurrentState('happy');
        router.push('/(main)/script');
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setCurrentState('idle');
      setGenerationProgress(0);

      // Show error to user
      Alert.alert(
        'Generation Failed',
        'Something went wrong while creating your affirmations. Please check your internet connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <GlowText variant="h2" glowIntensity={0.4}>
            What do you want to achieve?
          </GlowText>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tell {mindiName} your intention and get personalized affirmations
          </Text>
        </Animated.View>

        {/* Mindi */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.mindiContainer}
        >
          <MindiRenderer size={140} showParticles={true} />
        </Animated.View>

        {/* Input */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={[styles.inputSection, inputAnimatedStyle]}
        >
          <GlassmorphicCard style={styles.inputCard}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="e.g., I want to improve my jump shot..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={300}
              textAlignVertical="top"
              accessibilityLabel="Enter your intention"
            />
            <View style={styles.inputFooter}>
              <Text style={[styles.charCount, { color: colors.textMuted }]}>
                {inputText.length}/300
              </Text>
            </View>
          </GlassmorphicCard>
        </Animated.View>

        {/* Example intentions */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.examplesSection}
        >
          <Text style={[styles.examplesTitle, { color: colors.textSecondary }]}>
            Need inspiration?
          </Text>
          <View style={styles.examplesList}>
            {EXAMPLE_INTENTIONS.map((example, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.exampleChip, { backgroundColor: colors.surface }]}
                onPress={() => handleExamplePress(example)}
                activeOpacity={0.7}
              >
                <Text style={[styles.exampleText, { color: colors.textPrimary }]}>
                  {example}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Generate button */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(500)}
          style={styles.buttonSection}
        >
          <HapticButton
            onPress={handleGenerate}
            variant="primary"
            size="large"
            fullWidth
            disabled={!inputText.trim()}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.buttonText}>Generate My Affirmations</Text>
            </View>
          </HapticButton>
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Loading overlay */}
      <LoadingOverlay
        visible={isGenerating}
        message="Creating your personalized affirmations..."
        progress={generationProgress}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  mindiContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputCard: {
    padding: spacing.md,
  },
  input: {
    ...typography.body,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  charCount: {
    ...typography.caption,
  },
  examplesSection: {
    marginBottom: spacing.xl,
  },
  examplesTitle: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  examplesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  exampleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  exampleText: {
    ...typography.bodySmall,
  },
  buttonSection: {
    marginTop: spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    ...typography.button,
    color: '#fff',
  },
});
