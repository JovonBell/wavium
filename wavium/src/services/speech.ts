/**
 * WAVIUM - Speech Service
 * Text-to-speech using expo-speech
 */

import * as Speech from 'expo-speech';

export interface SpeechOptions {
  rate?: number;      // 0.1 to 2.0 (default 1.0)
  pitch?: number;     // 0.5 to 2.0 (default 1.0)
  language?: string;  // e.g., 'en-US'
  voice?: string;     // Voice identifier
}

// Voice presets matching our sound tracks - tuned for subliminal (quiet, background) feel
// Faster rate + lower pitch = sounds quieter and more like background whispers
export const VOICE_PRESETS = {
  'ocean-waves': { rate: 1.15, pitch: 0.85 },   // Quick whisper, faint
  'rainfall': { rate: 1.2, pitch: 0.9 },        // Soft, rapid murmur
  'deep-focus': { rate: 1.25, pitch: 0.85 },    // Fast, focused whisper
  'cosmic-drift': { rate: 1.1, pitch: 0.8 },    // Dreamy, ethereal whisper
  'lofi-chill': { rate: 1.1, pitch: 0.9 },      // Warm, relaxed whisper
};

/**
 * Get voice settings adjusted by intensity (pseudo-volume control)
 * Since expo-speech doesn't support volume on mobile, we use rate/pitch to simulate it
 * @param baseRate - Base rate from preset
 * @param basePitch - Base pitch from preset
 * @param intensity - 0-1 where 0=quieter feel, 0.5=default, 1=louder feel
 */
export function getVoiceIntensitySettings(
  baseRate: number,
  basePitch: number,
  intensity: number
): { rate: number; pitch: number } {
  // Clamp intensity between 0 and 1
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  // intensity 0 = faster rate (1.1x), lower pitch (0.85x) - quieter feel
  // intensity 0.5 = base rate/pitch - default
  // intensity 1 = slower rate (0.75x), higher pitch (1.15x) - louder feel
  const rateAdjust = 0.2 - (clampedIntensity * 0.35); // +0.2 to -0.15
  const pitchAdjust = -0.15 + (clampedIntensity * 0.3); // -0.15 to +0.15

  return {
    rate: Math.max(0.5, Math.min(2.0, baseRate + rateAdjust)),
    pitch: Math.max(0.5, Math.min(2.0, basePitch + pitchAdjust)),
  };
}

let isSpeaking = false;
let currentCallback: (() => void) | null = null;

/**
 * Speak a list of affirmations with pauses between them
 * @param affirmations - List of affirmations to speak
 * @param preset - Voice preset to use
 * @param onComplete - Called when all affirmations are done
 * @param onAffirmationChange - Called when starting a new affirmation (index)
 * @param intensity - Voice intensity 0-1 (pseudo-volume control)
 */
export async function speakAffirmations(
  affirmations: string[],
  preset: keyof typeof VOICE_PRESETS = 'ocean-waves',
  onComplete?: () => void,
  onAffirmationChange?: (index: number) => void,
  intensity: number = 0.5
): Promise<void> {
  // Stop any current speech
  await stopSpeaking();

  isSpeaking = true;
  currentCallback = onComplete || null;

  const baseOptions = VOICE_PRESETS[preset];
  // Apply intensity adjustment to rate/pitch
  const options = getVoiceIntensitySettings(baseOptions.rate, baseOptions.pitch, intensity);

  // Speak each affirmation with a pause
  for (let i = 0; i < affirmations.length; i++) {
    if (!isSpeaking) break; // Check if stopped

    // Notify UI which affirmation is being spoken
    onAffirmationChange?.(i);

    const affirmation = affirmations[i];

    await new Promise<void>((resolve) => {
      Speech.speak(affirmation, {
        language: 'en-US',
        rate: options.rate,
        pitch: options.pitch,
        onDone: () => resolve(),
        onError: () => resolve(),
        onStopped: () => resolve(),
      });
    });

    // Pause between affirmations (2 seconds)
    if (i < affirmations.length - 1 && isSpeaking) {
      await delay(2000);
    }
  }

  isSpeaking = false;
  currentCallback?.();
}

/**
 * Speak a single piece of text
 */
export function speak(
  text: string,
  options: SpeechOptions = {},
  onComplete?: () => void
): void {
  Speech.speak(text, {
    language: options.language || 'en-US',
    rate: options.rate || 0.9,
    pitch: options.pitch || 1.0,
    voice: options.voice,
    onDone: onComplete,
    onError: onComplete,
  });
}

/**
 * Stop current speech
 */
export async function stopSpeaking(): Promise<void> {
  isSpeaking = false;
  currentCallback = null;
  await Speech.stop();
}

/**
 * Check if currently speaking
 */
export function getIsSpeaking(): boolean {
  return isSpeaking;
}

/**
 * Get available voices
 */
export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  return Speech.getAvailableVoicesAsync();
}

// Helper
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
