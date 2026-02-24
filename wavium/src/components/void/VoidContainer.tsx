/**
 * WAVIUM - The Void Container
 * The immersive full-screen player experience
 * Two-stream audio: background ambient + voice (subliminal) playing independently
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/useThemeStore';
import { useMindiStore } from '../../stores/useMindiStore';
import { speakAffirmations, stopSpeaking, VOICE_PRESETS } from '../../services/speech';
import { getAmbientTrackUrl } from '../../services/api';
import StarField from './StarField';
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

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioLevel = useSharedValue(0);
  const [voiceVolume, setVoiceVolume] = useState(0.15); // Subliminal = low voice
  const [backgroundVolume, setBackgroundVolume] = useState(0.7);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const actualDuration = duration;

  // Two separate audio streams
  const bgSoundRef = useRef<Audio.Sound | null>(null);
  const voiceSoundRef = useRef<Audio.Sound | null>(null);

  // Animation values
  const voidOpacity = useSharedValue(0);
  const controlsOpacity = useSharedValue(1);
  const controlsVisible = useSharedValue(1);

  // Gyroscope values for parallax
  const [gyroX, setGyroX] = useState(0);
  const [gyroY, setGyroY] = useState(0);

  // Whether we're using pre-recorded audio (vs live TTS) for affirmation cycling
  const usingPreRecordedVoice = useRef(false);
  const affirmationCycleRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for timeout cleanup
  const tapHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configure audio mode on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);

  // Enter the void animation
  useEffect(() => {
    StatusBar.setHidden(true);
    voidOpacity.value = withTiming(1, { duration: 1500 });
    setCurrentState('peaceful');
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

      if (isPlaying) {
        if (tapHideTimeoutRef.current) clearTimeout(tapHideTimeoutRef.current);
        tapHideTimeoutRef.current = setTimeout(() => {
          controlsOpacity.value = withTiming(0, { duration: 500 });
          controlsVisible.value = 0;
        }, 3000);
      }
    }
  }, [isPlaying]);

  const handleGyroUpdate = useCallback((x: number, y: number) => {
    setGyroX(x);
    setGyroY(y);
  }, []);

  // Poll actual audio position and simulate audio levels
  useEffect(() => {
    let levelInterval: NodeJS.Timeout;
    let positionInterval: NodeJS.Timeout;

    if (isPlaying) {
      levelInterval = setInterval(() => {
        audioLevel.value = 0.3 + Math.random() * 0.4;
      }, 100);

      // Poll real audio position from background sound (most reliable)
      positionInterval = setInterval(async () => {
        try {
          const status = await bgSoundRef.current?.getStatusAsync();
          if (status?.isLoaded && status.positionMillis != null) {
            setCurrentTime(Math.floor(status.positionMillis / 1000));
          }
        } catch {
          // Fallback: increment manually if polling fails
          setCurrentTime((prev) => {
            if (prev >= actualDuration) {
              setIsPlaying(false);
              return 0;
            }
            return prev + 1;
          });
        }
      }, 1000);
    } else {
      audioLevel.value = 0;
    }

    return () => {
      clearInterval(levelInterval);
      clearInterval(positionInterval);
    };
  }, [isPlaying, actualDuration]);

  // Cycle through affirmations when using pre-recorded audio (spirals need index changes)
  useEffect(() => {
    if (isPlaying && usingPreRecordedVoice.current && affirmations.length > 0) {
      // Estimate time per affirmation based on total count
      const msPerAffirmation = Math.max(4000, 20000 / affirmations.length);
      affirmationCycleRef.current = setInterval(() => {
        setCurrentAffirmationIndex((prev) => (prev + 1) % affirmations.length);
      }, msPerAffirmation);
    }

    return () => {
      if (affirmationCycleRef.current) {
        clearInterval(affirmationCycleRef.current);
        affirmationCycleRef.current = null;
      }
    };
  }, [isPlaying, affirmations.length]);

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      bgSoundRef.current?.unloadAsync().catch(() => {});
      voiceSoundRef.current?.unloadAsync().catch(() => {});
      if (tapHideTimeoutRef.current) clearTimeout(tapHideTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (affirmationCycleRef.current) clearInterval(affirmationCycleRef.current);
    };
  }, []);

  // Stop both audio streams
  const stopAllAudio = useCallback(async () => {
    usingPreRecordedVoice.current = false;
    await stopSpeaking();
    try { await bgSoundRef.current?.stopAsync(); } catch {}
    try { await voiceSoundRef.current?.stopAsync(); } catch {}
  }, []);

  // Play with two independent streams (voice + background)
  const playTwoStreams = useCallback(async () => {
    // --- Background ambient stream ---
    const bgUrl = getAmbientTrackUrl(track);
    try {
      setAudioError(false);
      // Unload previous background if exists
      if (bgSoundRef.current) {
        await bgSoundRef.current.unloadAsync().catch(() => {});
      }
      const { sound: bgSound } = await Audio.Sound.createAsync(
        { uri: bgUrl },
        { shouldPlay: true, volume: backgroundVolume, isLooping: true }
      );
      bgSoundRef.current = bgSound;
    } catch (error) {
      console.warn('Background audio unavailable:', error);
      setAudioError(true);
    }

    // --- Voice stream ---
    if (audioUrl) {
      // We have a pre-generated voice TTS file from the backend
      try {
        if (voiceSoundRef.current) {
          await voiceSoundRef.current.unloadAsync().catch(() => {});
        }
        const { sound: voiceSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: voiceVolume, isLooping: isLooping }
        );
        voiceSoundRef.current = voiceSound;
        usingPreRecordedVoice.current = true;
      } catch (error) {
        console.warn('Voice audio failed, falling back to live TTS:', error);
        usingPreRecordedVoice.current = false;
        // Fall back to live TTS
        const voicePreset = (track in VOICE_PRESETS ? track : 'ocean-waves') as keyof typeof VOICE_PRESETS;
        speakAffirmations(
          affirmations,
          voicePreset,
          () => { /* TTS cycle complete */ },
          (index) => setCurrentAffirmationIndex(index),
          voiceVolume
        );
      }
    } else {
      // No backend audio — use live TTS
      usingPreRecordedVoice.current = false;
      const voicePreset = (track in VOICE_PRESETS ? track : 'ocean-waves') as keyof typeof VOICE_PRESETS;
      speakAffirmations(
        affirmations,
        voicePreset,
        () => { /* TTS cycle complete */ },
        (index) => setCurrentAffirmationIndex(index),
        voiceVolume
      );
    }
  }, [audioUrl, affirmations, track, voiceVolume, backgroundVolume, isLooping]);

  // Handle play/pause
  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await stopAllAudio();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await playTwoStreams();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isPlaying, stopAllAudio, playTwoStreams]);

  const handleSeek = useCallback(async (time: number) => {
    setCurrentTime(time);
    try {
      await bgSoundRef.current?.setPositionAsync(time * 1000);
      await voiceSoundRef.current?.setPositionAsync(time * 1000);
    } catch (error) {
      console.warn('Could not seek audio:', error);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Voice volume slider — controls voice stream in real time
  const handleVoiceVolumeChange = useCallback(async (value: number) => {
    setVoiceVolume(value);
    try {
      await voiceSoundRef.current?.setVolumeAsync(value);
    } catch {}
  }, []);

  // Background volume slider — controls background stream in real time
  const handleBackgroundVolumeChange = useCallback(async (value: number) => {
    setBackgroundVolume(value);
    try {
      await bgSoundRef.current?.setVolumeAsync(value);
    } catch {}
  }, []);

  const handleToggleLoop = useCallback(async () => {
    const newLoopState = !isLooping;
    setIsLooping(newLoopState);
    try {
      await bgSoundRef.current?.setIsLoopingAsync(newLoopState);
      await voiceSoundRef.current?.setIsLoopingAsync(newLoopState);
    } catch {}
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isLooping]);

  const handleClose = useCallback(() => {
    voidOpacity.value = withTiming(0, { duration: 500 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    closeTimeoutRef.current = setTimeout(() => {
      onClose?.();
    }, 500);
  }, [onClose]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: voidOpacity.value,
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
    pointerEvents: controlsOpacity.value > 0.5 ? 'auto' : 'none',
  }));

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
          <StarField layer="deep" gyroX={gyroX} gyroY={gyroY} audioLevel={audioLevel} />
        </View>

        {/* Layer 2: Nebula (audio-reactive) */}
        <View style={styles.layer}>
          <NebulaRenderer audioLevel={audioLevel} gyroX={gyroX} gyroY={gyroY} />
        </View>

        {/* Layer 3: Medium star field */}
        <View style={styles.layer}>
          <StarField layer="medium" gyroX={gyroX} gyroY={gyroY} audioLevel={audioLevel} />
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
          <MindiRenderer size={180} showParticles={true} audioLevel={audioLevel} />
          <View style={styles.progressRing}>
            <ProgressRing progress={progress} size={220} strokeWidth={3} color={colors.primary} />
          </View>
        </View>

        {/* Layer 6: Near star field (fastest) */}
        <View style={styles.layer}>
          <StarField layer="near" gyroX={gyroX} gyroY={gyroY} audioLevel={audioLevel} />
        </View>
      </ParallaxLayer>

      {/* Tap area for showing controls */}
      <Animated.View style={[StyleSheet.absoluteFill]} onTouchEnd={handleScreenTap} />

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
          transform: [{ rotate: `${Math.min(progress, 1) * 360}deg` }],
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
