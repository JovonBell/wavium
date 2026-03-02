# External Integrations

**Analysis Date:** 2026-02-02

## APIs & External Services

**AI & Language:**
- Groq LLM API - Affirmation generation using Llama 3.1 8B model
  - SDK/Client: `groq` package 0.4.2
  - Auth: `GROQ_API_KEY` environment variable
  - Implementation: `backend/services/groq_service.py`
  - Endpoint: Chat completions API
  - Model: `llama-3.1-8b-instant`

**Text-to-Speech:**
- Microsoft Edge TTS (via edge-tts) - Audio generation for affirmations
  - SDK/Client: `edge-tts` package 6.1.9
  - Auth: None required (uses public Microsoft TTS service)
  - Implementation: `backend/services/tts_service.py`
  - Voices available: 4 voice presets (Jenny, Guy, Aria, Sonia)
  - Output: MP3 files stored locally in `backend/audio_output/`

**Frontend API Client:**
- Custom HTTP client in `wavium/src/api/client.ts`
  - Base URL: `http://{DEV_MACHINE_IP}:8000` (dev), `https://api.wavium.app` (prod)
  - Timeout: 30 seconds
  - Includes user ID header tracking

## Data Storage

**Databases:**
- Supabase (PostgreSQL) - Mentioned in README but NOT actively integrated in current code
  - Connection: `SUPABASE_URL`, `SUPABASE_KEY` env vars (referenced but unused)
  - Status: Planned/not yet implemented in backend services

**File Storage:**
- Local filesystem - Audio files stored in `backend/audio_output/` directory
  - FastAPI serves via mounted static files at `/audio` endpoint
  - Cloudflare R2 (S3-compatible) - Mentioned in README for production deployment
    - Env vars: `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`
    - Status: Configured but not implemented in current backend code

**Client-Side Storage:**
- AsyncStorage - Persistent local state via `@react-native-async-storage/async-storage`
  - Implementation: Zustand persist middleware in `wavium/src/stores/useMindiStore.ts`
  - Storage key: `wavium-store`
  - Stored data: User name, subliminals library, creation state

**Caching:**
- None currently implemented (MMKV available but not actively used)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Referenced in README but NOT implemented in current code
  - Expected flow: OAuth/JWT via Supabase

**Current Implementation:**
- Custom user ID tracking
  - Generated/managed client-side in store
  - Passed as `X-User-ID` header to API
  - No authentication layer enforced on backend

**Sessions:**
- Backend endpoints exist for session tracking:
  - `POST /api/sessions` - Record listening session
  - `GET /api/sessions/stats` - Retrieve session statistics

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, LogRocket, or similar integration)

**Logs:**
- Console logging only
  - `console.error()` in client for WebSocket errors
  - FastAPI default logging (no custom configuration detected)

**Health Checks:**
- `GET /health` endpoint in `backend/main.py` returns `{"status": "healthy"}`
- `api.healthCheck()` available in client

## CI/CD & Deployment

**Hosting:**
- Frontend: Expo (can deploy to Apple TestFlight, Google Play, or Expo)
- Backend: Not yet deployed (runs locally via uvicorn in development)

**CI Pipeline:**
- None detected (no GitHub Actions, Jenkins, or similar configuration)

**Deployment Scripts:**
- Backend: Manual via `uvicorn main:app --reload` for development
- Frontend: Via Expo CLI (`npx expo start`, `npx expo android`, `npx expo ios`, `npx expo web`)

## Environment Configuration

**Required env vars:**

**Backend (`backend/.env`):**
- `GROQ_API_KEY` - Groq API key (REQUIRED for affirmation generation)
- `SUPABASE_URL` - Supabase project URL (planned, not yet used)
- `SUPABASE_KEY` - Supabase API key (planned, not yet used)
- `R2_ENDPOINT` - Cloudflare R2 endpoint (planned, not yet used)
- `R2_ACCESS_KEY` - R2 access key (planned, not yet used)
- `R2_SECRET_KEY` - R2 secret key (planned, not yet used)
- `R2_BUCKET` - R2 bucket name (planned, not yet used)
- `R2_PUBLIC_URL` - R2 public URL for audio files (planned, not yet used)

**Frontend (hardcoded):**
- `DEV_MACHINE_IP` - Set to `172.16.225.29` in `wavium/src/api/client.ts` for development
  - Should be moved to environment-specific config

**Secrets location:**
- Backend: `.env` file in `backend/` directory (git-ignored)
- Frontend: Hardcoded values in source (NOT recommended for production)

## Webhooks & Callbacks

**Incoming:**
- None detected (no webhook endpoints implemented)

**Outgoing:**
- WebSocket connection: `ws://host:8000/ws/generate` (referenced in client but endpoint not implemented in backend)
  - Purpose: Real-time progress updates during audio generation
  - Status: Client code exists, backend implementation missing

## API Endpoints (Current Implementation)

**Implemented:**
- `GET /` - Health check
- `GET /health` - Health status
- `POST /api/generate-affirmations` - Generate affirmations from intention
  - Request: `{ intention: string }`
  - Response: `{ affirmations: string[], intention: string }`
- `POST /api/generate-audio` - Generate audio from affirmations
  - Request: `{ affirmations: string[], voice: string }`
  - Response: `{ audio_url: string, voice: string }`
- `GET /api/voices` - Get available TTS voices
  - Response: `[{ id: string, name: string, description: string }]`
- `GET /audio/{filename}` - Serve audio files (static mount)

**Referenced but NOT implemented:**
- `POST /api/intention` - Process intention
- `GET /api/library` - Get user's subliminal library
- `GET /api/library/{id}` - Get single subliminal
- `POST /api/sessions` - Record listening session
- `GET /api/sessions/stats` - Get session statistics
- `GET /api/evolution/state` - Get Mindi evolution state
- `GET /api/evolution/history` - Get evolution history
- `GET /api/generation/voices` - Get generation voices
- `GET /api/generation/backgrounds` - Get background sounds
- `WS /ws/generate` - WebSocket for real-time generation progress

## CORS Configuration

**Current:**
- Allows all origins: `allow_origins=["*"]`
- Production: Should restrict to specific domain
- Location: `backend/main.py` lines 26-32

---

*Integration audit: 2026-02-02*
