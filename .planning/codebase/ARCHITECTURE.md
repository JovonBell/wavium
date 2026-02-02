# Architecture

**Analysis Date:** 2026-02-02

## Pattern Overview

**Overall:** Layered Full-Stack Architecture with Separation of Concerns

**Key Characteristics:**
- Frontend: React Native (Expo) with client-side state management via Zustand
- Backend: FastAPI with modular route-based organization
- Real-time Communication: WebSocket for audio generation progress streaming
- Audio Pipeline: Multi-stage processing (Intent → Affirmations → TTS → Mix → Upload)
- State Management: Zustand with AsyncStorage persistence on mobile

## Layers

**Presentation Layer (React Native Frontend):**
- Purpose: User interface, animations, input collection, audio playback
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\app\` (Expo Router), `C:\Users\jbell4\Downloads\Wavium\wavium\src\components\`
- Contains: Screen components (Home, Create, Script, Player), UI components (buttons, cards, animations), visual effects (Mindi renderer, particle systems)
- Depends on: State stores (Zustand), API client, systems (Audio, Haptic)
- Used by: End users via React Native app

**State Management Layer (Zustand):**
- Purpose: Local app state persistence across sessions
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\src\stores\`
- Contains: `useMindiStore.ts` (identity, creation flow, subliminal library), `useThemeStore.ts` (theme/time-of-day settings)
- Depends on: AsyncStorage for persistence
- Used by: All components and screens

**API Client Layer:**
- Purpose: HTTP/WebSocket communication with backend
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\src\api\`
- Contains: `client.ts` (request handling, API methods), `hooks.ts` (React hooks for API calls with state management)
- Depends on: Fetch API, WebSocket API
- Used by: Components via hooks

**Systems Layer (Utility Systems):**
- Purpose: Encapsulated functionality for audio, haptics, offline handling
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\src\systems\`
- Contains: `AudioSystem.ts` (playback, volume, seeking, fade-out), `HapticSystem.ts`, `OfflineSystem.ts`
- Depends on: Expo modules (expo-av for audio)
- Used by: Player screens and components

**Backend API Layer (FastAPI):**
- Purpose: Request routing and API organization
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\main.py`
- Contains: Route registration, WebSocket handler, CORS middleware
- Depends on: Router modules from `app/api/routes/`
- Used by: Frontend via HTTP/WebSocket

**Route/Handler Layer:**
- Purpose: Specific endpoint logic organized by domain
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\routes\`
- Contains:
  - `intentions.py`: Intention processing to generate affirmations
  - `generation.py`: Voice/background options
  - `library.py`: Saved subliminals management
  - `sessions.py`: Listening history and stats
  - `evolution.py`: Mindi state progression
- Depends on: Services (AudioPipeline)
- Used by: Main app router

**Services Layer (Business Logic):**
- Purpose: Core audio processing and AI integration
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\services\`
- Contains: `audio_pipeline.py` (complete generation workflow)
- Depends on: External APIs (Groq LLM, edge-tts, Cloudflare R2, Supabase)
- Used by: Route handlers

**Configuration Layer:**
- Purpose: Environment-based settings
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\core\config.py`
- Contains: Settings from environment variables (API keys, database URLs, audio paths)
- Depends on: .env file
- Used by: Services and main app

## Data Flow

**Subliminal Creation Flow:**

1. User enters intention on Create screen (`C:\Users\jbell4\Downloads\Wavium\wavium\app\(main)\create.tsx`)
2. Frontend calls `groqGenerateAffirmations()` from `C:\Users\jbell4\Downloads\Wavium\wavium\src\services\groq.ts` (direct Groq API call)
3. Affirmations saved to Zustand store via `setAffirmations()`
4. User reviews on Script screen (`C:\Users\jbell4\Downloads\Wavium\wavium\app\(main)\script.tsx`)
5. User selects track and other options
6. WebSocket connection opens to `/ws/generate` endpoint
7. Backend `AudioPipeline.generate_subliminal()` processes stages with progress updates sent via WebSocket
8. Final audio uploaded to Cloudflare R2
9. Audio URL returned and saved to Zustand library
10. User navigates to Player screen to play audio

**State Persistence Flow:**

- Zustand store persists to AsyncStorage on every state change
- On app launch, `_layout.tsx` waits for `useMindiStore.persist.hasHydrated()` before rendering
- Route guard in root layout redirects to onboarding if `userId` is null

**Audio Playback Flow:**

1. Player screen loads with audio URL
2. `useAudio()` hook from `AudioSystem.ts` initializes playback
3. expo-av `Audio.Sound` loads URI and provides status updates
4. Playback controls (play, pause, seek, volume) manipulated via `AudioSystem` methods
5. Simulated audio levels (bass/mid/high) sent to visualizers

## Key Abstractions

**AudioPipeline:**
- Purpose: Encapsulates entire audio generation workflow
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\services\audio_pipeline.py`
- Pattern: Class-based with async stages (generate affirmations, TTS, subliminal track, mix, upload)
- Stages communicate via intermediate file paths
- Progress updates sent via optional WebSocket parameter

**AudioSystem:**
- Purpose: Wrapper around expo-av with playback and visualization
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\src\systems\AudioSystem.ts`
- Pattern: Singleton class with callback registration for status/levels
- Provides React hook (`useAudio()`) for component integration
- Simulates frequency levels since expo-av lacks real analysis

**Zustand Stores:**
- Purpose: Persistent state with hooks interface
- Pattern: `create()` with persist middleware
- Examples: `useMindiStore` (user identity, creation flow), `useThemeStore` (time-based theming)
- Persisted to AsyncStorage automatically

**API Client:**
- Purpose: Centralized backend communication
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\src\api\client.ts`
- Pattern: Singleton class with typed methods for each endpoint
- Handles timeouts (30s), error responses, user ID headers
- WebSocket support for streaming generation progress

## Entry Points

**Mobile App Entry Point:**
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\app\_layout.tsx`
- Triggers: App startup (Expo Router)
- Responsibilities: Initialize theme, wait for Zustand hydration, render splash screen, route to onboarding or main app

**Backend Entry Point:**
- Location: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\main.py`
- Triggers: `uvicorn` server startup
- Responsibilities: Create FastAPI app, register CORS middleware, include all routers, setup WebSocket handler

**Screen Entry Points:**
- `C:\Users\jbell4\Downloads\Wavium\wavium\app\(onboarding)\index.tsx`: Initial onboarding flow
- `C:\Users\jbell4\Downloads\Wavium\wavium\app\(main)\home.tsx`: Main home screen with library
- `C:\Users\jbell4\Downloads\Wavium\wavium\app\(main)\create.tsx`: Intention input and generation
- `C:\Users\jbell4\Downloads\Wavium\wavium\app\player\[id].tsx`: Audio playback for specific subliminal

## Error Handling

**Strategy:** Try-catch with user-facing alerts and fallback UI

**Patterns:**

Frontend:
- API failures: Show Alert with retry option, log to console
- Audio loading errors: Display empty state, offer creation flow
- Generation timeout: WebSocket error triggers loading overlay dismiss
- Validation: Check string length, required fields before API calls

Backend:
- Missing env vars: Crashes on startup (fail-fast)
- API call failures (Groq, edge-tts): HTTPException with 500 status
- File I/O errors: Caught and logged, cleanup attempted
- WebSocket disconnects: Caught gracefully, no error response needed

## Cross-Cutting Concerns

**Logging:** Python `logging` module on backend; console.log on frontend

**Validation:** Pydantic BaseModel for request validation on backend; string length checks on frontend

**Authentication:** User ID tracked in Zustand and sent via X-User-ID header; no OAuth currently

**Rate Limiting:** Configuration present in `app/core/config.py` (RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW) but not enforced in code

**Caching:** AsyncStorage for Zustand persistence; no HTTP caching headers

---

*Architecture analysis: 2026-02-02*
