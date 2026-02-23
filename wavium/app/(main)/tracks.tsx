/**
 * WAVIUM - Tracks Screen
 * Choose your subliminal soundtrack
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useMindiStore, SoundTrack, SOUND_TRACKS } from '../../src/stores/useMindiStore';
import { GlassmorphicCard, HapticButton, GlowText, LoadingOverlay } from '../../src/components/ui';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { audio } from '../../src/systems/AudioSystem';
import { generateVoiceAudio, getAmbientTrackUrl } from '../../src/services/api';

// Audio URLs for track previews - served from our backend
const BEAT_AUDIO_URLS: Record<string, string> = {
  'ocean-waves': getAmbientTrackUrl('ocean-waves'),
  'rainfall': getAmbientTrackUrl('rainfall'),
  'deep-focus': getAmbientTrackUrl('deep-focus'),
  'cosmic-drift': getAmbientTrackUrl('cosmic-drift'),
  'lofi-chill': getAmbientTrackUrl('lofi-chill'),
};

// Track icons
const TRACK_ICONS: Record<SoundTrack, string> = {
  'ocean-waves': 'water',
  'rainfall': 'rainy',
  'deep-focus': 'pulse',
  'cosmic-drift': 'planet',
  'lofi-chill': 'musical-note',
};

export default function TracksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { creation, setSelectedTrack, saveSubliminal } = useMindiStore();

  const [selectedTrackId, setSelectedTrackId] = useState<SoundTrack | null>(
    creation.selectedTrack
  );
  const [isCreating, setIsCreating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup audio when leaving screen
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      audio.stop();
    };
  }, []);

  const isLoadingPreview = useRef(false);

  const handleSelectTrack = async (trackId: SoundTrack) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTrackId(trackId);
    setSelectedTrack(trackId);

    // Clear any existing preview timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Prevent overlapping load/play operations
    if (isLoadingPreview.current) return;
    isLoadingPreview.current = true;

    // Play audio preview
    try {
      const previewUrl = BEAT_AUDIO_URLS[trackId];
      try { await audio.stop(); } catch {}
      const loaded = await audio.load(previewUrl);
      if (!loaded) {
        isLoadingPreview.current = false;
        return;
      }
      await audio.setVolume(0.5);
      await audio.play();

      // Stop preview after 5 seconds
      previewTimeoutRef.current = setTimeout(() => {
        audio.stop().catch(() => {});
      }, 5000);
    } catch (error) {
      console.warn('Could not play track preview:', error);
    } finally {
      isLoadingPreview.current = false;
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreateSubliminal = async () => {
    if (!selectedTrackId) return;
    if (!creation.intention || !creation.affirmations?.length) {
      router.replace('/(main)/create');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsCreating(true);
    setGenerationProgress(10);
    setGenerationMessage('Generating your subliminal audio...');

    // Get the voice for the selected track
    const trackConfig = SOUND_TRACKS[selectedTrackId];
    const voice = trackConfig.voice || 'jenny';

    try {
      setGenerationProgress(30);
      setGenerationMessage('Creating whispered affirmations...');

      // Generate voice-only TTS audio (player handles background separately)
      const { audioUrl, error } = await generateVoiceAudio(
        creation.affirmations,
        voice,
      );

      if (error || !audioUrl) {
        throw new Error(error || 'No audio URL returned');
      }

      setGenerationProgress(90);
      setGenerationMessage('Almost ready...');

      // Save with the real audio URL
      const title = (creation.intention || 'My Subliminal').slice(0, 50);
      const newSubliminal = saveSubliminal(title, audioUrl);

      setGenerationProgress(100);
      setGenerationMessage('Ready!');

      setTimeout(() => {
        router.replace(`/player/${newSubliminal.id}`);
      }, 300);
    } catch (error) {
      setIsCreating(false);
      setGenerationProgress(0);
      setGenerationMessage('');

      Alert.alert(
        'Generation Failed',
        'Could not generate subliminal audio. Make sure the backend server is running.\n\n' +
          (error instanceof Error ? error.message : 'Unknown error'),
        [{ text: 'OK' }]
      );
    }
  };

  const trackIds = Object.keys(SOUND_TRACKS) as SoundTrack[];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Animated.View entering={FadeIn.duration(400)}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
            <Text style={[styles.backText, { color: colors.textSecondary }]}>
              Back
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
          <GlowText variant="h2" glowIntensity={0.4}>
            Choose Your Sound
          </GlowText>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select the backdrop for your subliminal experience
          </Text>
        </Animated.View>

        {/* Track options */}
        <View style={styles.tracksSection}>
          {trackIds.map((trackId, index) => {
            const track = SOUND_TRACKS[trackId];
            const isSelected = selectedTrackId === trackId;
            const iconName = TRACK_ICONS[trackId] as keyof typeof Ionicons.glyphMap;

            return (
              <Animated.View
                key={trackId}
                entering={FadeInDown.delay(200 + index * 100).duration(400)}
              >
                <TouchableOpacity
                  onPress={() => handleSelectTrack(trackId)}
                  activeOpacity={0.8}
                >
                  <GlassmorphicCard
                    style={StyleSheet.flatten([
                      styles.trackCard,
                      isSelected && {
                        borderWidth: 2,
                        borderColor: colors.primary,
                      },
                    ])}
                  >
                    <View style={styles.trackContent}>
                      <View
                        style={[
                          styles.trackIcon,
                          {
                            backgroundColor: isSelected
                              ? colors.primary + '30'
                              : colors.surface,
                          },
                        ]}
                      >
                        <Ionicons
                          name={iconName}
                          size={28}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                      </View>
                      <View style={styles.trackInfo}>
                        <Text
                          style={[
                            styles.trackName,
                            { color: colors.textPrimary },
                            isSelected && { color: colors.primary },
                          ]}
                        >
                          {track.name}
                        </Text>
                        <Text style={[styles.trackDescription, { color: colors.textSecondary }]}>
                          {track.description}
                        </Text>
                        <Text style={[styles.trackFrequency, { color: colors.textMuted }]}>
                          {track.frequency}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSelected ? colors.primary : colors.textMuted,
                          },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[styles.radioInner, { backgroundColor: colors.primary }]}
                          />
                        )}
                      </View>
                    </View>
                  </GlassmorphicCard>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Info about binaural beats */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.infoSection}
        >
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="headset" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              For the best experience with binaural frequencies, use headphones.
            </Text>
          </View>
        </Animated.View>

        {/* Create button */}
        <Animated.View
          entering={FadeInUp.delay(700).duration(500)}
          style={styles.buttonSection}
        >
          <HapticButton
            onPress={handleCreateSubliminal}
            variant="primary"
            size="large"
            fullWidth
            disabled={!selectedTrackId || isCreating}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {isCreating ? 'Creating...' : 'Create My Subliminal'}
              </Text>
            </View>
          </HapticButton>
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Loading overlay */}
      <LoadingOverlay
        visible={isCreating}
        message={generationMessage}
        progress={generationProgress}
      />
    </View>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backText: {
    ...typography.body,
    marginLeft: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  tracksSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  trackCard: {
    padding: spacing.md,
  },
  trackContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackDescription: {
    ...typography.bodySmall,
    marginBottom: 2,
  },
  trackFrequency: {
    ...typography.caption,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 20,
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
