/**
 * WAVIUM - Mindi Speech Bubble
 * Typewriter-style speech with soft chime sounds
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/useThemeStore';
import { springs } from '../../theme/animations';
import { typography } from '../../theme/typography';

interface MindiSpeechProps {
  message: string;
  visible: boolean;
  onComplete?: () => void;
  typewriterSpeed?: number; // ms per character
  showChime?: boolean;
}

export default function MindiSpeech({
  message,
  visible,
  onComplete,
  typewriterSpeed = 30,
  showChime = true,
}: MindiSpeechProps) {
  const { colors } = useThemeStore();
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const bubbleScale = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);

  // Typewriter effect
  useEffect(() => {
    if (visible && message) {
      setIsTyping(true);
      setDisplayText('');
      bubbleScale.value = withSpring(1, springs.bouncy);
      bubbleOpacity.value = withTiming(1, { duration: 200 });

      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < message.length) {
          setDisplayText(message.slice(0, currentIndex + 1));
          currentIndex++;

          // Subtle haptic on certain characters
          if (showChime && (message[currentIndex - 1] === '!' || message[currentIndex - 1] === '?')) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          clearInterval(interval);
          setIsTyping(false);
          onComplete?.();
        }
      }, typewriterSpeed);

      return () => clearInterval(interval);
    } else {
      bubbleScale.value = withTiming(0, { duration: 200 });
      bubbleOpacity.value = withTiming(0, { duration: 200 });
      setDisplayText('');
    }
  }, [visible, message]);

  const animatedBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bubbleScale.value }],
    opacity: bubbleOpacity.value,
  }));

  if (!visible && !displayText) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedBubbleStyle,
      ]}
    >
      <View
        style={[
          styles.bubble,
          { backgroundColor: colors.surface },
        ]}
      >
        {/* Glassmorphism overlay */}
        <View style={[styles.glassOverlay, { backgroundColor: colors.surfaceGlow }]} />

        {/* Speech text */}
        <Text
          style={[
            styles.text,
            typography.mindi,
            { color: colors.textPrimary },
          ]}
        >
          {displayText}
          {isTyping && <Text style={styles.cursor}>|</Text>}
        </Text>

        {/* Bubble tail */}
        <View
          style={[
            styles.bubbleTail,
            { borderTopColor: colors.surface },
          ]}
        />
      </View>
    </Animated.View>
  );
}

// Preset messages for different contexts
export const MINDI_MESSAGES = {
  greetings: {
    morning: [
      "Good morning! Ready to start fresh?",
      "Rise and shine! Let's set positive intentions.",
      "A new day, new possibilities!",
    ],
    afternoon: [
      "Hey! Need a midday boost?",
      "Taking a moment for yourself? I'm here!",
      "Let's refresh your mind together.",
    ],
    evening: [
      "Winding down? Let's find some peace.",
      "Time to relax and reflect together.",
      "Let's end the day on a positive note!",
    ],
    night: [
      "Can't sleep? I'll help you drift off...",
      "Let's quiet your mind together.",
      "Time for peaceful rest. I'm here.",
    ],
  },
  creation: {
    listening: [
      "Ooh, tell me more...",
      "I'm listening...",
      "What's on your mind?",
    ],
    thinking: [
      "Let me think about this...",
      "Creating something special...",
      "This is going to be good!",
    ],
    excited: [
      "I love this intention!",
      "This is powerful!",
      "Yes! Let's make this happen!",
    ],
    complete: [
      "Your subliminal is ready!",
      "We did it together!",
      "Can't wait for you to hear this!",
    ],
  },
  session: {
    start: [
      "Let's enter the void...",
      "Time to heal together.",
      "Close your eyes. I'm here.",
    ],
    during: [
      "You're doing amazing.",
      "Feel the affirmations absorbing...",
      "Just breathe.",
    ],
    complete: [
      "How do you feel?",
      "We did it together!",
      "I'm so proud of you.",
    ],
  },
  evolution: {
    levelUp: [
      "I feel myself growing!",
      "We're evolving together!",
      "Something magical is happening!",
    ],
    stageUp: [
      "I can feel the transformation!",
      "We've reached a new stage!",
      "This is just the beginning!",
    ],
  },
  encouragement: [
    "You've got this!",
    "I believe in you.",
    "Every session counts.",
    "Small steps, big changes.",
    "You're stronger than you know.",
  ],
};

// Helper to get random message from category
export function getRandomMessage(
  category: keyof typeof MINDI_MESSAGES,
  subcategory?: string
): string {
  const categoryMessages = MINDI_MESSAGES[category];

  if (typeof categoryMessages === 'object' && !Array.isArray(categoryMessages) && subcategory) {
    const messages = categoryMessages[subcategory as keyof typeof categoryMessages] as string[];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  if (Array.isArray(categoryMessages)) {
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }

  return "I'm here with you.";
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bubble: {
    maxWidth: 280,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  text: {
    textAlign: 'center',
  },
  cursor: {
    opacity: 0.5,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
