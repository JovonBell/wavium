/**
 * WAVIUM - The Void Container
 * The immersive full-screen player experience
 * Two-stream audio: background ambient + voice (subliminal) playing independently
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, StatusBar, Text, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/useThemeStore';
import { useMindiStore } from '../../stores/useMindiStore';
import { speakAffirmations, stopSpeaking, VOICE_PRESETS } from '../../services/speech';
import { getAmbientTrackUrl } from '../../services/api';
import CrossfadeAudioPair from '../../systems/CrossfadeAudioPair';
import StarField from './StarField';
import NebulaRenderer from './NebulaRenderer';
import ParallaxLayer from './ParallaxLayer';
import AffirmationSpirals from './AffirmationSpirals';
import PlayerControls from './PlayerControls';
import { MindiRenderer } from '../mindi';

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
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const {
    setCurrentState,
    voiceVolume: storedVoiceVolume,
    backgroundVolume: storedBgVolume,
    setVoiceVolume: persistVoiceVolume,
    setBackgroundVolume: persistBgVolume,
  } = useMindiStore();

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioLevel = useSharedValue(0);
  const [voiceVolume, setVoiceVolume] = useState(storedVoiceVolume);
  const [backgroundVolume, setBackgroundVolume] = useState(storedBgVolume);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const actualDuration = duration;

  // Two crossfade audio pairs for seamless looping
  const bgCrossfade = useRef<CrossfadeAudioPair>(new CrossfadeAudioPair());
  const voiceCrossfade = useRef<CrossfadeAudioPair>(new CrossfadeAudioPair());
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
  // Track whether audio has been loaded (so we can pause/resume instead of reload)
  const audioLoadedRef = useRef(false);

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
          const status = await bgCrossfade.current.getStatusAsync();
          if (status?.isLoaded && status.positionMillis != null) {
            setCurrentTime(Math.floor(status.positionMillis / 1000));
          }
        } catch {
          // Fallback: increment manually if polling fails
          setCurrentTime((prev) => {
            if (prev >= actualDuration && !sessionComplete) {
              setIsPlaying(false);
              setSessionComplete(true);
              setCurrentState('happy');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setTimeout(() => onComplete?.(), 2000);
              return prev;
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

  // Track voice audio duration once loaded, then cycle affirmations in sync
  const voiceDurationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || !usingPreRecordedVoice.current || affirmations.length === 0) {
      return () => {
        if (affirmationCycleRef.current) {
          clearInterval(affirmationCycleRef.current);
          affirmationCycleRef.current = null;
        }
      };
    }

    // Poll voice audio position to determine which affirmation we're on
    affirmationCycleRef.current = setInterval(async () => {
      try {
        const status = await voiceCrossfade.current.getStatusAsync();
        if (!status?.isLoaded) return;

        const pos = status.positionMillis ?? 0;
        const dur = status.durationMillis ?? 0;
        if (dur > 0) {
          voiceDurationRef.current = dur;
          // Divide the voice track evenly among affirmations
          const msPerAffirmation = dur / affirmations.length;
          const newIndex = Math.min(
            Math.floor(pos / msPerAffirmation),
            affirmations.length - 1
          );
          setCurrentAffirmationIndex(newIndex);
        }
      } catch {
        // Fallback: just cycle at a fixed rate if polling fails
      }
    }, 500);

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
      audioLoadedRef.current = false;
      bgCrossfade.current.unload().catch(() => {});
      voiceCrossfade.current.unload().catch(() => {});
      if (tapHideTimeoutRef.current) clearTimeout(tapHideTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (affirmationCycleRef.current) clearInterval(affirmationCycleRef.current);
    };
  }, []);

  // Pause both audio streams (keeps position for smooth resume)
  const pauseAllAudio = useCallback(async () => {
    if (usingPreRecordedVoice.current) {
      await bgCrossfade.current.pause();
      await voiceCrossfade.current.pause();
    } else {
      await stopSpeaking();
      await bgCrossfade.current.pause();
    }
  }, []);

  // Resume both streams from paused state
  const resumeAllAudio = useCallback(async () => {
    if (usingPreRecordedVoice.current) {
      await bgCrossfade.current.resume();
      await voiceCrossfade.current.resume();
    } else {
      await bgCrossfade.current.resume();
      // Re-start live TTS from current index on resume
      const voicePreset = (track in VOICE_PRESETS ? track : 'ocean-waves') as keyof typeof VOICE_PRESETS;
      speakAffirmations(
        affirmations,
        voicePreset,
        () => { /* TTS cycle complete */ },
        (index) => setCurrentAffirmationIndex(index),
        voiceVolume
      );
    }
  }, [affirmations, track, voiceVolume]);

  // Load and start both streams for the first time
  const loadAndPlayStreams = useCallback(async () => {
    // --- Background ambient stream (seamless crossfade looping) ---
    const bgUrl = getAmbientTrackUrl(track);
    try {
      setAudioError(false);
      await bgCrossfade.current.load(bgUrl, backgroundVolume);
    } catch (error) {
      console.warn('Background audio unavailable:', error);
      setAudioError(true);
    }

    // --- Voice stream ---
    if (audioUrl) {
      // We have a pre-generated voice TTS file from the backend
      if (__DEV__) console.log('[VoidContainer] Loading voice audio:', audioUrl, 'volume:', voiceVolume);
      try {
        await voiceCrossfade.current.load(audioUrl, voiceVolume);
        usingPreRecordedVoice.current = true;
        if (__DEV__) console.log('[VoidContainer] Voice audio loaded successfully');
      } catch (error) {
        if (__DEV__) console.warn('[VoidContainer] Voice audio FAILED, falling back to live TTS:', error);
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

    audioLoadedRef.current = true;
  }, [audioUrl, affirmations, track, voiceVolume, backgroundVolume]);

  // Handle play/pause — uses pause/resume to avoid audio resetting
  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pauseAllAudio();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (audioLoadedRef.current) {
        // Resume from where we left off
        await resumeAllAudio();
      } else {
        // First play — load everything fresh
        await loadAndPlayStreams();
      }
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isPlaying, pauseAllAudio, resumeAllAudio, loadAndPlayStreams]);

  const handleSeek = useCallback(async (time: number) => {
    setCurrentTime(time);
    try {
      await bgCrossfade.current.setPosition(time * 1000);
      await voiceCrossfade.current.setPosition(time * 1000);
    } catch (error) {
      console.warn('Could not seek audio:', error);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Voice volume slider — controls voice stream in real time and persists
  const handleVoiceVolumeChange = useCallback(async (value: number) => {
    setVoiceVolume(value);
    persistVoiceVolume(value);
    await voiceCrossfade.current.setVolume(value);
  }, [persistVoiceVolume]);

  // Background volume slider — controls background stream in real time and persists
  const handleBackgroundVolumeChange = useCallback(async (value: number) => {
    setBackgroundVolume(value);
    persistBgVolume(value);
    await bgCrossfade.current.setVolume(value);
  }, [persistBgVolume]);

  const handleToggleLoop = useCallback(async () => {
    const newLoopState = !isLooping;
    setIsLooping(newLoopState);
    // CrossfadeAudioPair handles its own looping via crossfade; state tracked for UI
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
        { backgroundColor: colors.background, width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
        containerStyle,
      ]}
    >
      {/* Parallax container - handles gyroscope */}
      <ParallaxLayer onGyroUpdate={handleGyroUpdate}>
        {/* Layer 1: Deep star field (slowest) */}
        <Animated.View style={styles.layer} entering={FadeIn.delay(0).duration(800)}>
          <StarField layer="deep" gyroX={gyroX} gyroY={gyroY} audioLevel={audioLevel} />
        </Animated.View>

        {/* Layer 2: Nebula (audio-reactive) */}
        <Animated.View style={styles.layer} entering={FadeIn.delay(200).duration(800)}>
          <NebulaRenderer audioLevel={audioLevel} gyroX={gyroX} gyroY={gyroY} />
        </Animated.View>

        {/* Layer 3: Medium star field */}
        <Animated.View style={styles.layer} entering={FadeIn.delay(400).duration(800)}>
          <StarField layer="medium" gyroX={gyroX} gyroY={gyroY} audioLevel={audioLevel} />
        </Animated.View>

        {/* Layer 4: Mindi — upper third, translucent */}
        <Animated.View style={[styles.mindiContainer, { top: SCREEN_HEIGHT * 0.18 }]} entering={FadeIn.delay(600).duration(800)}>
          <MindiRenderer size={180} showParticles={true} audioLevel={audioLevel} opacity={0.7} />
          <View style={styles.progressRing}>
            <SkiaProgressRing progress={progress} size={220} strokeWidth={3} color={colors.primaryGradient[1]} />
          </View>
        </Animated.View>

        {/* Layer 5: Affirmation display — lower half */}
        <Animated.View style={styles.layer} entering={FadeIn.delay(800).duration(800)}>
          <AffirmationSpirals
            affirmations={affirmations}
            isPlaying={isPlaying}
            audioLevel={audioLevel}
            currentIndex={currentAffirmationIndex}
          />
        </Animated.View>

        {/* Layer 6: Near star field (fastest) with shooting stars */}
        <Animated.View style={styles.layer} entering={FadeIn.delay(200).duration(800)}>
          <StarField layer="near" gyroX={gyroX} gyroY={gyroY} audioLevel={audioLevel} />
        </Animated.View>

        {/* Vignette overlay — darkens bottom for text readability */}
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
          locations={[0, 0.4, 0.75, 1.0]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </ParallaxLayer>

      {/* Session complete overlay */}
      {sessionComplete && (
        <Animated.View
          style={styles.sessionCompleteOverlay}
          entering={FadeIn.duration(800)}
        >
          <Text style={[styles.sessionCompleteText, { color: colors.textPrimary }]}>
            Session Complete
          </Text>
        </Animated.View>
      )}

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

// GPU-rendered Skia progress ring (VOID-05)
function SkiaProgressRing({
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
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Background ring (track)
  const trackPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(cx, cy, r);
    return p;
  }, [cx, cy, r]);

  // Progress arc — swept from top (-90deg)
  const progressPath = useMemo(() => {
    const sweep = Math.min(progress, 1) * 360;
    const p = Skia.Path.Make();
    if (sweep > 0) {
      p.addArc(
        { x: cx - r, y: cy - r, width: r * 2, height: r * 2 },
        -90,
        sweep
      );
    }
    return p;
  }, [progress, cx, cy, r]);

  return (
    <Canvas style={{ width: size, height: size }}>
      <Path
        path={trackPath}
        style="stroke"
        strokeWidth={strokeWidth}
        color={`${color}30`}
      />
      <Path
        path={progressPath}
        style="stroke"
        strokeWidth={strokeWidth}
        color={color}
        strokeCap="round"
      />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  mindiContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCompleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCompleteText: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_400Regular',
    letterSpacing: 2,
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
});
