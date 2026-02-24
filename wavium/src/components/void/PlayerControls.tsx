/**
 * WAVIUM - Player Controls
 * Glassmorphic floating controls for THE VOID
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';
import { springs } from '../../theme/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlayerControlsProps {
  title: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  voiceVolume: number;
  backgroundVolume: number;
  isLooping: boolean;
  audioError?: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onClose: () => void;
  onToggleScript?: () => void;
  onVoiceVolumeChange: (value: number) => void;
  onBackgroundVolumeChange: (value: number) => void;
  onToggleLoop: () => void;
}

// Format seconds to mm:ss
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlayerControls({
  title,
  isPlaying,
  currentTime,
  duration,
  voiceVolume,
  backgroundVolume,
  isLooping,
  audioError = false,
  onPlayPause,
  onSeek,
  onClose,
  onToggleScript,
  onVoiceVolumeChange,
  onBackgroundVolumeChange,
  onToggleLoop,
}: PlayerControlsProps) {
  const { colors } = useThemeStore();

  // Button press animations
  const playButtonScale = useSharedValue(1);
  const closeButtonScale = useSharedValue(1);

  const handlePlayPress = useCallback(() => {
    playButtonScale.value = withSpring(0.9, springs.snappy, () => {
      playButtonScale.value = withSpring(1, springs.snappy);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlayPause();
  }, [onPlayPause]);

  const handleClosePress = useCallback(() => {
    closeButtonScale.value = withSpring(0.9, springs.snappy, () => {
      closeButtonScale.value = withSpring(1, springs.snappy);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const playButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));

  const closeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeButtonScale.value }],
  }));

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={styles.container}>
      {/* Top bar - Close button and title */}
      <View style={styles.topBar}>
        <Animated.View style={closeButtonStyle}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClosePress}
            activeOpacity={0.7}
          >
            <BlurView intensity={30} style={styles.blurButton}>
              <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            In The Void
          </Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        {/* Progress bar — minimal 2px gold gradient (VOID-04) */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: `${colors.textMuted}40` }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  shadowColor: colors.primaryGradient[1],
                  shadowRadius: 4,
                  shadowOpacity: 0.6,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <LinearGradient
                colors={colors.primaryGradient as unknown as [string, string, ...string[]]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {formatTime(currentTime)}
            </Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Play/Pause controls */}
        <View style={styles.controlsRow}>
          {/* Skip back 15s */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              onSeek(Math.max(0, currentTime - 15));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="play-back" size={28} color={colors.textSecondary} />
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>15</Text>
          </TouchableOpacity>

          {/* Play/Pause */}
          <Animated.View style={playButtonStyle}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPress}
              activeOpacity={0.8}
            >
              <BlurView intensity={40} style={styles.playButtonBlur}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={36}
                  color={colors.textPrimary}
                  style={isPlaying ? {} : { marginLeft: 4 }}
                />
              </BlurView>
            </TouchableOpacity>
          </Animated.View>

          {/* Skip forward 15s */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              onSeek(Math.min(duration, currentTime + 15));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="play-forward" size={28} color={colors.textSecondary} />
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>15</Text>
          </TouchableOpacity>
        </View>

        {/* Volume controls */}
        <View style={styles.volumeSection}>
          {/* Voice intensity slider */}
          <View style={styles.volumeRow}>
            <View style={styles.volumeLabel}>
              <Ionicons name="mic" size={18} color={colors.textSecondary} />
              <Text style={[styles.volumeLabelText, { color: colors.textSecondary }]}>Voice</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={voiceVolume}
              onValueChange={onVoiceVolumeChange}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={`${colors.textMuted}40`}
              thumbTintColor={colors.accent}
            />
          </View>

          {/* Background volume */}
          <View style={styles.volumeRow}>
            <View style={styles.volumeLabel}>
              <Ionicons
                name={audioError ? "alert-circle" : "musical-notes"}
                size={18}
                color={audioError ? colors.error || '#ff6b6b' : colors.textSecondary}
              />
              <Text style={[styles.volumeLabelText, { color: audioError ? colors.error || '#ff6b6b' : colors.textSecondary }]}>
                {audioError ? 'Unavailable' : 'Music'}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={backgroundVolume}
              onValueChange={onBackgroundVolumeChange}
              minimumTrackTintColor={audioError ? colors.textMuted : colors.primary}
              maximumTrackTintColor={`${colors.textMuted}40`}
              thumbTintColor={audioError ? colors.textMuted : colors.primary}
              disabled={audioError}
            />
          </View>
        </View>

        {/* Additional controls row */}
        <View style={styles.extraControlsRow}>
          <TouchableOpacity
            style={styles.extraButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggleScript?.();
            }}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.extraButtonText, { color: colors.textSecondary }]}>
              Script
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.extraButton}
            onPress={onToggleLoop}
          >
            <Ionicons
              name="repeat"
              size={22}
              color={isLooping ? colors.primary : colors.textSecondary}
            />
            <Text style={[
              styles.extraButtonText,
              { color: isLooping ? colors.primary : colors.textSecondary }
            ]}>
              Loop {isLooping ? 'On' : 'Off'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.extraButton, { opacity: 0.5 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // TODO: Implement download functionality
            }}
          >
            <Ionicons name="download-outline" size={22} color={colors.textMuted} />
            <Text style={[styles.extraButtonText, { color: colors.textMuted }]}>
              Coming Soon
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
  },
  blurButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  placeholder: {
    width: 44,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressTrack: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
    overflow: 'hidden',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    ...typography.caption,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 24,
  },
  skipButton: {
    alignItems: 'center',
    padding: 8,
  },
  skipText: {
    ...typography.caption,
    fontSize: 10,
    marginTop: 2,
  },
  playButton: {
    width: 72,
    height: 72,
  },
  playButtonBlur: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  volumeSection: {
    marginBottom: 16,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  volumeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
    gap: 6,
  },
  volumeLabelText: {
    ...typography.caption,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  extraControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  extraButton: {
    alignItems: 'center',
    padding: 8,
  },
  extraButtonText: {
    ...typography.caption,
    marginTop: 4,
  },
});
