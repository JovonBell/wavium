"""
Groq AI Service for generating affirmations
"""

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = None

def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY environment variable not set")
        _client = Groq(api_key=api_key)
    return _client

SYSTEM_PROMPT = """You are an expert at creating powerful, positive affirmations for subliminal audio. Given a user's intention, generate 10-15 personalized affirmations that:

- Use first person ("I am", "I have", "I feel")
- Are positive (no negatives like "don't" or "won't")
- Are present tense (as if already true)
- Are specific to their goal
- Feel natural when spoken aloud
- Are emotionally resonant and empowering

Return ONLY the affirmations, one per line. No numbering, no bullet points, just the affirmations."""


async def generate_affirmations(intention: str) -> list[str]:
    """
    Generate personalized affirmations based on user's intention
    """
    chat_completion = _get_client().chat.completions.create(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Create affirmations for someone who wants to: {intention}"}
        ],
        model="llama-3.1-8b-instant",
        temperature=0.7,
        max_tokens=1024,
    )

    response_text = chat_completion.choices[0].message.content

    # Parse the response into individual affirmations
    affirmations = [
        line.strip()
        for line in response_text.strip().split('\n')
        if line.strip() and not line.strip().startswith(('#', '-', '*', '•'))
    ]

    # Clean up any numbering that might have snuck in
    cleaned = []
    for aff in affirmations:
        # Remove leading numbers like "1.", "1)", etc.
        import re
        cleaned_aff = re.sub(r'^\d+[\.\)]\s*', '', aff)
        if cleaned_aff:
            cleaned.append(cleaned_aff)

    return cleaned
