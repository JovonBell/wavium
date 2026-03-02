# WAVIUM

> "You're not just opening an app. You're entering a portal where reality dissolves, Mindi awaits, and your mind begins to heal."

**AI-Powered Subliminal Audio Creator** with an emotional companion that evolves with you.

![React Native](https://img.shields.io/badge/React_Native-Expo_54-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Python](https://img.shields.io/badge/Python-3.11+-yellow)
![License](https://img.shields.io/badge/License-Private-red)

## What Makes Wavium Different

| Feature | Description |
|---------|-------------|
| **THE VOID** | Immersive cosmic player with gyroscope parallax, audio-reactive nebulas, and star fields |
| **MINDI** | Your brain companion — a Skia-rendered character who heals with you and transforms based on your journey |
| **CEREMONIAL ONBOARDING** | 2-3 minute breathing ritual that feels sacred, not transactional |
| **SUBLIMINAL ENGINE** | AI-generated affirmations whispered beneath ambient soundscapes via edge-tts + FFmpeg |
| **TIME-SHIFTING UI** | App transforms with time of day (morning mist → cosmic night) |
| **DAILY STREAKS** | Motivational streak system with tier badges and personalized messaging |

## Tech Stack

### Mobile App (`/wavium`)
- **React Native 0.81 + Expo 54** — Cross-platform (iOS + Android)
- **@shopify/react-native-skia** — GPU-accelerated graphics for Mindi character
- **react-native-reanimated** — Smooth 60fps animations
- **Zustand + Jotai** — State management
- **expo-av** — Two-stream audio playback (independent voice + background with real-time volume control)
- **expo-haptics** — Immersive haptic feedback
- **expo-sensors** — Gyroscope parallax in THE VOID

### Backend (`/backend`)
- **FastAPI** — Python async API
- **Groq (Llama 3.1 70B)** — AI affirmation generation
- **edge-tts** — Free text-to-speech (300+ voices)
- **FFmpeg** — Audio mixing and ambient track generation
- **Supabase** — Authentication (email/password, session persistence)
- **Cloudflare R2** — Audio file storage (planned)

## Project Structure

```
wavium/
├── backend/                    # FastAPI server
│   ├── main.py                 # API routes and models
│   ├── services/
│   │   ├── groq_service.py     # AI affirmation generation
│   │   └── tts_service.py      # TTS + FFmpeg audio mixing
│   ├── ambient/                # Generated ambient tracks (5 tracks)
│   ├── audio_output/           # Generated user audio files
│   └── requirements.txt
├── wavium/                     # Expo React Native app
│   ├── app/
│   │   ├── (auth)/             # Auth screens (sign-in, sign-up, forgot-password)
│   │   ├── (onboarding)/       # Ceremonial flow (breath, intention, mindi-birth)
│   │   ├── (main)/             # Main tabs (home, tracks, create, script)
│   │   └── player/             # THE VOID player
│   └── src/
│       ├── components/
│       │   ├── mindi/          # Mindi character system (Skia renderer, eyes, glow, particles, speech)
│       │   ├── void/           # Player experience (nebula, star field, parallax, controls, affirmation spirals)
│       │   ├── ui/             # Shared UI (glassmorphic cards, streak card, time-shifting background, haptic buttons)
│       │   └── ceremony/       # Onboarding ceremony components
│       ├── lib/                # Supabase client config
│       ├── services/           # API client + speech service
│       ├── stores/             # Zustand stores (auth, mindi state, theme)
│       ├── systems/            # Audio, haptic, and offline systems
│       └── theme/              # Design system (typography, spacing)
├── WAVIUM-PRD.md               # Product requirements document
└── WAVIUM-MINDI-SPEC.md        # Mindi character specification
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- FFmpeg (`brew install ffmpeg` on macOS)
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env      # Fill in your GROQ_API_KEY
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile App Setup
```bash
cd wavium
npm install
npx expo start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/generate-affirmations` | Generate AI affirmations from an intention |
| `POST` | `/api/generate-audio` | Generate voice-only TTS audio |
| `POST` | `/api/generate-subliminal` | Generate full subliminal (voice + ambient mix) |
| `GET` | `/api/ambient-tracks` | List available ambient background tracks |
| `GET` | `/api/voices` | Get available TTS voices |

## Ambient Tracks

Ten ambient tracks served from the backend (all 5min/128kbps):

| Track | Vibe |
|-------|------|
| Ocean Waves | Calm, grounding |
| Rainfall | Peaceful, natural |
| Deep Focus | Binaural, concentration |
| Cosmic Drift | Spacey, meditative |
| Lofi Chill | Lo-fi hip-hop, relaxed |
| Lofi Dream | Dreamy lo-fi, soft |
| Lofi Jazz | Jazz-infused lo-fi |
| Forest Dawn | Birds, morning forest |
| Night Drive | Synthwave, nocturnal |
| Zen Garden | Peaceful, eastern |

## Environment Variables

### Backend (`backend/.env`)
```env
ENVIRONMENT=development
GROQ_API_KEY=your_groq_key
```

### Mobile App (`wavium/.env`)
```env
EXPO_PUBLIC_GROQ_API_KEY=your_groq_key
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Mindi Evolution Paths

| Path | Mindi Form | Dominant Color |
|------|------------|----------------|
| Confidence | Warrior Mindi | Warm orange/red |
| Wealth | Abundance Mindi | Gold/amber |
| Love | Heart Mindi | Rose/pink |
| Focus | Zen Mindi | Silver/blue |
| Sleep | Dream Mindi | Purple/starlit |
| Health | Vitality Mindi | Green/teal |
| Creativity | Muse Mindi | Rainbow/iridescent |
| Spirituality | Cosmic Mindi | Deep violet |
| Career | Achiever Mindi | Royal blue |
| Social | Connector Mindi | Warm yellow |

## Feature Status

### Core
- [x] Project scaffolding (Expo + FastAPI)
- [x] Time-shifting background themes
- [x] Tab navigation (home, tracks, create, script)
- [x] Ceremonial onboarding flow (breath, intention, mindi birth)
- [ ] Constellation star map library

### Audio Pipeline
- [x] AI affirmation generation (Groq/Llama 3.1 70B)
- [x] Text-to-speech via edge-tts (300+ voices)
- [x] FFmpeg subliminal mixing (voice under ambient)
- [x] Two-stream architecture (independent background + voice with real-time volume)
- [x] CrossfadeAudioPair — seamless looping with 3s crossfade
- [x] 5 selectable TTS voices (Ava, Emma, Andrew, Sonia, Brian)
- [x] 10 ambient background tracks (3 lofi, 4 ambient, 3 nature)
- [x] Home ambient music player
- [x] Frontend API service wired to backend
- [ ] User audio uploads
- [ ] Offline downloads

### Mindi
- [x] Skia-rendered character (renderer, eyes, glow, particles)
- [x] Speech bubble system
- [x] Idle breathing animation
- [x] Audio-reactive glow pulsing
- [x] Eye touch tracking
- [x] Per-screen entrance animations
- [ ] 5 evolution stages
- [ ] 10 transformation paths

### THE VOID Player
- [x] Nebula renderer
- [x] Star field (memoized, no flickering)
- [x] Gyroscope parallax layers
- [x] Auto-hide controls (tap to reveal)
- [x] One-at-a-time affirmation display with glow
- [x] Glassmorphic player controls
- [x] Minimal gold gradient progress bar
- [x] Mood tint per ambient track
- [x] Shooting stars + vignette
- [x] Session celebration on completion
- [x] Audio position sync

### Authentication
- [x] Supabase email/password auth (sign up, sign in, forgot password)
- [x] Session persistence across app restarts (AsyncStorage)
- [x] Three-state route guard (auth -> onboarding -> main)
- [x] Logout with confirmation
- [x] userName stored in Supabase user_metadata

### UI/UX Polish
- [x] Gold gradient palette (replaces flat orange)
- [x] Custom typography (Cinzel, Cormorant Garamond, Raleway)
- [x] Real glassmorphism (backdrop blur + layered depth)
- [x] Breathing/glowing CTA buttons
- [x] Staggered entrance animations on all screens
- [x] Floating glass tab bar
- [x] Micro-interactions on all touch targets
- [x] Consistent spacing system

### Engagement
- [x] Daily streak system with tier badges
- [x] Motivational messaging based on streak length
- [ ] Push notifications

---

Built with intention.
