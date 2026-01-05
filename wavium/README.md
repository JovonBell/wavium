# 🧠 WAVIUM

> "You're not just opening an app. You're entering a portal where reality dissolves, Mindi awaits, and your mind begins to heal."

**AI-Powered Subliminal Audio Creator** with an emotional companion that evolves with you.

![React Native](https://img.shields.io/badge/React_Native-Expo-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)
![License](https://img.shields.io/badge/License-Private-red)

## ✨ What Makes Wavium Different

| Feature | Description |
|---------|-------------|
| **THE VOID** | Immersive cosmic player with gyroscope parallax and audio-reactive nebulas |
| **MINDI** | Your brain companion who heals with you and fully transforms based on your journey |
| **CEREMONIAL ONBOARDING** | 2-3 minute breathing ritual that feels sacred, not transactional |
| **CONSTELLATION LIBRARY** | Your subliminals are stars in a zoomable cosmic map |
| **TIME-SHIFTING UI** | App transforms with time of day (morning mist → cosmic night) |

## 🛠️ Tech Stack

### Mobile App
- **React Native + Expo** - Cross-platform (iOS + Android)
- **@shopify/react-native-skia** - GPU-accelerated graphics for Mindi
- **react-native-reanimated** - Smooth 60fps animations
- **Zustand + Jotai** - State management
- **expo-av** - Audio playback
- **expo-haptics** - Immersive haptic feedback

### Backend
- **FastAPI** - Python async API
- **Groq** - LLM for affirmation generation (Llama 3.1 70B)
- **edge-tts** - FREE text-to-speech (300+ voices)
- **FFmpeg** - Audio processing
- **Supabase** - Database + Auth
- **Cloudflare R2** - Audio file storage

## 📁 Project Structure

```
wavium/
├── app/                    # Expo Router screens
│   ├── (onboarding)/       # Ceremonial flow
│   ├── (main)/             # Main app tabs
│   └── player/             # THE VOID
├── src/
│   ├── components/         # React components
│   │   ├── mindi/          # Mindi character system
│   │   ├── void/           # Player experience
│   │   └── constellation/  # Star map library
│   ├── stores/             # Zustand stores
│   ├── theme/              # Design system
│   └── api/                # Backend communication
├── backend/                # FastAPI server
│   └── app/
│       ├── api/routes/     # API endpoints
│       └── services/       # Business logic
└── assets/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- FFmpeg (for audio processing)
- Expo CLI

### Mobile App Setup
```bash
cd wavium
npm install
npx expo start
```

### Backend Setup
```bash
cd wavium/backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env  # Then fill in your API keys
uvicorn app.main:app --reload
```

## 🔑 Environment Variables

### Backend (.env)
```env
ENVIRONMENT=development
GROQ_API_KEY=your_groq_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
R2_ENDPOINT=your_r2_endpoint
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
R2_BUCKET=wavium-audio
R2_PUBLIC_URL=your_r2_public_url
```

## 🎨 Mindi Evolution Paths

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

## 📱 Features

### Core
- [x] Project setup
- [ ] Ceremonial onboarding
- [ ] AI chat for affirmations
- [ ] THE VOID player
- [ ] Constellation library
- [ ] Time-shifting themes

### Mindi
- [ ] Code-generated character with Skia
- [ ] 6 animation states
- [ ] 5 evolution stages
- [ ] 10 transformation paths

### Audio
- [ ] 300+ TTS voices
- [ ] 3 subliminal techniques
- [ ] Curated backgrounds
- [ ] User uploads
- [ ] Offline downloads

---

Built with 💜 and a lot of ambition.
