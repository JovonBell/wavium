# Wavium

## What This Is

Wavium is a subliminal audio app with an AI companion called Mindi. Users describe their intentions, AI generates personalized affirmations, which are mixed with ambient soundscapes and played in an immersive "Void" experience. The app focuses on personal growth through subliminal messaging, with Mindi evolving alongside the user's practice.

## Core Value

**Users can create and listen to personalized subliminal audio that actually works, every single time.** If the audio generation fails, the app is useless. Reliability is non-negotiable.

## Requirements

### Validated

*Existing capabilities from current codebase:*

- ✓ Audio generation pipeline (intention → Groq AI → affirmations → edge-tts → FFmpeg mix) — existing
- ✓ React Native Expo app structure with Expo Router navigation — existing
- ✓ FastAPI backend with WebSocket progress streaming — existing
- ✓ Zustand state management with AsyncStorage persistence — existing
- ✓ Create screen for intention input — existing
- ✓ Home screen with library display — existing
- ✓ Player screen with basic playback controls — existing
- ✓ Mindi character component (basic renderer) — existing
- ✓ Theme system with time-of-day colors — existing
- ✓ Haptic feedback integration — existing
- ✓ API client with typed methods — existing

### Active

*MVP completion requirements:*

**Security & Stability**
- [ ] SEC-01: Rotate exposed Groq API key and secure all secrets
- [ ] SEC-02: Implement Supabase authentication with required sign-up
- [ ] SEC-03: Add JWT validation middleware to all backend routes
- [ ] SEC-04: Configure CORS for production (not wildcard *)
- [ ] SEC-05: Sanitize error messages sent to clients

**Database Integration**
- [ ] DB-01: Create Supabase schema (users, subliminals, sessions, mindi_state)
- [ ] DB-02: Implement library endpoint with actual database queries
- [ ] DB-03: Implement sessions endpoint for listening history
- [ ] DB-04: Implement evolution endpoint for Mindi progression
- [ ] DB-05: Sync local Zustand state with Supabase

**Core Flow Completion**
- [ ] FLOW-01: Complete onboarding screens (name Mindi, set intention, education)
- [ ] FLOW-02: Complete script review screen (view/edit affirmations)
- [ ] FLOW-03: Complete tracks selection screen (voice + background picker)
- [ ] FLOW-04: Wire frontend to use backend API (not direct Groq calls)
- [ ] FLOW-05: Implement end-to-end generation via WebSocket

**Assets & Audio**
- [ ] AUDIO-01: Add background audio files (ocean, rain, forest, campfire, space, silence)
- [ ] AUDIO-02: Fix cross-platform temp directory path (not hardcoded /tmp)
- [ ] AUDIO-03: Implement audio download for offline playback
- [ ] AUDIO-04: Add proper audio error handling with user feedback

**Mindi Character**
- [ ] MINDI-01: Create Rive animation file with emotional states (idle, listening, peaceful, happy, excited, generating)
- [ ] MINDI-02: Integrate Rive runtime in React Native
- [ ] MINDI-03: Implement state machine transitions based on app events
- [ ] MINDI-04: Add particle effects for affirmation absorption
- [ ] MINDI-05: Implement glow progression based on sessions

**Reliability**
- [ ] REL-01: Add Python __init__.py files for proper module imports
- [ ] REL-02: Wrap FFmpeg calls with asyncio for non-blocking execution
- [ ] REL-03: Implement rate limiting on generation endpoints
- [ ] REL-04: Add request validation and timeout handling
- [ ] REL-05: Add basic test coverage for audio pipeline

### Out of Scope

- iOS support — Android-only for MVP, iOS after validation
- Web support — Mobile-first, web later
- OAuth login (Google, Apple) — Email/password sufficient for MVP
- Real-time chat/social features — Solo experience for now
- Custom voice upload — Use preset voices only
- Subscription/payments — Free during MVP validation
- Analytics/telemetry — Add after core is stable
- Push notifications — Add after user accounts work
- Multi-language support — English only for MVP

## Context

**Codebase State:**
- ~60% complete with solid architectural foundations
- Frontend structure is clean (Expo Router, Zustand, Reanimated)
- Backend pipeline is well-designed but incomplete
- Critical gaps: no database integration, missing assets, security holes

**Technical Environment:**
- Frontend: React Native 0.81.5, Expo 54.0.30, TypeScript
- Backend: FastAPI, Python, edge-tts, FFmpeg
- Database: Supabase (PostgreSQL) — credentials not yet configured
- Storage: Cloudflare R2 — credentials not yet configured
- AI: Groq (Llama 3.1 70B) for affirmation generation

**Key Issues Identified:**
- Groq API key exposed in git history (needs rotation)
- All database endpoints return hardcoded placeholders
- Background audio files don't exist (mixing fails silently)
- `/tmp/wavium` path hardcoded (fails on Windows)
- No authentication — any client can spoof any user ID
- Rate limiting configured but not enforced

## Constraints

- **Platform**: Android only for MVP — reduces testing surface, faster iteration
- **Animation**: Rive for Mindi — better state machine support than Lottie for interactive characters
- **Database**: Supabase — already referenced in codebase, good free tier
- **Auth**: Required accounts — users must sign up before using (enables data sync)
- **TTS**: edge-tts for now — free but risky (unofficial API), may need to migrate later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stability before features | Can't build on broken foundation | — Pending |
| Supabase for persistence | Already in codebase, good DX, free tier | — Pending |
| Required user accounts | Enables cloud sync, user isolation | — Pending |
| Rive for Mindi animations | State machines for emotions, better than static PNGs | — Pending |
| Android-only MVP | Reduce scope, faster validation | — Pending |
| Keep edge-tts for now | Free, works; migrate to paid TTS if blocked | — Pending |

---
*Last updated: 2026-02-02 after initialization*
