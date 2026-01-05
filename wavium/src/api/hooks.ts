/**
 * WAVIUM - API Hooks
 * React hooks for API calls with loading/error states
 */

import { useState, useCallback } from 'react';
import { api, ApiResponse, GenerationProgress } from './client';
import { useMindiStore } from '../stores/useMindiStore';

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await apiCall();

    if (response.error) {
      setError(response.error);
    } else {
      setData(response.data);
    }

    setLoading(false);
    return response;
  }, dependencies);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// Hook for processing intentions
export function useProcessIntention() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    affirmations: string[];
    title: string;
    category: string;
  } | null>(null);

  const process = useCallback(async (intention: string) => {
    setLoading(true);
    setError(null);

    const response = await api.processIntention(intention);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setResult(response.data);
    }

    setLoading(false);
    return response;
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, error, result, process, reset };
}

// Hook for subliminal generation with progress
export function useGeneration() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    audioUrl: string;
    affirmations: string[];
  } | null>(null);

  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  const generate = useCallback((params: {
    intention: string;
    voice: string;
    background: string;
    duration: number;
    technique: string;
  }) => {
    setGenerating(true);
    setProgress(0);
    setMessage('Starting generation...');
    setError(null);
    setResult(null);

    const generator = api.generateSubliminal(params);

    setCancelFn(() => () => generator.cancel());

    generator.onProgress((data: GenerationProgress) => {
      switch (data.type) {
        case 'progress':
          setProgress(data.percent || 0);
          setMessage(data.message || '');
          break;
        case 'complete':
          setGenerating(false);
          setProgress(100);
          setResult({
            audioUrl: data.audioUrl || '',
            affirmations: data.affirmations || [],
          });
          break;
        case 'error':
          setGenerating(false);
          setError(data.message || 'Generation failed');
          break;
      }
    });
  }, []);

  const cancel = useCallback(() => {
    cancelFn?.();
    setGenerating(false);
    setProgress(0);
    setMessage('');
  }, [cancelFn]);

  const reset = useCallback(() => {
    setGenerating(false);
    setProgress(0);
    setMessage('');
    setError(null);
    setResult(null);
  }, []);

  return {
    generating,
    progress,
    message,
    error,
    result,
    generate,
    cancel,
    reset,
  };
}

// Hook for library
export function useLibrary() {
  const [subliminals, setSubliminals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await api.getLibrary();

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setSubliminals(response.data.subliminals);
    }

    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    return fetch();
  }, [fetch]);

  return { subliminals, loading, error, fetch, refresh };
}

// Hook for Mindi state sync
export function useMindiSync() {
  const { setUserId } = useMindiStore();

  const sync = useCallback(async () => {
    const response = await api.getMindiState();

    if (response.data) {
      // Update local store with server state
      // This is a simplified sync - in production you'd handle conflicts
    }
  }, []);

  // Initialize API client with user ID
  const initialize = useCallback((userId: string) => {
    api.setUserId(userId);
    setUserId(userId);
  }, [setUserId]);

  return { sync, initialize };
}

// Hook for voices
export function useVoices() {
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const response = await api.getVoices();
    if (response.data) {
      setVoices(response.data.voices);
    }
    setLoading(false);
  }, []);

  return { voices, loading, fetch };
}

// Hook for backgrounds
export function useBackgrounds() {
  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const response = await api.getBackgrounds();
    if (response.data) {
      setBackgrounds(response.data.backgrounds);
    }
    setLoading(false);
  }, []);

  return { backgrounds, loading, fetch };
}

// Hook for session recording (simplified - no local XP tracking)
export function useSessionRecorder() {
  const [recording, setRecording] = useState(false);

  const record = useCallback(async (
    subliminalId: string,
    durationSeconds: number,
    completed: boolean
  ) => {
    setRecording(true);

    // Sync with server
    const response = await api.recordSession({
      subliminalId,
      durationSeconds,
      completed,
    });

    setRecording(false);
    return response;
  }, []);

  return { record, recording };
}
