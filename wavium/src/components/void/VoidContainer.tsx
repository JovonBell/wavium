/**
 * WAVIUM - The Void Container
 * The immersive full-screen player experience
 * "You're not just opening an app. You're entering a portal where reality dissolves."
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/useThemeStore';
import { useMindiStore } from '../../stores/useMindiStore';
import { speakAffirmations, stopSpeaking, getIsSpeaking, VOICE_PRESETS } from '../../services/speech';
import { audio } from '../../systems/AudioSystem';
import StarField from './StarField';

// Free ambient audio URLs for beat sounds
// Note: Using reliable CDN URLs - some Pixabay URLs expire
const BEAT_AUDIO_URLS: Record<string, string> = {
  'ocean-waves': 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  'rainfall': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'deep-focus': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'cosmic-drift': 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
};
import NebulaRenderer from './NebulaRenderer';
import ParallaxLayer from './ParallaxLayer';
import AffirmationSpirals from './AffirmationSpirals';
import PlayerControls from './PlayerControls';
import { MindiRenderer } from '../mindi';
import { springs, hapticPatterns } from '../../theme/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VoidContainerProps {
  audioUrl: string;
  affirmations: string[];
  title: string;
  duration: number; // in seconds
  track?: string; // Selected beat/sound track
  onClose?: () => void;
  onComplete?: () => void;
  onToggleScript?: () => void;
}

export default function VoidContainer({
  audioUrl,
  affirmations,
  title,
  duration,
  track = 'ocean-waves',
  onClose,
  onComplete,
  onToggleScript,
}: VoidContainerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { setCurrentState } = useMindiStore();

  // Playback state for speech
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceVolume, setVoiceVolume] = useState(0.3); // Voice intensity (0-1) - lower = more subliminal
  const [backgroundVolume, setBackgroundVolume] = useState(0.3);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [isLooping, setIsLooping] = useState(true); // Default to looping on
  const [audioError, setAudioError] = useState(false); // Track if background audio failed
  const actualDuration = duration;

  // Animation values
  const voidOpacity = useSharedValue(0);
  const controlsOpacity = useSharedValue(1);
  const controlsVisible = useSharedValue(1);

  // Gyroscope values for parallax (from ParallaxLayer)
  const [gyroX, setGyroX] = useState(0);
  const [gyroY, setGyroY] = useState(0);

  // Refs for timeout cleanup
  const tapHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enter the void animation
  useEffect(() => {
    StatusBar.setHidden(true);

    // Fade in
    voidOpacity.value = withTiming(1, { duration: 1500 });

    // Set Mindi to peaceful state
    setCurrentState('peaceful');

    // Haptic feedback for entering
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    return () => {
      StatusBar.setHidden(false);
      setCurrentState('idle');
    };
  }, []);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;

    if (isPlaying) {
      hideTimer = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 500 });
        controlsVisible.value = 0;
      }, 3000);
    } else {
      controlsOpacity.value = withTiming(1, { duration: 300 });
      controlsVisible.value = 1;
    }

    return () => clearTimeout(hideTimer);
  }, [isPlaying]);

  // Handle screen tap to show controls
  const handleScreenTap = useCallback(() => {
    if (controlsVisible.value === 0) {
      controlsOpacity.value = withTiming(1, { duration: 300 });
      controlsVisible.value = 1;

      // Auto-hide again after 3s if playing
      if (isPlaying) {
        // Clear any existing timeout first
        if (tapHideTimeoutRef.current) {
          clearTimeout(tapHideTimeoutRef.current);
        }
        tapHideTimeoutRef.current = setTimeout(() => {
          controlsOpacity.value = withTiming(0, { duration: 500 });
          controlsVisible.value = 0;
        }, 3000);
      }
    }
  }, [isPlaying]);

  // Handle gyroscope updates from ParallaxLayer
  const handleGyroUpdate = useCallback((x: number, y: number) => {
    setGyroX(x);
    setGyroY(y);
  }, []);

  // Simulate audio levels when playing for visual effects
  useEffect(() => {
    let levelInterval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;

    if (isPlaying) {
      // Simulate audio levels for visual feedback
      levelInterval = setInterval(() => {
        setAudioLevel(0.3 + Math.random() * 0.4);
      }, 100);

      // Update time progress
      timeInterval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= actualDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setAudioLevel(0);
    }

    return () => {
      clearInterval(levelInterval);
      clearInterval(timeInterval);
    };
  }, [isPlaying, actualDuration]);

  // Cleanup speech, audio, and timeouts on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      audio.stop();
      if (tapHideTimeoutRef.current) {
        clearTimeout(tapHideTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Handle playback controls
  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await stopSpeaking();
      await audio.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);

      // Load and play beat audio at lower volume so voice is clearer
      const beatUrl = BEAT_AUDIO_URLS[track] || BEAT_AUDIO_URLS['ocean-waves'];
      try {
        setAudioError(false);
        await audio.load(beatUrl);
        await audio.setVolume(backgroundVolume);
        await audio.setLoop(true);
        await audio.play();
      } catch (error) {
        // TTS will still work without background, but show indicator
        console.warn('Beat audio unavailable, continuing with voice only:', error);
        setAudioError(true);
      }

      // Start speaking affirmations with sync callback and voice intensity
      const voicePreset = (track in VOICE_PRESETS ? track : 'ocean-waves') as keyof typeof VOICE_PRESETS;
      speakAffirmations(
        affirmations,
        voicePreset,
        () => {
          // When TTS finishes, keep beat audio playing but reset UI
          setIsPlaying(false);
          setCurrentTime(0);
          setCurrentAffirmationIndex(0);
        },
        (index) => {
          // Sync UI with currently spoken affirmation
          setCurrentAffirmationIndex(index);
        },
        voiceVolume // Pass voice intensity to control rate/pitch
      );
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isPlaying, affirmations, track, voiceVolume, backgroundVolume]);

  const handleSeek = useCallback(async (time: number) => {
    setCurrentTime(time);
    // Actually seek the audio
    try {
      await audio.seek(time);
    } catch (error) {
      console.warn('Could not seek audio:', error);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleVoiceVolumeChange = useCallback((value: number) => {
    setVoiceVolume(value);
    // Note: Changes take effect when playback starts (can't change mid-speech)
  }, []);

  const handleBackgroundVolumeChange = useCallback(async (value: number) => {
    setBackgroundVolume(value);
    try {
      await audio.setVolume(value);
    } catch (error) {
      console.warn('Could not set background volume:', error);
    }
  }, []);

  const handleToggleLoop = useCallback(async () => {
    const newLoopState = !isLooping;
    setIsLooping(newLoopState);
    try {
      await audio.setLoop(newLoopState);
    } catch (error) {
      console.warn('Could not toggle loop:', error);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isLooping]);

  const handleClose = useCallback(() => {
    voidOpacity.value = withTiming(0, { duration: 500 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    closeTimeoutRef.current = setTimeout(() => {
      onClose?.();
    }, 500);
  }, [onClose]);

  // Animated container style
  const containerStyle = useAnimatedStyle(() => ({
    opacity: voidOpacity.value,
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
    pointerEvents: controlsOpacity.value > 0.5 ? 'auto' : 'none',
  }));

  // Calculate progress
  const progress = actualDuration > 0 ? currentTime / actualDuration : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        containerStyle,
      ]}
    >
      {/* Parallax container - handles gyroscope */}
      <ParallaxLayer onGyroUpdate={handleGyroUpdate}>
        {/* Layer 1: Deep star field (slowest) */}
        <View style={styles.layer}>
          <StarField
            layer="deep"
            gyroX={gyroX}
            gyroY={gyroY}
            audioLevel={audioLevel}
          />
        </View>

        {/* Layer 2: Nebula (audio-reactive) */}
        <View style={styles.layer}>
          <NebulaRenderer
            audioLevel={audioLevel}
            gyroX={gyroX}
            gyroY={gyroY}
          />
        </View>

        {/* Layer 3: Medium star field */}
        <View style={styles.layer}>
          <StarField
            layer="medium"
            gyroX={gyroX}
            gyroY={gyroY}
            audioLevel={audioLevel}
          />
        </View>

        {/* Layer 4: Affirmation spirals */}
        <View style={styles.layer}>
          <AffirmationSpirals
            affirmations={affirmations}
            isPlaying={isPlaying}
            audioLevel={audioLevel}
            currentIndex={currentAffirmationIndex}
          />
        </View>

        {/* Layer 5: Mindi (center) */}
        <View style={styles.mindiContainer}>
          <MindiRenderer
            size={180}
            showParticles={true}
            audioLevel={audioLevel}
          />

          {/* Progress ring around Mindi */}
          <View style={styles.progressRing}>
            <ProgressRing
              progress={progress}
              size={220}
              strokeWidth={3}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Layer 6: Near star field (fastest) */}
        <View style={styles.layer}>
          <StarField
            layer="near"
            gyroX={gyroX}
            gyroY={gyroY}
            audioLevel={audioLevel}
          />
        </View>
      </ParallaxLayer>

      {/* Tap area for showing controls */}
      <Animated.View
        style={[StyleSheet.absoluteFill]}
        onTouchEnd={handleScreenTap}
      />

      {/* Controls overlay */}
      <Animated.View
        style={[
          styles.controlsContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
          controlsStyle,
        ]}
      >
        <PlayerControls
          title={title}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={actualDuration}
          voiceVolume={voiceVolume}
          backgroundVolume={backgroundVolume}
          isLooping={isLooping}
          audioError={audioError}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onClose={handleClose}
          onToggleScript={onToggleScript}
          onVoiceVolumeChange={handleVoiceVolumeChange}
          onBackgroundVolumeChange={handleBackgroundVolumeChange}
          onToggleLoop={handleToggleLoop}
        />
      </Animated.View>
    </Animated.View>
  );
}

// Simple progress ring component
function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: `${color}30`,
          position: 'absolute',
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          position: 'absolute',
          transform: [{ rotate: `${progress * 360}deg` }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  mindiContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
});
