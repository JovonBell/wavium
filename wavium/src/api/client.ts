/**
 * WAVIUM - API Client
 * Backend communication layer
 */

// API Configuration — single source of truth for backend URL
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://wavium-production.up.railway.app';

const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

// Request timeout
const TIMEOUT = 30000;

// Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface GenerationProgress {
  type: 'progress' | 'complete' | 'error';
  message?: string;
  percent?: number;
  audioUrl?: string;
  affirmations?: string[];
}

// API Client class
class WaviumApiClient {
  private baseUrl: string;
  private wsUrl: string;
  private userId: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.wsUrl = WS_BASE_URL;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.userId && { 'X-User-ID': this.userId }),
      ...options.headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.detail || 'Request failed',
          status: response.status,
        };
      }

      return {
        data,
        error: null,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { data: null, error: 'Request timeout', status: 0 };
        }
        return { data: null, error: error.message, status: 0 };
      }
      return { data: null, error: 'Unknown error', status: 0 };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    const response = await this.request<{ status: string }>('/health');
    return response.data?.status === 'healthy';
  }

  // Intentions API
  async processIntention(intention: string): Promise<ApiResponse<{
    affirmations: string[];
    title: string;
    category: string;
  }>> {
    return this.request('/api/intention', {
      method: 'POST',
      body: JSON.stringify({ intention }),
    });
  }

  // Generate Affirmations with Groq AI
  async generateAffirmations(intention: string): Promise<ApiResponse<{
    affirmations: string[];
    intention: string;
  }>> {
    return this.request('/api/generate-affirmations', {
      method: 'POST',
      body: JSON.stringify({ intention }),
    });
  }

  // Generate Audio with edge-tts
  async generateAudio(affirmations: string[], voice: string = 'jenny'): Promise<ApiResponse<{
    audio_url: string;
    voice: string;
  }>> {
    return this.request('/api/generate-audio', {
      method: 'POST',
      body: JSON.stringify({ affirmations, voice }),
    });
  }

  // Get audio file URL
  getAudioUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  // Generation API (WebSocket for real-time progress)
  generateSubliminal(params: {
    intention: string;
    voice: string;
    background: string;
    duration: number;
    technique: string;
  }): {
    onProgress: (callback: (progress: GenerationProgress) => void) => void;
    cancel: () => void;
  } {
    const ws = new WebSocket(`${this.wsUrl}/ws/generate`);
    let progressCallback: ((progress: GenerationProgress) => void) | null = null;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        ...params,
        user_id: this.userId,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        progressCallback?.(data);
      } catch (e) {
        console.error('WebSocket message parse error:', e);
      }
    };

    ws.onerror = (error) => {
      progressCallback?.({
        type: 'error',
        message: 'Connection error',
      });
    };

    ws.onclose = () => {
      // Connection closed
    };

    return {
      onProgress: (callback) => {
        progressCallback = callback;
      },
      cancel: () => {
        ws.close();
      },
    };
  }

  // Library API
  async getLibrary(): Promise<ApiResponse<{
    subliminals: Array<{
      id: string;
      title: string;
      category: string;
      audio_url: string;
      duration: number;
      created_at: string;
      listen_count: number;
      affirmations: string[];
    }>;
  }>> {
    return this.request('/api/library');
  }

  async getSubliminal(id: string): Promise<ApiResponse<{
    id: string;
    title: string;
    category: string;
    audio_url: string;
    duration: number;
    affirmations: string[];
    background: string;
    voice: string;
    technique: string;
  }>> {
    return this.request(`/api/library/${id}`);
  }

  // Sessions API
  async recordSession(data: {
    subliminalId: string;
    durationSeconds: number;
    completed: boolean;
  }): Promise<ApiResponse<{
    id: string;
    xp_earned: number;
    new_glow_level: number;
    streak_updated: boolean;
    new_streak: number;
  }>> {
    return this.request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        subliminal_id: data.subliminalId,
        duration_seconds: data.durationSeconds,
        completed: data.completed,
      }),
    });
  }

  async getSessionStats(): Promise<ApiResponse<{
    total_sessions: number;
    total_listening_minutes: number;
    current_streak: number;
    longest_streak: number;
    sessions_today: number;
    favorite_category: string | null;
  }>> {
    return this.request('/api/sessions/stats');
  }

  // Evolution API
  async getMindiState(): Promise<ApiResponse<{
    glow_level: number;
    evolution_stage: number;
    evolution_path: string | null;
    total_xp: number;
    current_streak: number;
    longest_streak: number;
    total_listening_minutes: number;
    category_minutes: Record<string, number>;
    last_session_at: string | null;
  }>> {
    return this.request('/api/evolution/state');
  }

  async getEvolutionHistory(limit = 10): Promise<ApiResponse<{
    events: Array<{
      event_type: string;
      old_value: string;
      new_value: string;
      occurred_at: string;
    }>;
  }>> {
    return this.request(`/api/evolution/history?limit=${limit}`);
  }

  // Voices API
  async getVoices(): Promise<ApiResponse<{
    voices: Array<{
      id: string;
      name: string;
      gender: string;
      language: string;
      preview_url?: string;
    }>;
  }>> {
    return this.request('/api/generation/voices');
  }

  // Backgrounds API
  async getBackgrounds(): Promise<ApiResponse<{
    backgrounds: Array<{
      id: string;
      name: string;
      category: string;
      preview_url?: string;
    }>;
  }>> {
    return this.request('/api/generation/backgrounds');
  }
}

// Export singleton instance
export const api = new WaviumApiClient();

// Export types
export type { WaviumApiClient };
