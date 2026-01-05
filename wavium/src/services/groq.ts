/**
 * WAVIUM - Groq AI Service
 * Direct API calls to Groq for affirmation generation
 */

// Set your Groq API key here or use environment variable
// Get your key at: https://console.groq.com/keys
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || 'YOUR_GROQ_API_KEY';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are an expert at creating powerful, personalized subliminal affirmations.
Your affirmations should be:
- Written in first person ("I am", "I have", "I attract")
- Positive and present tense (as if already achieved)
- Specific to the user's intention
- Emotionally resonant and believable
- Between 5-10 words each

Generate 7 unique affirmations based on the user's intention.
Return ONLY the affirmations, one per line, no numbering or extra text.`;

export interface GroqResponse {
  affirmations: string[];
  error?: string;
}

export async function generateAffirmations(intention: string): Promise<GroqResponse> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Create powerful affirmations for someone who wants to: ${intention}` }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      return {
        affirmations: [],
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse affirmations from response
    const affirmations = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+\./))
      .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
      .filter((line: string) => line.length > 5);

    if (affirmations.length === 0) {
      return {
        affirmations: getDefaultAffirmations(intention),
        error: undefined
      };
    }

    return { affirmations, error: undefined };
  } catch (error) {
    console.error('Groq service error:', error);
    return {
      affirmations: getDefaultAffirmations(intention),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Fallback affirmations if API fails
function getDefaultAffirmations(intention: string): string[] {
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
