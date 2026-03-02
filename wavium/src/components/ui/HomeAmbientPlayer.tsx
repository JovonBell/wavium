/**
 * WAVIUM - HomeAmbientPlayer
 * Plays quiet ocean-waves ambient audio on the home screen.
 * Fades in on mount, fades out when isActive becomes false (e.g. player opens).
 */

import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { getAmbientTrackUrl } from '../../services/api';

const AMBIENT_VOLUME = 0.08;
const FADE_IN_MS = 1000;
const FADE_OUT_MS = 500;
const FADE_STEP_MS = 50;

interface HomeAmbientPlayerProps {
  isActive: boolean;
}

export default function HomeAmbientPlayer({ isActive }: HomeAmbientPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentVolRef = useRef(0);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearFade = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  const fadeVolume = (from: number, to: number, durationMs: number) => {
    clearFade();
    const steps = durationMs / FADE_STEP_MS;
    let step = 0;
    fadeIntervalRef.current = setInterval(async () => {
      step++;
      const t = Math.min(step / steps, 1);
      const vol = from + (to - from) * t;
      currentVolRef.current = vol;
      try {
        await soundRef.current?.setVolumeAsync(vol);
      } catch {}
      if (t >= 1) clearFade();
    }, FADE_STEP_MS);
  };

  // Mount: load and fade in
  useEffect(() => {
    let mounted = true;

    const loadAndPlay = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const url = getAmbientTrackUrl('ocean-waves');
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, volume: 0, isLooping: true }
        );
        if (!mounted) {
          sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
        fadeVolume(0, AMBIENT_VOLUME, FADE_IN_MS);
      } catch (e) {
        // Ambient audio is best-effort; silently fail
      }
    };

    loadAndPlay();

    return () => {
      mounted = false;
      clearFade();
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  // isActive toggle: fade in or out
  useEffect(() => {
    if (!soundRef.current) return;
    if (isActive) {
      fadeVolume(currentVolRef.current, AMBIENT_VOLUME, FADE_IN_MS);
    } else {
      fadeVolume(currentVolRef.current, 0, FADE_OUT_MS);
    }
  }, [isActive]);

  // This component renders nothing — it's audio-only
  return null;
}
