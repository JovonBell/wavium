/**
 * WAVIUM - Voice Recording Screen
 * Record a voice sample for cloning. Skippable.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useMindiStore } from '../../src/stores/useMindiStore';
import { MindiRenderer, MindiSpeech } from '../../src/components/mindi';
import { HapticButton, SafeContainer } from '../../src/components/ui';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { uploadVoiceRecording } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/useAuthStore';

const MIN_DURATION_MS = 30_000; // 30 seconds minimum for voice cloning
const MAX_DURATION_MS = 90_000; // 90 seconds max

export default function RecordVoiceScreen() {
  const { colors } = useThemeStore();
  const { setCustomVoice, setCurrentState, userName } = useMindiStore();

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSpeech, setShowSpeech] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const contentOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));

    // Check if permission already granted (don't prompt yet — the dialog
    // causes an app state change that re-triggers the route guard and loops
    // back to onboarding start since userId is still null)
    Audio.getPermissionsAsync().then(({ granted }) => {
      setPermissionGranted(granted);
    });

    setTimeout(() => {
      setSpeechMessage(
        `${userName || 'Hey'}, record your voice so I can speak your affirmations in YOUR voice!`
      );
      setShowSpeech(true);
      setCurrentState('excited');
    }, 800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Release audio session on unmount to prevent leaks
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isRecording]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const startRecording = async () => {
    if (!permissionGranted) {
      const { granted } = await Audio.requestPermissionsAsync();
      setPermissionGranted(granted);
      if (!granted) {
        Alert.alert('Microphone Access', 'Please enable microphone access in Settings.');
        return;
      }
    }

    try {
      // Release any existing recording first to avoid iOS session conflicts
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
        recordingRef.current = null;
      }

      // Reset audio mode first, then set to recording mode
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); } catch {}
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      setShowSpeech(false);
      setCurrentState('listening');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const next = prev + 1000;
          if (next >= MAX_DURATION_MS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (e) {
      console.warn('Failed to start recording:', e);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (uri) {
        setRecordingUri(uri);
        setSpeechMessage('Great recording! Ready to clone your voice?');
        setShowSpeech(true);
        setCurrentState('happy');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.warn('Failed to stop recording:', e);
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!recordingUri) return;

    setUploading(true);
    setShowSpeech(false);
    setCurrentState('generating');

    const session = useAuthStore.getState().session;
    const userId = session?.user?.id;
    if (!userId) {
      Alert.alert('Error', 'Not authenticated');
      setUploading(false);
      return;
    }

    console.log('[VoiceClone] Uploading recording...', { uri: recordingUri, userId });
    const result = await uploadVoiceRecording(recordingUri, userId, userName || 'My Voice');
    console.log('[VoiceClone] Upload result:', result);

    if (result.voiceId) {
      setCustomVoice(result.voiceId, recordingUri);
      setSpeechMessage("I've learned your voice! Let's continue.");
      setShowSpeech(true);
      setCurrentState('excited');

      setTimeout(() => {
        router.push('/(onboarding)/paywall');
      }, 1500);
    } else {
      Alert.alert('Upload Failed', result.error || 'Please try again or skip for now.');
      setCurrentState('idle');
      setUploading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/paywall');
  };

  const handleReRecord = () => {
    setRecordingUri(null);
    setRecordingDuration(0);
    setSpeechMessage('Let\'s try again! Read the prompt naturally.');
    setShowSpeech(true);
    setCurrentState('listening');
  };

  const formatDuration = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    return `0:${secs.toString().padStart(2, '0')}`;
  };

  const canSubmit = recordingUri !== null && recordingDuration >= MIN_DURATION_MS;

  return (
    <SafeContainer style={styles.container}>
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Mindi */}
        <View style={styles.mindiContainer}>
          <MindiSpeech message={speechMessage} visible={showSpeech} />
          <MindiRenderer size={120} showParticles={true} />
        </View>

        {/* Recording area */}
        <View style={styles.recordArea}>
          {!recordingUri ? (
            <>
              <Text style={[styles.prompt, { color: colors.textSecondary }]}>
                Read this aloud in your natural voice:
              </Text>
              <Text style={[styles.sampleText, { color: colors.textPrimary }]}>
                "I am becoming the best version of myself. Every day I grow stronger, more confident, and more aligned with my true purpose. I release all doubt and step into my power. My mind is clear, my heart is open, and I attract abundance in every area of my life. I am worthy of love, success, and everything I desire. The universe supports me in all that I do. I trust the process, and I know that everything is unfolding perfectly for me. Who am I? I am unstoppable."
              </Text>
              <View style={styles.tipsContainer}>
                <Text style={[styles.tipText, { color: colors.textMuted }]}>
                  Find a quiet spot with no background noise.{'\n'}
                  Speak naturally — like you're talking to a friend.{'\n'}
                  Vary your tone — don't read it flat or robotic.
                </Text>
              </View>

              {/* Record button */}
              <Animated.View style={pulseStyle}>
                <HapticButton
                  onPress={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? 'secondary' : 'primary'}
                  size="large"
                  haptic="heavy"
                  style={[
                    styles.recordButton,
                    isRecording && { backgroundColor: '#ff4444' },
                  ]}
                >
                  <View style={styles.recordButtonContent}>
                    <Ionicons
                      name={isRecording ? 'stop' : 'mic'}
                      size={28}
                      color="#fff"
                    />
                    <Text style={styles.recordButtonText}>
                      {isRecording
                        ? `Recording ${formatDuration(recordingDuration)}`
                        : 'Start Recording'}
                    </Text>
                  </View>
                </HapticButton>
              </Animated.View>

              {isRecording && recordingDuration < MIN_DURATION_MS && (
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Keep going... {formatDuration(MIN_DURATION_MS - recordingDuration)} more
                </Text>
              )}
            </>
          ) : (
            <>
              <View style={[styles.recordedBadge, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.recordedText, { color: colors.primary }]}>
                  {formatDuration(recordingDuration)} recorded
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <HapticButton
                  onPress={handleUpload}
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled={!canSubmit || uploading}
                >
                  {uploading ? 'Cloning Your Voice...' : 'Use My Voice'}
                </HapticButton>

                <HapticButton
                  onPress={handleReRecord}
                  variant="ghost"
                  size="medium"
                  disabled={uploading}
                >
                  Re-record
                </HapticButton>
              </View>
            </>
          )}
        </View>
      </Animated.View>

      {/* Skip button */}
      {!uploading && (
        <View style={styles.skipContainer}>
          <HapticButton
            onPress={handleSkip}
            variant="ghost"
            size="medium"
            haptic="light"
          >
            <Text style={[styles.skipText, { color: colors.textMuted }]}>
              Skip for now
            </Text>
          </HapticButton>
        </View>
      )}
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  mindiContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  recordArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  prompt: {
    ...typography.label,
    textTransform: 'uppercase',
  },
  sampleText: {
    ...typography.affirmation,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  tipsContainer: {
    paddingHorizontal: spacing.lg,
  },
  tipText: {
    ...typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
  recordButton: {
    minWidth: 200,
  },
  recordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recordButtonText: {
    ...typography.button,
    color: '#fff',
  },
  hint: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  recordedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  recordedText: {
    ...typography.button,
  },
  actionButtons: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
  },
  skipContainer: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  skipText: {
    ...typography.body,
  },
});
