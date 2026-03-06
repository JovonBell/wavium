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
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useMindiStore, SoundTrack, SOUND_TRACKS, VoiceId, VOICES } from '../../src/stores/useMindiStore';
import { useAuthStore } from '../../src/stores/useAuthStore';

// Extended voice type that includes custom voice option
type VoiceOption = VoiceId | 'custom';

import { GlassmorphicCard, HapticButton, GlowText, LoadingOverlay } from '../../src/components/ui';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { audio } from '../../src/systems/AudioSystem';
import { generateVoiceAudio, getAmbientTrackUrl, getVoicePreviewUrl } from '../../src/services/api';

// Mood color tints per track — subtle background shift on selection (VOID-06)
const MOOD_COLORS: Record<string, string> = {
  'ocean-waves': 'rgba(30, 60, 120, 0.15)',
  'rainfall': 'rgba(60, 80, 110, 0.12)',
  'deep-focus': 'rgba(80, 40, 120, 0.15)',
  'cosmic-drift': 'rgba(40, 30, 100, 0.18)',
  'lofi-chill': 'rgba(120, 80, 30, 0.12)',
  'lofi-dream': 'rgba(100, 60, 120, 0.14)',
  'lofi-jazz': 'rgba(140, 100, 40, 0.12)',
  'zen-garden': 'rgba(60, 100, 60, 0.14)',
  'night-drive': 'rgba(30, 20, 60, 0.18)',
  'forest-dawn': 'rgba(50, 100, 50, 0.14)',
};

// Audio URLs for track previews - served from our backend
const BEAT_AUDIO_URLS: Record<string, string> = {
  'ocean-waves': getAmbientTrackUrl('ocean-waves'),
  'rainfall': getAmbientTrackUrl('rainfall'),
  'deep-focus': getAmbientTrackUrl('deep-focus'),
  'cosmic-drift': getAmbientTrackUrl('cosmic-drift'),
  'lofi-chill': getAmbientTrackUrl('lofi-chill'),
  'lofi-dream': getAmbientTrackUrl('lofi-dream'),
  'lofi-jazz': getAmbientTrackUrl('lofi-jazz'),
  'zen-garden': getAmbientTrackUrl('zen-garden'),
  'night-drive': getAmbientTrackUrl('night-drive'),
  'forest-dawn': getAmbientTrackUrl('forest-dawn'),
};

// Track icons
const TRACK_ICONS: Record<SoundTrack, string> = {
  'ocean-waves': 'water',
  'rainfall': 'rainy',
  'deep-focus': 'pulse',
  'cosmic-drift': 'planet',
  'lofi-chill': 'musical-note',
  'lofi-dream': 'cloud',
  'lofi-jazz': 'musical-notes',
  'zen-garden': 'leaf',
  'night-drive': 'moon',
  'forest-dawn': 'sunny',
};

export default function TracksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { creation, setSelectedTrack, setSelectedVoice, saveSubliminal, hasCustomVoice, customVoiceId, recordingUri, userName, userId } = useMindiStore();
  const authUser = useAuthStore((s) => s.user);

  const [selectedTrackId, setSelectedTrackId] = useState<SoundTrack | null>(
    creation.selectedTrack
  );
  const [selectedVoiceId, setSelectedVoiceIdLocal] = useState<VoiceOption | null>(
    creation.selectedVoice ?? (hasCustomVoice && customVoiceId ? 'custom' : null)
  );
  const [isCreating, setIsCreating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mood color tint overlay (VOID-06)
  const [moodTint, setMoodTint] = useState('transparent');
  const moodOpacity = useSharedValue(0);

  const moodStyle = useAnimatedStyle(() => ({
    opacity: moodOpacity.value,
  }));

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

    // Update mood color tint (VOID-06)
    const mood = MOOD_COLORS[trackId] || 'transparent';
    setMoodTint(mood);
    moodOpacity.value = withTiming(1, { duration: 800 });

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
      await audio.setVolume(0.85);
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

  const isLoadingVoicePreview = useRef(false);

  const handleSelectVoice = async (voiceId: VoiceOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVoiceIdLocal(voiceId);
    if (voiceId !== 'custom') {
      setSelectedVoice(voiceId);
    }

    // Clear any existing preview timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Custom cloned voice: play the raw recording as preview
    if (voiceId === 'custom') {
      if (!recordingUri) return;
      if (isLoadingVoicePreview.current) return;
      isLoadingVoicePreview.current = true;
      try {
        try { await audio.stop(); } catch {}
        const loaded = await audio.load(recordingUri);
        if (!loaded) { isLoadingVoicePreview.current = false; return; }
        await audio.setVolume(0.8);
        await audio.play();
        previewTimeoutRef.current = setTimeout(() => { audio.stop().catch(() => {}); }, 6000);
      } catch (error) {
        console.warn('Could not play voice preview:', error);
      } finally {
        isLoadingVoicePreview.current = false;
      }
      return;
    }

    if (isLoadingVoicePreview.current) return;
    isLoadingVoicePreview.current = true;

    try {
      const previewUrl = await getVoicePreviewUrl(voiceId);
      if (!previewUrl) {
        isLoadingVoicePreview.current = false;
        return;
      }
      try { await audio.stop(); } catch {}
      const loaded = await audio.load(previewUrl);
      if (!loaded) {
        isLoadingVoicePreview.current = false;
        return;
      }
      await audio.setVolume(0.8);
      await audio.play();

      // Stop preview after 6 seconds
      previewTimeoutRef.current = setTimeout(() => {
        audio.stop().catch(() => {});
      }, 6000);
    } catch (error) {
      console.warn('Could not play voice preview:', error);
    } finally {
      isLoadingVoicePreview.current = false;
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreateSubliminal = async () => {
    if (!selectedTrackId || !selectedVoiceId) return;
    if (!creation.intention || !creation.affirmations?.length) {

      router.replace('/(main)/create');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsCreating(true);
    setGenerationProgress(10);
    setGenerationMessage('Generating your subliminal audio...');

    // Use custom cloned voice or selected preset voice
    const voice = selectedVoiceId === 'custom' && customVoiceId
      ? customVoiceId
      : (selectedVoiceId || 'ava');

    try {
      setGenerationProgress(30);
      setGenerationMessage('Creating whispered affirmations...');

      // Generate voice-only TTS audio (player handles background separately)
      // If using custom cloned voice, pass clone ID and user ID for XTTS v2 synthesis
      const isClonedVoice = selectedVoiceId === 'custom' && customVoiceId;

      // Resolve userId — fall back to auth store if MindiStore userId is null
      const resolvedUserId = userId || authUser?.id || null;
      if (isClonedVoice && !resolvedUserId) {
        Alert.alert('Error', 'Could not identify your account. Please sign out and sign in again.');
        setIsCreating(false);
        setGenerationProgress(0);
        setGenerationMessage('');
        return;
      }

      // Show GPU warming message after 10s for cloned voice synthesis
      let warmupTimeout: ReturnType<typeof setTimeout> | null = null;
      if (isClonedVoice) {
        warmupTimeout = setTimeout(() => {
          setGenerationMessage('GPU is warming up — first generation can take 2-3 minutes...');
        }, 10000);
      }

      const { audioUrl, error } = await generateVoiceAudio(
        creation.affirmations,
        voice,
        isClonedVoice ? customVoiceId : null,
        isClonedVoice ? resolvedUserId : null,
      );

      if (warmupTimeout) clearTimeout(warmupTimeout);

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
      {/* Mood color tint overlay (VOID-06) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          moodStyle,
          { backgroundColor: moodTint, pointerEvents: 'none' },
        ]}
      />
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
            Personalize Your Experience
          </GlowText>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose your voice and soundtrack
          </Text>
        </Animated.View>

        {/* Voice picker section */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Choose Your Voice
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Who whispers your affirmations?
          </Text>
        </Animated.View>

        <View style={styles.voicesSection}>
          {/* Custom cloned voice option */}
          {hasCustomVoice && customVoiceId && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <TouchableOpacity
                onPress={() => handleSelectVoice('custom')}
                activeOpacity={0.8}
              >
                <GlassmorphicCard
                  style={StyleSheet.flatten([
                    styles.voiceCard,
                    selectedVoiceId === 'custom' && {
                      borderWidth: 2,
                      borderColor: colors.primary,
                    },
                  ])}
                >
                  <View style={styles.voiceContent}>
                    <View
                      style={[
                        styles.voiceIcon,
                        {
                          backgroundColor: selectedVoiceId === 'custom'
                            ? colors.primary + '30'
                            : colors.surface,
                        },
                      ]}
                    >
                      <Ionicons
                        name="mic"
                        size={22}
                        color={selectedVoiceId === 'custom' ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <View style={styles.voiceInfo}>
                      <Text
                        style={[
                          styles.voiceName,
                          { color: colors.textPrimary },
                          selectedVoiceId === 'custom' && { color: colors.primary },
                        ]}
                      >
                        My Voice
                      </Text>
                      <Text style={[styles.voiceDescription, { color: colors.textSecondary }]}>
                        {userName ? `${userName}'s cloned voice` : 'Your cloned voice'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: selectedVoiceId === 'custom' ? colors.primary : colors.textMuted,
                        },
                      ]}
                    >
                      {selectedVoiceId === 'custom' && (
                        <View
                          style={[styles.radioInner, { backgroundColor: colors.primary }]}
                        />
                      )}
                    </View>
                  </View>
                </GlassmorphicCard>
              </TouchableOpacity>
            </Animated.View>
          )}

          {(Object.keys(VOICES) as VoiceId[]).map((voiceId, index) => {
            const voice = VOICES[voiceId];
            const isSelected = selectedVoiceId === voiceId;
            const iconName = (voice.gender === 'female' ? 'woman' : 'man') as keyof typeof Ionicons.glyphMap;

            return (
              <Animated.View
                key={voiceId}
                entering={FadeInDown.delay(200 + index * 80).duration(400)}
              >
                <TouchableOpacity
                  onPress={() => handleSelectVoice(voiceId)}
                  activeOpacity={0.8}
                >
                  <GlassmorphicCard
                    style={StyleSheet.flatten([
                      styles.voiceCard,
                      isSelected && {
                        borderWidth: 2,
                        borderColor: colors.primary,
                      },
                    ])}
                  >
                    <View style={styles.voiceContent}>
                      <View
                        style={[
                          styles.voiceIcon,
                          {
                            backgroundColor: isSelected
                              ? colors.primary + '30'
                              : colors.surface,
                          },
                        ]}
                      >
                        <Ionicons
                          name={iconName}
                          size={22}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                      </View>
                      <View style={styles.voiceInfo}>
                        <Text
                          style={[
                            styles.voiceName,
                            { color: colors.textPrimary },
                            isSelected && { color: colors.primary },
                          ]}
                        >
                          {voice.name}
                        </Text>
                        <Text style={[styles.voiceDescription, { color: colors.textSecondary }]}>
                          {voice.description}
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

        {/* Track section header */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Choose Your Sound
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Select the backdrop for your subliminal
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
            disabled={!selectedTrackId || !selectedVoiceId || isCreating}
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
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 2,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
  },
  voicesSection: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  voiceCard: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  voiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  voiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 1,
  },
  voiceDescription: {
    ...typography.bodySmall,
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
