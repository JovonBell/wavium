/**
 * WAVIUM - Audio System
 * Audio playback and analysis for the player
 */

import { Audio, AVPlaybackStatus } from 'expo-av';

// Audio playback state
export interface AudioState {
  isLoaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  duration: number;
  position: number;
  volume: number;
}

// Audio level for visualization
export interface AudioLevels {
  bass: number;
  mid: number;
  high: number;
  overall: number;
}

class AudioSystem {
  private sound: Audio.Sound | null = null;
  private statusCallback: ((state: AudioState) => void) | null = null;
  private levelsCallback: ((levels: AudioLevels) => void) | null = null;
  private simulatedLevelsInterval: NodeJS.Timeout | null = null;
  private isConfigured: boolean = false;
  private configPromise: Promise<void>;

  constructor() {
    // Configure audio mode and store promise for awaiting
    this.configPromise = this.configureAudioMode();
  }

  private async configureAudioMode(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isConfigured = true;
      console.log('Audio mode configured successfully');
    } catch (error) {
      console.error('Error configuring audio mode:', error);
      // Still mark as configured to allow fallback behavior
      this.isConfigured = true;
    }
  }

  // Ensure audio is configured before any operation
  private async ensureConfigured(): Promise<void> {
    if (!this.isConfigured) {
      await this.configPromise;
    }
  }

  // Load audio from URL
  async load(uri: string): Promise<boolean> {
    try {
      // Wait for audio mode to be configured first
      await this.ensureConfigured();

      // Unload previous sound if exists
      await this.unload();

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        this.handleStatusUpdate.bind(this)
      );

      this.sound = sound;
      return true;
    } catch (error) {
      console.error('Error loading audio:', error);
      return false;
    }
  }

  // Load audio from local file
  async loadLocal(require: any): Promise<boolean> {
    try {
      await this.unload();

      const { sound } = await Audio.Sound.createAsync(
        require,
        { shouldPlay: false },
        this.handleStatusUpdate.bind(this)
      );

      this.sound = sound;
      return true;
    } catch (error) {
      console.error('Error loading local audio:', error);
      return false;
    }
  }

  // Unload current audio
  async unload() {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch {}
      this.sound = null;
    }
    this.stopSimulatedLevels();
  }

  // Playback controls
  async play() {
    if (!this.sound) return;
    await this.sound.playAsync();
    this.startSimulatedLevels();
  }

  async pause() {
    if (!this.sound) return;
    await this.sound.pauseAsync();
    this.stopSimulatedLevels();
  }

  async stop() {
    if (!this.sound) return;
    try {
      await this.sound.stopAsync();
    } catch {}
    this.stopSimulatedLevels();
  }

  async seek(position: number) {
    if (!this.sound) return;
    await this.sound.setPositionAsync(position * 1000);
  }

  async setVolume(volume: number) {
    if (!this.sound) return;
    await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
  }

  async setLoop(loop: boolean) {
    if (!this.sound) return;
    await this.sound.setIsLoopingAsync(loop);
  }

  // Set fade out timer
  async fadeOut(durationMs: number) {
    if (!this.sound) return;

    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeStep = 1 / steps;

    for (let i = steps; i >= 0; i--) {
      await this.sound.setVolumeAsync(i * volumeStep);
      await this.delay(stepDuration);
    }

    await this.stop();
  }

  // Status callback registration
  onStatusChange(callback: (state: AudioState) => void) {
    this.statusCallback = callback;
  }

  // Audio levels callback (for visualization)
  onLevelsChange(callback: (levels: AudioLevels) => void) {
    this.levelsCallback = callback;
  }

  // Handle status updates from expo-av
  private handleStatusUpdate(status: AVPlaybackStatus) {
    if (!status.isLoaded) {
      this.statusCallback?.({
        isLoaded: false,
        isPlaying: false,
        isBuffering: false,
        duration: 0,
        position: 0,
        volume: 1,
      });
      return;
    }

    this.statusCallback?.({
      isLoaded: true,
      isPlaying: status.isPlaying,
      isBuffering: status.isBuffering,
      duration: (status.durationMillis || 0) / 1000,
      position: (status.positionMillis || 0) / 1000,
      volume: status.volume,
    });
  }

  // Simulated audio levels (since expo-av doesn't provide real frequency data)
  // In production, you might use a native module for actual audio analysis
  private startSimulatedLevels() {
    this.simulatedLevelsInterval = setInterval(() => {
      // Simulate audio levels with random variations
      const base = 0.3 + Math.random() * 0.4;
      const levels: AudioLevels = {
        bass: base + Math.random() * 0.3,
        mid: base + Math.random() * 0.2,
        high: base + Math.random() * 0.1,
        overall: base + Math.random() * 0.2,
      };

      this.levelsCallback?.(levels);
    }, 50); // 20 FPS for smooth visualization
  }

  private stopSimulatedLevels() {
    if (this.simulatedLevelsInterval) {
      clearInterval(this.simulatedLevelsInterval);
      this.simulatedLevelsInterval = null;
    }

    // Reset levels
    this.levelsCallback?.({
      bass: 0,
      mid: 0,
      high: 0,
      overall: 0,
    });
  }

  // Helper
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Lazy singleton — only instantiate on first use, not at module parse time
// This prevents native TurboModule calls before the bridge is ready
let _audioInstance: AudioSystem | null = null;
export function getAudio(): AudioSystem {
  if (!_audioInstance) {
    _audioInstance = new AudioSystem();
  }
  return _audioInstance;
}
// Keep backward-compatible export as a getter
// IMPORTANT: bind methods so `this` inside them is the real instance, not the proxy
export const audio = new Proxy({} as AudioSystem, {
  get(_target, prop) {
    const value = (getAudio() as any)[prop];
    if (typeof value === 'function') {
      return value.bind(getAudio());
    }
    return value;
  },
});

// React hook for audio system
import { useState, useEffect, useCallback } from 'react';

export function useAudio(uri?: string) {
  const [state, setState] = useState<AudioState>({
    isLoaded: false,
    isPlaying: false,
    isBuffering: false,
    duration: 0,
    position: 0,
    volume: 1,
  });

  const [levels, setLevels] = useState<AudioLevels>({
    bass: 0,
    mid: 0,
    high: 0,
    overall: 0,
  });

  useEffect(() => {
    audio.onStatusChange(setState);
    audio.onLevelsChange(setLevels);

    if (uri) {
      audio.load(uri);
    }

    return () => {
      audio.unload();
    };
  }, [uri]);

  const play = useCallback(() => audio.play(), []);
  const pause = useCallback(() => audio.pause(), []);
  const stop = useCallback(() => audio.stop(), []);
  const seek = useCallback((pos: number) => audio.seek(pos), []);
  const setVolume = useCallback((vol: number) => audio.setVolume(vol), []);
  const setLoop = useCallback((loop: boolean) => audio.setLoop(loop), []);
  const fadeOut = useCallback((duration: number) => audio.fadeOut(duration), []);

  return {
    state,
    levels,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setLoop,
    fadeOut,
  };
}
