# Wavium Project Context Handoff

**Generated:** 2026-02-02
**Purpose:** Upload this file to your next Claude conversation to restore full project context.

---

## Project Summary

**Wavium** is a subliminal audio app with an AI companion called Mindi. Users describe their intentions, AI generates personalized affirmations, which are mixed with ambient soundscapes and played in an immersive "Void" experience.

**Core Value:** Users can create and listen to personalized subliminal audio that actually works, every single time.

**Current State:** ~60% complete, MVP completion in progress.

**Target Platform:** Android only for MVP.

---

## Tech Stack

### Frontend
- React Native 0.81.5
- Expo 54.0.30
- TypeScript
- Zustand + AsyncStorage (state management)
- expo-av (audio playback)
- react-native-reanimated 4.1.1
- @shopify/react-native-skia 2.2.12

### Backend
- FastAPI (Python)
- Groq (Llama 3.1 70B) for affirmation generation
- edge-tts for text-to-speech
- FFmpeg for audio mixing
- Cloudflare R2 for audio storage

### To Be Added
- Supabase (auth + database)
- Rive (Mindi character animations)

---

## Critical Issues Found

1. **Exposed Groq API key** in git history (needs rotation + BFG cleanup)
2. **No database** - all endpoints return hardcoded placeholders
3. **Missing audio assets** - background sounds don't exist
4. **Hardcoded /tmp path** - fails on Windows
5. **No authentication** - anyone can spoof any user ID

---

## GSD Roadmap (6 Phases, 39 Requirements)

### Phase 1: Security & Foundation
- Rotate Groq API key, remove from git history
- Secure all secrets with env var validation
- Fix cross-platform temp paths
- Add Python __init__.py files
- **Requirements:** SEC-01, SEC-02, AUDIO-02, REL-01

### Phase 2: Supabase Authentication
- User signup with email/password
- Email verification, password reset
- Session persistence across restarts
- JWT validation on all routes
- Production CORS configuration
- **Requirements:** SEC-03 thru SEC-08

### Phase 3: Database Integration
- Supabase schema (subliminals, sessions, mindi_state)
- Library save/view/delete
- Session recording with streak tracking
- Mindi evolution state persistence
- Cross-device sync
- **Requirements:** DB-01 thru DB-09

### Phase 4: Core Flow & Audio
- Complete onboarding screens
- Script review with editing
- Voice & background selection
- Real-time WebSocket progress
- Background audio assets
- Offline download
- Error handling with retry
- **Requirements:** FLOW-01 thru FLOW-08, AUDIO-01, AUDIO-03-05

### Phase 5: Mindi Character Animations
- Rive runtime integration
- 6 emotional states (idle, listening, peaceful, happy, excited, generating)
- State machine transitions
- Particle effects for absorption
- Glow progression
- **Requirements:** MINDI-01 thru MINDI-05

### Phase 6: Reliability & Polish
- Async FFmpeg (non-blocking)
- Rate limiting
- Request validation & timeouts
- Test coverage
- **Requirements:** REL-02 thru REL-06

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Stability before features | Can't build on broken foundation |
| Supabase for persistence | Already in codebase, good DX, free tier |
| Required user accounts | Enables cloud sync, user isolation |
| Rive for Mindi animations | State machines for emotions |
| Android-only MVP | Reduce scope, faster validation |
| Keep edge-tts for now | Free, works; migrate if blocked |

---

## GSD Configuration

```json
{
  "mode": "yolo",
  "depth": "standard",
  "parallelization": true,
  "commit_docs": true,
  "model_profile": "balanced",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}
```

---

## Files Created

| File | Purpose |
|------|---------|
| `.planning/PROJECT.md` | Project context and requirements |
| `.planning/config.json` | GSD workflow preferences |
| `.planning/REQUIREMENTS.md` | 39 v1 requirements with traceability |
| `.planning/ROADMAP.md` | 6-phase roadmap with success criteria |
| `.planning/STATE.md` | Project state and memory |
| `.planning/research/` | Domain research (Stack, Features, Architecture, Pitfalls) |
| `.planning/codebase/` | Codebase analysis (Architecture, Stack, Concerns, etc.) |

---

## Next Steps

Run `/gsd:plan-phase 1` to create detailed execution plan for Phase 1 (Security & Foundation).

Or run `/gsd:progress` to see current status and available actions.

---

## Codebase Structure

```
wavium/
├── app/                      # Expo Router screens
│   ├── (onboarding)/        # Onboarding flow
│   ├── (main)/              # Main app (home, create, script, tracks)
│   └── player/[id].tsx      # THE VOID player
├── src/
│   ├── components/          # UI components
│   │   ├── mindi/           # Mindi character
│   │   ├── void/            # Player experience
│   │   └── ui/              # Design system
│   ├── stores/              # Zustand stores
│   ├── services/            # Groq, speech services
│   ├── systems/             # Audio, haptics, offline
│   ├── api/                 # Backend client
│   └── theme/               # Colors, typography
└── backend/
    └── app/
        ├── main.py          # FastAPI app
        ├── core/config.py   # Settings
        ├── api/routes/      # API endpoints
        └── services/        # Audio pipeline
```

---

*This file contains everything needed to continue work on Wavium. Upload it at the start of your next conversation.*
