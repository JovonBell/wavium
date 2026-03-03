/**
 * WAVIUM - Affirmation Generation Service
 * Calls backend API which proxies to Groq LLM
 */

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://wavium-production.up.railway.app';

export interface GroqResponse {
  affirmations: string[];
  error?: string;
}

export async function generateAffirmations(intention: string, userName?: string): Promise<GroqResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/affirmations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intention,
        ...(userName ? { user_name: userName } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        affirmations: getDefaultAffirmations(),
        error: errorData.detail || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.affirmations && data.affirmations.length > 0) {
      return { affirmations: data.affirmations, error: data.error };
    }

    return {
      affirmations: getDefaultAffirmations(),
      error: data.error,
    };
  } catch (error) {
    return {
      affirmations: getDefaultAffirmations(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Fallback affirmations if backend is unreachable
function getDefaultAffirmations(): string[] {
  return [
    'I am becoming exactly who I want to be.',
    'Every day, I move closer to my goals.',
    'I am worthy of success and happiness.',
    'My potential is unlimited.',
    'I radiate confidence and inner peace.',
    'I attract positive opportunities into my life.',
    'I believe in myself completely.',
  ];
}
