/**
 * WAVIUM - Backend API Service
 * Handles communication with the FastAPI backend for audio generation
 */

// Backend URL - uses env var or defaults to local development
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://wavium-production.up.railway.app';

export interface SubliminalAudioResponse {
  audio_url: string;
  voice: string;
  track: string;
  duration_secs: number;
}

export interface VoiceInfo {
  id: string;
  name: string;
  gender: string;
  description: string;
}

/**
 * Generate subliminal audio: whispered affirmations mixed under ambient background
 */
export async function generateSubliminalAudio(
  affirmations: string[],
  voice: string = 'ava',
  track: string = 'ocean-waves',
  durationSecs: number = 1800,
  userName?: string
): Promise<{ audioUrl: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-subliminal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        affirmations,
        voice,
        track,
        voice_volume: 0.12,
        bg_volume: 0.85,
        duration_secs: durationSecs,
        ...(userName ? { user_name: userName } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        audioUrl: '',
        error: errorData.detail || `Server error: ${response.status}`,
      };
    }

    const data: SubliminalAudioResponse = await response.json();
    // Return full URL to the audio file
    const audioUrl = `${API_BASE_URL}${data.audio_url}`;
    return { audioUrl };
  } catch (error) {
    return {
      audioUrl: '',
      error:
        error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
}

/**
 * Generate voice-only TTS audio (no background mixing) for two-stream playback
 */
export async function generateVoiceAudio(
  affirmations: string[],
  voice: string = 'ava'
): Promise<{ audioUrl: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affirmations, voice }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        audioUrl: '',
        error: errorData.detail || `Server error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { audioUrl: `${API_BASE_URL}${data.audio_url}` };
  } catch (error) {
    return {
      audioUrl: '',
      error:
        error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
}

/**
 * Get the URL for a background ambient track served from the backend
 */
export function getAmbientTrackUrl(track: string): string {
  return `${API_BASE_URL}/ambient/${track}.mp3`;
}

/**
 * Get a short voice preview audio URL (cached on backend after first call)
 */
export async function getVoicePreviewUrl(voiceId: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/voice-preview/${voiceId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return `${API_BASE_URL}${data.audio_url}`;
  } catch {
    return null;
  }
}

/**
 * Upload a voice recording for cloning via ElevenLabs
 */
export async function uploadVoiceRecording(
  audioUri: string,
  userId: string,
  name: string = 'My Voice'
): Promise<{ voiceId: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'voice_sample.m4a',
    } as any);
    formData.append('name', name);
    formData.append('user_id', userId);

    const response = await fetch(`${API_BASE_URL}/api/voice/clone`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { voiceId: '', error: errorData.detail || `Server error: ${response.status}` };
    }

    const data = await response.json();
    return { voiceId: data.voice_id };
  } catch (error) {
    return {
      voiceId: '',
      error: error instanceof Error ? error.message : 'Failed to upload voice',
    };
  }
}

/**
 * Check if the backend is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get available TTS voices from backend
 */
export async function getVoices(): Promise<VoiceInfo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/voices`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}
