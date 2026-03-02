/**
 * WAVIUM - Player Screen
 * THE VOID - Immersive subliminal experience
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { VoidContainer } from '../../src/components/void';
import { useMindiStore, Subliminal } from '../../src/stores/useMindiStore';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getSubliminal, setCurrentState } = useMindiStore();

  const [showScript, setShowScript] = useState(false);

  // Get the subliminal from store
  const subliminal = useMemo(() => getSubliminal(id || ''), [id, getSubliminal]);

  // Fallback for demo
  const displaySubliminal: Subliminal = subliminal || {
    id: id || '1',
    title: 'Your Subliminal',
    intention: 'Transform your mind',
    affirmations: [
      'I am confident and capable',
      'I believe in myself completely',
      'I radiate self-assurance',
      'My confidence grows stronger every day',
      'I am worthy of success and happiness',
    ],
    track: 'ocean-waves',
    audioUrl: '',
    createdAt: new Date().toISOString(),
  };

  useEffect(() => {
    setCurrentState('peaceful');
    StatusBar.setHidden(true, 'fade');

    return () => {
      setCurrentState('idle');
      StatusBar.setHidden(false, 'fade');
    };
  }, []);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(main)/home');
  };

  const handleToggleScript = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowScript(!showScript);
  };

  return (
    <View style={styles.container}>
      {/* The Void - Immersive player */}
      <VoidContainer
        audioUrl={displaySubliminal.audioUrl}
        affirmations={displaySubliminal.affirmations}
        title={displaySubliminal.title}
        duration={1800} // 30 minutes default
        track={displaySubliminal.track}
        onClose={handleClose}
        onComplete={handleClose}
        onToggleScript={handleToggleScript}
      />


      {/* Full script modal */}
      {showScript && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.scriptOverlay}
        >
          <BlurView intensity={90} tint="dark" style={styles.scriptBlur}>
            <View style={[styles.scriptContainer, { paddingTop: insets.top + spacing.md }]}>
              {/* Header */}
              <View style={styles.scriptHeader}>
                <Text style={styles.scriptTitle}>Your Affirmations</Text>
                <TouchableOpacity
                  onPress={handleToggleScript}
                  accessibilityLabel="Close affirmations"
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>

              {/* Intention */}
              <View style={styles.intentionSection}>
                <Text style={styles.intentionLabel}>Your intention</Text>
                <Text style={styles.intentionText}>"{displaySubliminal.intention}"</Text>
              </View>

              {/* Affirmations list */}
              <ScrollView
                style={styles.scriptScroll}
                showsVerticalScrollIndicator={false}
              >
                {displaySubliminal.affirmations.map((affirmation, index) => (
                  <Animated.View
                    key={index}
                    entering={FadeInUp.delay(index * 50).duration(300)}
                    style={styles.scriptItem}
                  >
                    <Text style={styles.scriptNumber}>{index + 1}</Text>
                    <Text style={styles.scriptText}>{affirmation}</Text>
                  </Animated.View>
                ))}
                <View style={{ height: 100 }} />
              </ScrollView>
            </View>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scriptOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  scriptBlur: {
    flex: 1,
  },
  scriptContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scriptTitle: {
    ...typography.h2,
    color: '#fff',
  },
  intentionSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
  },
  intentionLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  intentionText: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  scriptScroll: {
    flex: 1,
  },
  scriptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  scriptNumber: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.5)',
    width: 24,
    marginRight: spacing.sm,
  },
  scriptText: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
    lineHeight: 24,
  },
});
