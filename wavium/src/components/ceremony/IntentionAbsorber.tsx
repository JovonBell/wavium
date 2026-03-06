/**
 * WAVIUM - Intention Absorber
 * User's first intention flows into Mindi
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/useThemeStore';
import { useMindiStore } from '../../stores/useMindiStore';
import { MindiRenderer } from '../mindi';
import MindiSpeech, { getRandomMessage } from '../mindi/MindiSpeech';
import { typography } from '../../theme/typography';
import { springs } from '../../theme/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntentionAbsorberProps {
  onComplete?: (intention: string) => void;
}

// Floating intention word that moves toward Mindi
const FloatingWord = ({
  word,
  index,
  total,
  centerX,
  centerY,
  onComplete,
}: {
  word: string;
  index: number;
  total: number;
  centerX: number;
  centerY: number;
  onComplete: () => void;
}) => {
  const { colors } = useThemeStore();

  // Starting position (from bottom of screen, spread out)
  const startX = (index / total) * SCREEN_WIDTH * 0.8 + SCREEN_WIDTH * 0.1;
  const startY = SCREEN_HEIGHT * 0.7;

  const x = useSharedValue(startX);
  const y = useSharedValue(startY);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 150;

    // Float toward Mindi
    x.value = withDelay(
      delay,
      withTiming(centerX, {
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    y.value = withDelay(
      delay,
      withTiming(centerY, {
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    // Shrink and fade as approaching Mindi
    scale.value = withDelay(
      delay + 1000,
      withTiming(0.3, { duration: 500 })
    );

    opacity.value = withDelay(
      delay + 1200,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    transform: [
      { translateX: -50 },
      { translateY: -10 },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={[styles.floatingWord, { color: colors.primary }]}>
        {word}
      </Text>
    </Animated.View>
  );
};

export default function IntentionAbsorber({
  onComplete,
}: IntentionAbsorberProps) {
  const { colors } = useThemeStore();
  const { setCurrentState } = useMindiStore();

  const [intention, setIntention] = useState('');
  const [isAbsorbing, setIsAbsorbing] = useState(false);
  const [wordsComplete, setWordsComplete] = useState(0);
  const [showSpeech, setShowSpeech] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');

  const inputRef = useRef<TextInput>(null);
  // Ref to the latest onComplete callback — avoids it appearing in effect deps,
  // which would re-fire the "words absorbed" effect whenever the parent
  // re-renders and passes a new function reference, causing double navigation.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  // Guard: once we've called onComplete, never call it again for this mount.
  const hasCompletedRef = useRef(false);

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT * 0.35;

  // Animation values
  const inputOpacity = useSharedValue(1);
  const inputTranslateY = useSharedValue(0);
  const mindiExcitement = useSharedValue(1);

  // Show initial prompt
  useEffect(() => {
    setTimeout(() => {
      setSpeechMessage("What would you like to work on?");
      setShowSpeech(true);
      setCurrentState('listening');
    }, 500);
  }, []);

  // Split intention into words
  const words = intention.trim().split(/\s+/).filter(w => w.length > 0);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (intention.trim().length === 0) return;

    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Hide speech and input
    setShowSpeech(false);
    inputOpacity.value = withTiming(0, { duration: 300 });
    inputTranslateY.value = withTiming(50, { duration: 300 });

    // Start absorption
    setIsAbsorbing(true);
    setCurrentState('generating');

    // Mindi gets excited
    mindiExcitement.value = withSequence(
      withSpring(1.1, springs.bouncy),
      withSpring(1, springs.gentle)
    );
  }, [intention]);

  // Handle word absorption complete
  const handleWordComplete = useCallback(() => {
    setWordsComplete(prev => prev + 1);
  }, []);

  // React to all words being absorbed — outside of setState updater.
  // Uses onCompleteRef (not onComplete prop) so a new callback reference from
  // the parent never re-triggers this effect with wordsComplete already > 0,
  // which would call router.push a second time and corrupt the nav stack.
  // hasCompletedRef ensures we fire onComplete exactly once per mount.
  useEffect(() => {
    if (wordsComplete > 0 && wordsComplete === words.length && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentState('happy');

      // Show completion message
      setTimeout(() => {
        setSpeechMessage("I love this intention!");
        setShowSpeech(true);

        // Complete after showing message
        setTimeout(() => {
          onCompleteRef.current?.(intention);
        }, 2000);
      }, 500);
    }
  }, [wordsComplete, words.length, intention]);

  const inputContainerStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
    transform: [{ translateY: inputTranslateY.value }],
  }));

  const mindiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mindiExcitement.value }],
  }));

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Mindi */}
      <Animated.View style={[styles.mindiContainer, mindiStyle]}>
        <MindiSpeech
          message={speechMessage}
          visible={showSpeech}
        />
        <MindiRenderer
          size={160}
          showParticles={true}
        />
      </Animated.View>

      {/* Floating words during absorption */}
      {isAbsorbing && words.map((word, index) => (
        <FloatingWord
          key={`${word}-${index}`}
          word={word}
          index={index}
          total={words.length}
          centerX={centerX}
          centerY={centerY}
          onComplete={handleWordComplete}
        />
      ))}

      {/* Input area */}
      <Animated.View style={[styles.inputContainer, inputContainerStyle]}>
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.surface, borderColor: colors.primary + '40' },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="I want to feel more confident..."
            placeholderTextColor={colors.textMuted}
            value={intention}
            onChangeText={setIntention}
            multiline
            maxLength={200}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            blurOnSubmit
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: intention.trim() ? colors.primary : colors.surface },
          ]}
          onPress={handleSubmit}
          disabled={!intention.trim()}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.submitText,
              { color: intention.trim() ? '#fff' : colors.textMuted },
            ]}
          >
            Send to Mindi
          </Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Share what you'd like to transform
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mindiContainer: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.15,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  inputWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 80,
  },
  input: {
    ...typography.body,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitText: {
    ...typography.button,
    fontWeight: '600',
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 12,
  },
  floatingWord: {
    ...typography.h3,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
