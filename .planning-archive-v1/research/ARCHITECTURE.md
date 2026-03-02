# Architecture Integration Patterns

**Project:** Wavium Subliminal Audio App
**Researched:** 2026-02-02
**Confidence:** HIGH

## Executive Summary

Integrating authentication, database, and character animations into an existing React Native + FastAPI architecture requires careful attention to authentication flow, state synchronization, and animation event binding. This document provides production-ready patterns for:

1. **Supabase JWT authentication** through FastAPI middleware
2. **Zustand + Supabase sync** for offline-first data persistence
3. **Rive state machine integration** for emotion-driven character animations
4. **Offline-first audio** download and playback architecture

The recommended architecture maintains clear boundaries between concerns while enabling efficient data flow and responsive user experience.

---

## Current Architecture Overview

### Existing Components

```
┌─────────────────────────────────────────────────────────┐
│                    CURRENT SYSTEM                       │
├─────────────────────────────────────────────────────────┤
│  Frontend (React Native Expo)                           │
│  ├─ Zustand Stores (local state, AsyncStorage persist) │
│  ├─ expo-av (audio playback)                            │
│  ├─ API Client (typed HTTP + WebSocket)                 │
│  └─ Mindi Component (basic renderer)                    │
├─────────────────────────────────────────────────────────┤
│  Backend (FastAPI)                                      │
│  ├─ Groq AI (affirmation generation)                    │
│  ├─ edge-tts (text-to-speech)                           │
│  ├─ FFmpeg (audio mixing)                               │
│  ├─ Cloudflare R2 (audio storage)                       │
│  └─ WebSocket (generation progress)                     │
└─────────────────────────────────────────────────────────┘
```

### Current Data Flow

1. User enters intention → Frontend
2. Frontend calls FastAPI `/api/generate-affirmations`
3. Backend uses Groq AI → returns affirmations
4. Frontend calls `/api/generate-audio` with voice selection
5. Backend uses edge-tts + FFmpeg → uploads to R2 → returns URL
6. Frontend downloads audio → plays via expo-av
7. State persists to AsyncStorage via Zustand middleware

**Current gaps:**
- No user authentication (anyone can spoof user IDs)
- No persistent database (library resets on app uninstall)
- No emotion-driven character animations
- No offline audio storage (re-downloads every time)

---

## Recommended Architecture (With Integrations)

### System-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React Native)                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌────────────────────┐  ┌─────────────────┐ │
│  │  Auth Manager    │  │  Zustand Stores    │  │  Rive Runtime   │ │
│  │  - Supabase Auth │  │  - Local state     │  │  - State        │ │
│  │  - JWT tokens    │  │  - Persist config  │  │    machine      │ │
│  │  - Session mgmt  │  │  - Optimistic      │  │  - Inputs       │ │
│  │                  │  │    updates         │  │  - Triggers     │ │
│  └──────┬───────────┘  └────────┬───────────┘  └───────┬─────────┘ │
│         │                       │                      │           │
│         ├───────────────────────┼──────────────────────┘           │
│         │                       │                                  │
│  ┌──────▼───────────────────────▼──────────────────────────────┐  │
│  │              API Client (with JWT injection)                │  │
│  │  - HTTP requests with Authorization header                  │  │
│  │  - WebSocket with token in query param                      │  │
│  └──────────────────────────────┬──────────────────────────────┘  │
│                                  │                                  │
│  ┌───────────────────────────────▼─────────────────────────────┐  │
│  │          Offline Audio Manager                              │  │
│  │  - expo-av playback                                          │  │
│  │  - FileSystem downloads                                      │  │
│  │  - Local cache management                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 │ HTTPS + WSS
                                 │ Authorization: Bearer <JWT>
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                         SERVER (FastAPI)                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              JWT Verification Middleware                      │  │
│  │  - Verify JWT signature (JWKS from Supabase)                 │  │
│  │  - Extract user_id from token claims                          │  │
│  │  - Inject user context into request                           │  │
│  └─────────────────────────────┬─────────────────────────────────┘  │
│                                │                                    │
│  ┌─────────────────────────────▼─────────────────────────────────┐  │
│  │                     API Endpoints                             │  │
│  │  - /api/library (authenticated)                               │  │
│  │  - /api/sessions (authenticated)                              │  │
│  │  - /api/evolution/state (authenticated)                       │  │
│  │  - /api/generate-affirmations (authenticated)                 │  │
│  │  - /ws/generate (WebSocket with token)                        │  │
│  └─────────────────────────────┬─────────────────────────────────┘  │
│                                │                                    │
│  ┌─────────────────────────────▼─────────────────────────────────┐  │
│  │          Supabase Client (Service Role)                       │  │
│  │  - Database operations                                         │  │
│  │  - Bypass RLS (backend operations)                            │  │
│  │  - User-scoped queries                                         │  │
│  └─────────────────────────────┬─────────────────────────────────┘  │
│                                │                                    │
│  ┌─────────────────────────────▼─────────────────────────────────┐  │
│  │          Audio Pipeline (Existing)                            │  │
│  │  - Groq AI → edge-tts → FFmpeg → R2                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                    SUPABASE (PostgreSQL + Auth)                      │
├──────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Auth Service       │  │  Database (with RLS)                 │  │
│  │  - User accounts    │  │  - users                             │  │
│  │  - JWT issuing      │  │  - subliminals (user_id FK)          │  │
│  │  - JWKS endpoint    │  │  - sessions (user_id FK)             │  │
│  │                     │  │  - mindi_state (user_id FK)          │  │
│  └─────────────────────┘  └──────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

### 1. Authentication Layer

| Component | Responsibility | Communicates With | Technology |
|-----------|---------------|-------------------|------------|
| **Supabase Auth Client** | User sign-up, login, session management | Supabase Auth API | `@supabase/supabase-js` |
| **JWT Token Manager** | Store access token, refresh on expiry | Supabase Auth, API Client | React Context + AsyncStorage |
| **FastAPI JWT Middleware** | Verify JWT signature, extract user claims | Supabase JWKS endpoint | `PyJWT` + `httpx` |
| **WebSocket Auth Handler** | Validate token from query param or first message | JWT Middleware | Custom dependency |

**Key decisions:**
- **Client uses anon key + user JWT**: Frontend authenticates with Supabase, receives JWT, passes to FastAPI
- **Backend uses service role**: FastAPI bypasses RLS using service role key, implements own authorization logic
- **JWT verification via JWKS**: Backend fetches public keys from `https://[project].supabase.co/auth/v1/.well-known/jwks.json`

### 2. Database Sync Layer

| Component | Responsibility | Communicates With | Technology |
|-----------|---------------|-------------------|------------|
| **Zustand Store** | In-memory app state, fast reads | React components | `zustand` |
| **AsyncStorage Persist** | Local persistence for offline access | Zustand middleware | `@react-native-async-storage/async-storage` |
| **Supabase Sync Service** | Background sync between Zustand and Supabase | Zustand stores, API Client | Custom hook |
| **API Endpoints** | CRUD operations on database | FastAPI routes, Supabase client | `supabase-py` |

**Key decisions:**
- **Optimistic UI updates**: Zustand updates immediately, sync to Supabase in background
- **Conflict resolution**: Last-write-wins for MVP (use `updated_at` timestamps)
- **Sync triggers**: On app focus, after mutations, periodic background sync
- **Offline queue**: Store failed mutations in AsyncStorage, retry on reconnect

### 3. Character Animation Layer

| Component | Responsibility | Communicates With | Technology |
|-----------|---------------|-------------------|------------|
| **Rive Runtime** | Load .riv file, manage state machine | Rive View, Animation Controller | `@rive-app/react-native` |
| **Animation Controller** | Map app events to animation states | Zustand stores, Rive Runtime | Custom React hook |
| **Mindi State Machine** | Define emotion states and transitions | Rive file (.riv) | Rive Editor |
| **Particle System** | Visual effects for affirmation absorption | Rive file or react-native-reanimated | Rive or custom |

**Key decisions:**
- **State machine inputs**: `listening` (boolean), `emotion` (enum), `glow_level` (number), `trigger_generate` (trigger)
- **Emotion mapping**: Map user actions to emotions (idle → listening → peaceful → happy → excited)
- **Animation triggers**: WebSocket generation events trigger `trigger_generate`, session completion triggers glow increase
- **Performance**: Rive runs on separate thread, no impact on audio playback

### 4. Offline Audio Layer

| Component | Responsibility | Communicates With | Technology |
|-----------|---------------|-------------------|------------|
| **Audio Player** | Playback controls, progress tracking | expo-av | `expo-av` |
| **Download Manager** | Download audio files from R2, store locally | FileSystem, R2 URLs | `expo-file-system` |
| **Cache Manager** | Track downloaded files, evict old files | AsyncStorage (metadata) | Custom hook |
| **Session Recorder** | Track listening duration, completion | API Client, Zustand | Custom hook |

**Key decisions:**
- **Download strategy**: Download after generation completes, before playback
- **Cache location**: `FileSystem.documentDirectory + 'audio/' + subliminal_id + '.mp3'`
- **Cache eviction**: LRU (Least Recently Used) when storage exceeds 500MB
- **Offline playback**: Always play from local cache if available, fallback to stream

---

## Data Flow Patterns

### Pattern 1: User Authentication Flow

```
┌──────────┐
│  User    │
│  signs   │
│  up      │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Supabase Auth Client             │
│  supabase.auth.signUp(email, password)      │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Supabase Auth Service                      │
│  - Creates user record                      │
│  - Issues JWT (access + refresh tokens)     │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Token Manager                    │
│  - Store tokens in AsyncStorage             │
│  - Set up auto-refresh (on expiry)          │
│  - Inject token in API Client               │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Navigate to onboarding           │
│  - Name Mindi screen                        │
│  - Set first intention                      │
└─────────────────────────────────────────────┘
```

### Pattern 2: Authenticated API Request Flow

```
┌──────────┐
│  User    │
│  action  │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Zustand Store                    │
│  - Optimistic update (immediate UI change)  │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: API Client                       │
│  - Add Authorization: Bearer <jwt>          │
│  - POST /api/library                        │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Backend: JWT Middleware                    │
│  - Extract token from header                │
│  - Verify signature with Supabase JWKS      │
│  - Validate claims (exp, iss, aud)          │
│  - Extract user_id from sub claim           │
│  - Inject user_id into request context      │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Backend: API Endpoint                      │
│  - Access user_id from request              │
│  - Query Supabase with user_id filter       │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Supabase Database                          │
│  - Execute query (service role bypasses RLS)│
│  - Return filtered results                  │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Backend: Return response                   │
│  - Serialize data                           │
│  - Return JSON                              │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Update Zustand                   │
│  - Merge server response                    │
│  - Persist to AsyncStorage                  │
└─────────────────────────────────────────────┘
```

### Pattern 3: WebSocket Generation with Auth

```
┌──────────┐
│  User    │
│  creates │
│  audio   │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: WebSocket Connection             │
│  - ws://backend/ws/generate?token=<jwt>     │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Backend: WebSocket Auth Handler            │
│  - Extract token from query param           │
│  - Verify JWT (same as HTTP middleware)     │
│  - Extract user_id                          │
│  - Accept connection or reject (403)        │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Backend: Generation Pipeline               │
│  - Receive generation params                │
│  - Stream progress events:                  │
│    • "Generating affirmations..." (10%)     │
│    • "Creating audio..." (40%)              │
│    • "Mixing with background..." (70%)      │
│    • "Uploading..." (90%)                   │
│    • Complete with audio_url (100%)         │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Progress Updates                 │
│  - Update Mindi state (generating)          │
│  - Update progress bar                      │
│  - Trigger animation state changes          │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Download Audio                   │
│  - FileSystem.downloadAsync(url, localPath) │
│  - Save metadata to AsyncStorage            │
│  - Update Zustand with local path           │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Sync to Supabase                 │
│  - POST /api/library with subliminal data   │
│  - Store audio_url (R2) + local_path        │
└─────────────────────────────────────────────┘
```

### Pattern 4: Offline-First Library Access

```
┌──────────┐
│  User    │
│  opens   │
│  library │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Check Zustand Store              │
│  - Read from in-memory state                │
│  - Instant UI render (no loading spinner)   │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Background Sync (if online)      │
│  - GET /api/library                         │
│  - Compare server timestamps with local     │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Conflict Resolution                        │
│  - If server newer: Update Zustand          │
│  - If local newer: Push to server           │
│  - If equal: No action                      │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Frontend: Update UI (if changes)           │
│  - React re-renders on Zustand change       │
│  - Persist updated state to AsyncStorage    │
└─────────────────────────────────────────────┘
```

### Pattern 5: Mindi Animation State Binding

```
┌──────────┐
│  App     │
│  event   │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Event Mapping (useMindiAnimations hook)    │
│  - app.onFocus → 'idle'                     │
│  - user.setIntention → 'listening'          │
│  - generation.progress → 'generating'       │
│  - audio.playing → 'peaceful'               │
│  - session.complete → 'happy' + glow++      │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Animation Controller                       │
│  - Map event to Rive input                  │
│  - Debounce rapid state changes             │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Rive Runtime                               │
│  - Set boolean input: listening = true      │
│  - Set number input: glow_level = 5         │
│  - Fire trigger: absorb_affirmation         │
└────┬────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Rive State Machine (in .riv file)          │
│  - Transition from idle to listening        │
│  - Play listening animation loop            │
│  - On absorb_affirmation trigger:           │
│    • Play particle burst                    │
│    • Increase glow opacity                  │
└─────────────────────────────────────────────┘
```

---

## Patterns to Follow

### Pattern 1: JWT Verification Middleware (FastAPI)

**What:** Dependency injection pattern for verifying Supabase JWTs on all authenticated routes.

**When:** Use for all API endpoints that require user authentication.

**Implementation:**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import jwt
from functools import lru_cache
from datetime import datetime, timedelta

security = HTTPBearer()

# Cache JWKS for 10 minutes (Supabase edge caches for 10 min)
JWKS_CACHE_DURATION = timedelta(minutes=10)
_jwks_cache = {"data": None, "expires_at": None}

@lru_cache(maxsize=1)
def get_supabase_config():
    """Get Supabase configuration from environment."""
    return {
        "project_url": os.getenv("SUPABASE_URL"),
        "project_id": os.getenv("SUPABASE_URL").split("//")[1].split(".")[0],
    }

async def get_jwks():
    """Fetch JWKS from Supabase with 10-minute cache."""
    now = datetime.utcnow()

    if _jwks_cache["data"] and _jwks_cache["expires_at"] > now:
        return _jwks_cache["data"]

    config = get_supabase_config()
    jwks_url = f"{config['project_url']}/auth/v1/.well-known/jwks.json"

    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        response.raise_for_status()

    _jwks_cache["data"] = response.json()
    _jwks_cache["expires_at"] = now + JWKS_CACHE_DURATION

    return _jwks_cache["data"]

async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify Supabase JWT and return user claims.

    Returns:
        dict with keys: user_id, email, role
    """
    token = credentials.credentials

    try:
        # Get JWKS
        jwks = await get_jwks()

        # Decode header to get key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find matching key
        key = None
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == kid:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)
                break

        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token key"
            )

        # Verify token
        config = get_supabase_config()
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience="authenticated",
            issuer=f"{config['project_url']}/auth/v1",
        )

        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role"),
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

# Usage in routes
@app.get("/api/library")
async def get_library(user: dict = Depends(verify_token)):
    user_id = user["user_id"]
    # Query database filtered by user_id
    return await db.get_user_subliminals(user_id)
```

**Why this pattern:**
- Uses official Supabase JWKS endpoint (no shared secrets)
- Caches keys for performance (aligned with Supabase edge cache)
- Works with Supabase's asymmetric signing (RS256)
- Dependency injection makes auth explicit and testable
- Returns user context for authorization logic

### Pattern 2: WebSocket Authentication

**What:** Authenticate WebSocket connections using JWT from query parameter or first message.

**When:** Use for real-time features like generation progress streaming.

**Implementation:**

```python
from fastapi import WebSocket, WebSocketDisconnect, Query
from urllib.parse import parse_qs

async def verify_websocket_token(token: str) -> dict:
    """Verify JWT for WebSocket (reuses HTTP verification logic)."""
    # Create mock HTTPAuthorizationCredentials
    from fastapi.security import HTTPAuthorizationCredentials
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=token
    )
    return await verify_token(credentials)

@app.websocket("/ws/generate")
async def websocket_generate(
    websocket: WebSocket,
    token: str = Query(None)
):
    """
    WebSocket endpoint for audio generation with auth.
    Token can come from query param or first message.
    """
    user = None

    # Try token from query param first
    if token:
        try:
            user = await verify_websocket_token(token)
        except HTTPException:
            await websocket.close(code=1008)  # Policy violation
            return

    await websocket.accept()

    # If no query token, expect token in first message
    if not user:
        try:
            first_message = await websocket.receive_json()
            token = first_message.get("token")

            if not token:
                await websocket.send_json({
                    "type": "error",
                    "message": "Authentication required"
                })
                await websocket.close(code=1008)
                return

            user = await verify_websocket_token(token)

        except HTTPException:
            await websocket.send_json({
                "type": "error",
                "message": "Invalid token"
            })
            await websocket.close(code=1008)
            return

    # Now authenticated, proceed with generation
    try:
        # ... existing generation logic ...
        # Use user["user_id"] for database operations

        await websocket.send_json({
            "type": "progress",
            "percent": 10,
            "message": "Generating affirmations..."
        })

        # ... rest of generation pipeline ...

    except WebSocketDisconnect:
        # Client disconnected
        pass
```

**Why this pattern:**
- WebSocket doesn't support headers, so token goes in query param
- Fallback to first message allows flexibility
- Reuses HTTP JWT verification logic (DRY)
- Closes connection early if auth fails (no wasted resources)

### Pattern 3: Optimistic Zustand + Supabase Sync

**What:** Update local state immediately, sync to server in background, handle conflicts gracefully.

**When:** Use for all user data mutations (library, sessions, Mindi state).

**Implementation:**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import NetInfo from '@react-native-community/netinfo';

interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  resource: 'subliminal' | 'session';
  data: any;
  timestamp: number;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  syncQueue: SyncQueueItem[];
  lastSyncAt: number | null;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      isSyncing: false,
      syncQueue: [],
      lastSyncAt: null,

      // Add operation to queue
      queueSync: (item: Omit<SyncQueueItem, 'timestamp'>) => {
        set((state) => ({
          syncQueue: [
            ...state.syncQueue,
            { ...item, timestamp: Date.now() }
          ]
        }));

        // Trigger sync if online
        if (get().isOnline) {
          get().processSyncQueue();
        }
      },

      // Process queued operations
      processSyncQueue: async () => {
        const { syncQueue, isSyncing } = get();

        if (isSyncing || syncQueue.length === 0) return;

        set({ isSyncing: true });

        const queue = [...syncQueue];
        const processed: string[] = [];

        for (const item of queue) {
          try {
            // Execute API call based on operation
            if (item.operation === 'create' && item.resource === 'subliminal') {
              await api.createSubliminal(item.data);
            } else if (item.operation === 'update') {
              await api.updateSubliminal(item.id, item.data);
            }
            // ... other operations ...

            processed.push(item.id);

          } catch (error) {
            console.error(`Sync failed for ${item.id}:`, error);
            // Keep in queue for retry
            break; // Stop processing on first error
          }
        }

        // Remove successfully processed items
        set((state) => ({
          syncQueue: state.syncQueue.filter(
            (item) => !processed.includes(item.id)
          ),
          isSyncing: false,
          lastSyncAt: Date.now()
        }));
      },

      // Set online status and trigger sync
      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
        if (isOnline) {
          get().processSyncQueue();
        }
      }
    }),
    {
      name: 'wavium-sync',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Usage in Mindi store
export const useMindiStore = create<MindiStoreState>()(
  persist(
    (set, get) => ({
      // ... existing state ...

      saveSubliminal: (title, audioUrl) => {
        const { creation, subliminals } = get();
        const newSubliminal: Subliminal = {
          id: Date.now().toString(),
          title,
          intention: creation.intention,
          affirmations: creation.affirmations,
          track: creation.selectedTrack || 'ocean-waves',
          audioUrl,
          createdAt: new Date().toISOString(),
        };

        // 1. OPTIMISTIC UPDATE (immediate)
        set({
          subliminals: [newSubliminal, ...subliminals],
          creation: { ...initialCreation },
        });

        // 2. QUEUE SYNC (background)
        useSyncStore.getState().queueSync({
          id: newSubliminal.id,
          operation: 'create',
          resource: 'subliminal',
          data: newSubliminal
        });

        return newSubliminal;
      },

      // ... rest of store ...
    }),
    {
      name: 'wavium-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Set up network listener
NetInfo.addEventListener((state) => {
  useSyncStore.getState().setOnlineStatus(state.isConnected ?? false);
});
```

**Why this pattern:**
- Immediate UI feedback (no spinners for local operations)
- Works offline (queue persists to AsyncStorage)
- Automatic retry on reconnect
- Preserves operation order
- Separates sync logic from business logic

### Pattern 4: Rive State Machine Integration

**What:** Create custom hook that maps app events to Rive animation state machine inputs.

**When:** Use to control Mindi character animations based on app state.

**Implementation:**

```typescript
import { useRef, useEffect } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-native';
import { useMindiStore } from '../stores/useMindiStore';

// Define emotion states matching Rive state machine
type EmotionState = 'idle' | 'listening' | 'peaceful' | 'happy' | 'excited' | 'generating';

export function useMindiAnimations() {
  const currentState = useMindiStore((s) => s.currentState);
  const glowLevel = useMindiStore((s) => s.glowLevel); // Derived from sessions

  // Load Rive file
  const { rive, RiveComponent } = useRive({
    artboard: 'Mindi',
    stateMachines: 'MainStateMachine',
    autoplay: true,
  });

  // Get state machine inputs
  const emotionInput = useStateMachineInput(rive, 'MainStateMachine', 'emotion');
  const glowInput = useStateMachineInput(rive, 'MainStateMachine', 'glow_level');
  const absorbTrigger = useStateMachineInput(rive, 'MainStateMachine', 'absorb_affirmation');

  // Map app state to animation state
  useEffect(() => {
    if (!emotionInput) return;

    // Map Zustand currentState to Rive emotion input
    const emotionMap: Record<MindiState, number> = {
      idle: 0,
      listening: 1,
      peaceful: 2,
      happy: 3,
      excited: 4,
      generating: 5,
    };

    emotionInput.value = emotionMap[currentState] || 0;
  }, [currentState, emotionInput]);

  // Update glow level
  useEffect(() => {
    if (!glowInput) return;
    glowInput.value = glowLevel;
  }, [glowLevel, glowInput]);

  // Trigger absorption effect
  const triggerAbsorption = () => {
    if (absorbTrigger) {
      absorbTrigger.fire();
    }
  };

  return {
    RiveComponent,
    triggerAbsorption,
  };
}

// Usage in component
function MindiCharacter() {
  const { RiveComponent, triggerAbsorption } = useMindiAnimations();
  const setCurrentState = useMindiStore((s) => s.setCurrentState);

  useEffect(() => {
    // Listen to WebSocket generation events
    const unsubscribe = api.onGenerationComplete(() => {
      triggerAbsorption();
      setCurrentState('happy');
    });

    return unsubscribe;
  }, []);

  return (
    <RiveComponent
      style={{ width: 300, height: 300 }}
      artboard="Mindi"
      stateMachines={['MainStateMachine']}
    />
  );
}
```

**Why this pattern:**
- Decouples animation logic from components
- Automatic state synchronization via React hooks
- Type-safe emotion mapping
- Easy to test (mock Rive hooks)
- Centralized animation control

### Pattern 5: Offline Audio Download & Cache

**What:** Download audio files after generation, play from local cache, manage storage limits.

**When:** Use for all subliminal audio to enable offline playback.

**Implementation:**

```typescript
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

interface AudioCacheMetadata {
  subliminal_id: string;
  local_path: string;
  remote_url: string;
  file_size: number;
  downloaded_at: number;
  last_played_at: number;
}

const AUDIO_CACHE_DIR = `${FileSystem.documentDirectory}audio/`;
const MAX_CACHE_SIZE_MB = 500;
const CACHE_METADATA_KEY = 'audio_cache_metadata';

class AudioCacheManager {
  private metadata: AudioCacheMetadata[] = [];

  async initialize() {
    // Create cache directory
    const dirInfo = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_CACHE_DIR, {
        intermediates: true
      });
    }

    // Load cache metadata
    const stored = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    if (stored) {
      this.metadata = JSON.parse(stored);
    }
  }

  async downloadAudio(
    subliminalId: string,
    remoteUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const localPath = `${AUDIO_CACHE_DIR}${subliminalId}.mp3`;

    // Check if already cached
    const cached = this.metadata.find((m) => m.subliminal_id === subliminalId);
    if (cached) {
      const fileInfo = await FileSystem.getInfoAsync(cached.local_path);
      if (fileInfo.exists) {
        return cached.local_path;
      }
    }

    // Download file
    const downloadResumable = FileSystem.createDownloadResumable(
      remoteUrl,
      localPath,
      {},
      (progress) => {
        const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
        onProgress?.(percent);
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (!result) {
      throw new Error('Download failed');
    }

    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    const fileSize = fileInfo.size || 0;

    // Add to metadata
    const newMetadata: AudioCacheMetadata = {
      subliminal_id: subliminalId,
      local_path: result.uri,
      remote_url: remoteUrl,
      file_size: fileSize,
      downloaded_at: Date.now(),
      last_played_at: Date.now(),
    };

    this.metadata.push(newMetadata);
    await this.saveMetadata();

    // Check cache size and evict if needed
    await this.evictIfNeeded();

    return result.uri;
  }

  async getLocalPath(subliminalId: string): Promise<string | null> {
    const cached = this.metadata.find((m) => m.subliminal_id === subliminalId);

    if (!cached) return null;

    // Verify file still exists
    const fileInfo = await FileSystem.getInfoAsync(cached.local_path);
    if (!fileInfo.exists) {
      // Remove stale metadata
      this.metadata = this.metadata.filter((m) => m.subliminal_id !== subliminalId);
      await this.saveMetadata();
      return null;
    }

    return cached.local_path;
  }

  async updateLastPlayed(subliminalId: string) {
    const cached = this.metadata.find((m) => m.subliminal_id === subliminalId);
    if (cached) {
      cached.last_played_at = Date.now();
      await this.saveMetadata();
    }
  }

  private async evictIfNeeded() {
    const totalSize = this.metadata.reduce((sum, m) => sum + m.file_size, 0);
    const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;

    if (totalSize <= maxSizeBytes) return;

    // Sort by last played (LRU)
    const sorted = [...this.metadata].sort((a, b) =>
      a.last_played_at - b.last_played_at
    );

    // Evict oldest until under limit
    let currentSize = totalSize;
    for (const item of sorted) {
      if (currentSize <= maxSizeBytes) break;

      // Delete file
      await FileSystem.deleteAsync(item.local_path, { idempotent: true });

      // Remove from metadata
      this.metadata = this.metadata.filter(
        (m) => m.subliminal_id !== item.subliminal_id
      );

      currentSize -= item.file_size;
    }

    await this.saveMetadata();
  }

  private async saveMetadata() {
    await AsyncStorage.setItem(
      CACHE_METADATA_KEY,
      JSON.stringify(this.metadata)
    );
  }

  getCacheStats() {
    const totalSize = this.metadata.reduce((sum, m) => sum + m.file_size, 0);
    return {
      totalFiles: this.metadata.length,
      totalSizeMB: totalSize / (1024 * 1024),
      maxSizeMB: MAX_CACHE_SIZE_MB,
    };
  }
}

export const audioCacheManager = new AudioCacheManager();

// Usage in audio player
export function useAudioPlayer(subliminalId: string, remoteUrl: string) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAudio = async () => {
    setIsLoading(true);

    try {
      // Try to get from cache
      let localPath = await audioCacheManager.getLocalPath(subliminalId);

      // Download if not cached
      if (!localPath) {
        localPath = await audioCacheManager.downloadAudio(
          subliminalId,
          remoteUrl,
          (progress) => {
            console.log(`Download progress: ${progress * 100}%`);
          }
        );
      }

      // Update last played
      await audioCacheManager.updateLastPlayed(subliminalId);

      // Load audio
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: localPath },
        { shouldPlay: false }
      );

      setSound(audioSound);

    } catch (error) {
      console.error('Failed to load audio:', error);
      // Fallback to streaming
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: remoteUrl },
        { shouldPlay: false }
      );
      setSound(audioSound);

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAudio();

    return () => {
      sound?.unloadAsync();
    };
  }, [subliminalId]);

  return { sound, isLoading };
}
```

**Why this pattern:**
- Offline-first (always prefer local cache)
- Automatic cache management (LRU eviction)
- Fallback to streaming on cache miss
- Metadata tracked separately for fast lookups
- Progress tracking for downloads

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing JWT in Zustand Persist

**What:** Persisting access tokens in Zustand state that syncs to AsyncStorage.

**Why bad:**
- Tokens expire and need refresh, but Zustand doesn't handle token lifecycle
- Couples authentication state with application state
- Makes token refresh logic scattered across the app
- Risk of stale tokens being loaded on app restart

**Instead:**
- Use Supabase Auth's built-in session management
- Let Supabase handle token refresh automatically
- Store session in SecureStore (for sensitive tokens) or dedicated auth context
- Inject current token into API calls via interceptor

```typescript
// BAD
const useMindiStore = create()(
  persist(
    (set) => ({
      accessToken: '', // DON'T DO THIS
      user: null,
    }),
    { name: 'wavium-store' }
  )
);

// GOOD
import { useSupabaseAuth } from '../auth/SupabaseAuthProvider';

function MyComponent() {
  const { session, user } = useSupabaseAuth(); // Managed by Supabase
  const token = session?.access_token; // Always fresh
}
```

### Anti-Pattern 2: Synchronous AsyncStorage Operations in Render

**What:** Reading from AsyncStorage during component render or in Zustand state initialization.

**Why bad:**
- AsyncStorage is async, blocking render leads to race conditions
- Causes "Can't perform a React state update on an unmounted component" warnings
- Degrades app startup performance
- Hydration happens after initial render, causing flicker

**Instead:**
- Use Zustand persist middleware (handles async hydration correctly)
- Show loading state until hydration completes
- Use `onRehydrateStorage` callback to detect when state is ready

```typescript
// BAD
const useMindiStore = create((set) => {
  // DON'T DO THIS - async in sync context
  AsyncStorage.getItem('user').then((user) => {
    set({ user: JSON.parse(user) });
  });

  return { user: null };
});

// GOOD
const useMindiStore = create()(
  persist(
    (set) => ({
      user: null,
      _hasHydrated: false,
    }),
    {
      name: 'wavium-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state._hasHydrated = true;
      },
    }
  )
);

// In component
function App() {
  const hasHydrated = useMindiStore((s) => s._hasHydrated);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return <MainApp />;
}
```

### Anti-Pattern 3: Calling Supabase Database Methods from Frontend

**What:** Using `supabase.from('table').select()` directly in React Native components.

**Why bad:**
- Exposes database schema to client (security risk)
- Bypasses backend validation and business logic
- Harder to add rate limiting or analytics
- Violates single source of truth (backend owns data shape)
- Requires exposing anon key with broad RLS policies

**Instead:**
- All database operations go through FastAPI endpoints
- Frontend calls REST API, backend uses Supabase service role
- Enables backend to add caching, validation, transformation
- Single security boundary to audit

```typescript
// BAD
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function MyComponent() {
  useEffect(() => {
    // DON'T DO THIS - direct database access from client
    supabase.from('subliminals')
      .select('*')
      .eq('user_id', userId)
      .then(({ data }) => setSubliminals(data));
  }, []);
}

// GOOD
import { api } from '../api/client';

function MyComponent() {
  useEffect(() => {
    // Backend handles Supabase, validates, returns shaped data
    api.getLibrary().then(({ data }) => {
      if (data) setSubliminals(data.subliminals);
    });
  }, []);
}
```

### Anti-Pattern 4: Polling for Sync Instead of Event-Driven

**What:** Using `setInterval` to periodically check server for updates.

**Why bad:**
- Wastes battery and bandwidth
- Unnecessary server load
- Delayed updates (up to poll interval)
- Doesn't scale (N clients = N * poll rate requests)

**Instead:**
- Sync on app focus (React Native AppState)
- Sync after mutations (optimistic update pattern)
- Use WebSocket or Supabase Realtime for push updates
- Exponential backoff for retry logic

```typescript
// BAD
useEffect(() => {
  // DON'T DO THIS - constant polling
  const interval = setInterval(async () => {
    await syncWithServer();
  }, 5000); // Every 5 seconds

  return () => clearInterval(interval);
}, []);

// GOOD
import { useEffect } from 'react';
import { AppState } from 'react-native';

function useSyncOnFocus() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Sync only when app comes to foreground
        syncWithServer();
      }
    });

    return () => subscription.remove();
  }, []);
}
```

### Anti-Pattern 5: Triggering Rive Animations with Direct State Mutations

**What:** Directly setting Rive state machine values from scattered components without coordination.

**Why bad:**
- Race conditions when multiple components trigger animations
- Animation state out of sync with app state
- Hard to debug ("Why did Mindi change emotion?")
- Violates single source of truth

**Instead:**
- Centralize animation control in custom hook
- Derive animation state from Zustand store
- Use event bus or pub/sub for complex triggers
- Debounce rapid state changes

```typescript
// BAD
function IntentionScreen() {
  const { rive } = useRive(...);

  const handleSubmit = () => {
    // Scattered animation triggers
    rive.setNumberInput('emotion', 1); // What if another component also sets this?
    submitIntention();
  };
}

// GOOD
function IntentionScreen() {
  const setCurrentState = useMindiStore((s) => s.setCurrentState);

  const handleSubmit = () => {
    // Single source of truth for Mindi state
    setCurrentState('listening'); // useMindiAnimations hook reacts to this
    submitIntention();
  };
}

// Animation hook automatically syncs
function useMindiAnimations() {
  const currentState = useMindiStore((s) => s.currentState);
  const emotionInput = useStateMachineInput(rive, 'MainStateMachine', 'emotion');

  useEffect(() => {
    // Single place where Zustand state → Rive input
    emotionInput.value = EMOTION_MAP[currentState];
  }, [currentState]);
}
```

---

## Build Order and Dependencies

### Recommended Implementation Phases

```
Phase 1: Authentication Foundation
├─ Backend: JWT verification middleware
├─ Backend: Supabase client setup (service role)
├─ Frontend: Supabase Auth integration
├─ Frontend: Token manager with auto-refresh
└─ Frontend: Protected route wrapper

Phase 2: Database Persistence
├─ Backend: Supabase schema creation (migrations)
├─ Backend: Authenticated endpoints (library, sessions, evolution)
├─ Frontend: Sync service (optimistic updates)
├─ Frontend: Network status detection
└─ Testing: Offline/online transitions

Phase 3: Offline Audio
├─ Frontend: Audio cache manager
├─ Frontend: Download service with progress
├─ Frontend: LRU eviction logic
├─ Backend: R2 URL signing (if private storage)
└─ Testing: Cache limits, eviction, corruption

Phase 4: Character Animations
├─ Design: Rive file with state machine (external tool)
├─ Frontend: Rive runtime integration
├─ Frontend: Animation controller hook
├─ Frontend: Event mapping (Zustand → Rive)
└─ Testing: Smooth transitions, performance

Phase 5: Integration & Polishing
├─ WebSocket auth implementation
├─ Generation progress → animation triggers
├─ Session recording → glow level updates
├─ End-to-end testing
└─ Performance optimization
```

### Critical Dependencies

```
Phase 1 must complete before Phase 2
├─ Database endpoints need JWT verification
└─ Can't query user data without user_id from token

Phase 2 must complete before Phase 3
├─ Audio downloads need authenticated endpoints
└─ Cache metadata needs user_id for multi-account support

Phase 4 can be parallelized with Phase 2-3
├─ Rive animations don't depend on auth or sync
└─ Can develop with mock state initially

Phase 5 requires Phases 1-4 complete
├─ WebSocket auth needs Phase 1 middleware
├─ Generation triggers need Phase 4 animations
└─ Session recording needs Phase 2 database
```

---

## Scalability Considerations

### At 100 Users (Current MVP Target)

| Concern | Approach | Rationale |
|---------|----------|-----------|
| **Authentication** | Supabase free tier | 50,000 monthly active users included |
| **Database queries** | Service role with user_id filter | Simple, no RLS complexity needed yet |
| **Audio storage** | Cloudflare R2 with direct URLs | 10GB free storage, sufficient for 100 users |
| **Sync conflicts** | Last-write-wins | Rare with 100 users, simple to implement |
| **Cache eviction** | Client-side LRU | Each device manages own 500MB cache |
| **WebSocket connections** | Single Uvicorn worker | Can handle ~100 concurrent connections |

### At 10K Users

| Concern | Approach | Rationale |
|---------|----------|-----------|
| **Authentication** | Supabase Pro tier ($25/mo) | 100,000 MAU, better support |
| **Database queries** | Add indexes on user_id, created_at | Query performance optimization |
| **Audio storage** | R2 with signed URLs | Prevent hotlinking, enable analytics |
| **Sync conflicts** | Add conflict detection | Flag conflicts, let user choose |
| **Cache eviction** | Intelligent prefetch | Predict which subliminals to cache |
| **WebSocket connections** | Multiple workers + sticky sessions | Load balancing with session affinity |
| **Database** | Enable RLS policies | Defense-in-depth security |

### At 1M Users

| Concern | Approach | Rationale |
|---------|----------|-----------|
| **Authentication** | Consider Auth0 or custom | More control, better analytics |
| **Database queries** | Read replicas + caching layer | Redis for hot data (library) |
| **Audio storage** | CDN + multi-region R2 | Lower latency worldwide |
| **Sync conflicts** | CRDT or OT | Automatic conflict resolution |
| **Cache eviction** | Server-assisted prefetch | Backend recommends what to cache |
| **WebSocket connections** | Managed service (Pusher, Ably) | Offload real-time infrastructure |
| **Database** | Supabase Enterprise or migrate | Dedicated resources, SLA |
| **Observability** | Full tracing + metrics | Identify bottlenecks proactively |

---

## Sources

### Official Documentation

- [Supabase JWT Documentation](https://supabase.com/docs/guides/auth/jwts) - JWT verification, JWKS endpoint, best practices
- [Rive React Native Documentation](https://rive.app/docs/runtimes/react-native/react-native) - Installation, state machine integration
- [Expo Local-First Architecture](https://docs.expo.dev/guides/local-first/) - Persistence, state management, syncing patterns

### Authentication Integration

- [Integrating FastAPI with Supabase Auth](https://dev.to/j0/integrating-fastapi-with-supabase-auth-780) - Practical implementation guide
- [Implementing Supabase Auth in FastAPI](https://phillyharper.medium.com/implementing-supabase-auth-in-fastapi-63d9d8272c7b) - JWT middleware pattern
- [Validating Supabase JWT with Python and FastAPI](https://dev.to/zwx00/validating-a-supabase-jwt-locally-with-python-and-fastapi-59jf) - JWKS verification example
- [FastAPI WebSocket Authentication with JWT](https://hexshift.medium.com/authenticating-websocket-clients-in-fastapi-with-jwt-and-dependency-injection-d636d48fdf48) - WebSocket auth pattern

### Database Sync

- [React Native Offline-First with WatermelonDB and Supabase](https://supabase.com/blog/react-native-offline-first-watermelon-db) - Offline-first architecture
- [PowerSync: Bringing Offline-First to Supabase](https://www.powersync.com/blog/bringing-offline-first-to-supabase) - Sync strategies
- [Zustand Persisting Store Data](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) - AsyncStorage integration

### Character Animations

- [Rive Character Animation for Mobile Apps](https://dev.to/uianimation/rive-character-animation-for-mobile-apps-a-production-ready-design-and-state-machine-breakdown-5e3m) - State machine design patterns
- [Engineering Interactive Mascots with Rive](https://dev.to/uianimation/engineering-interactive-mascots-with-rives-state-machine-and-runtime-architecture-4e2h) - Emotion-driven animation architecture

### Audio Architecture

- [React Native Track Player Documentation](https://rntp.dev/) - Audio playback library
- [Transform Your React Native App with Offline Audio Downloads](https://dev.to/amitkumar13/transform-your-react-native-app-with-offline-audio-video-downloads-2hmd) - Download and cache patterns
- [The Offline-First Multilingual Audio Tour App Built with Expo](https://expo.dev/blog/the-offline-first-multilingual-audio-tour-app-built-with-expo) - Real-world offline-first audio architecture

### Security & Performance

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS with service role pattern
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - Performance optimization

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| **JWT Authentication** | HIGH | Official Supabase docs + multiple verified implementations |
| **Database Sync** | MEDIUM | Established patterns but custom implementation needed |
| **Rive Integration** | HIGH | Official React Native runtime + production examples |
| **Offline Audio** | HIGH | Well-documented expo-file-system + proven patterns |
| **WebSocket Auth** | MEDIUM | Pattern documented but requires custom adapter |
| **Build Order** | HIGH | Clear dependency chain from architecture analysis |

---

## Summary

### Key Architectural Decisions

1. **Authentication**: Supabase Auth issues JWT → FastAPI verifies via JWKS → Backend uses service role
2. **Sync**: Zustand + AsyncStorage (local) → Optimistic updates → Background sync to Supabase
3. **Animations**: Rive state machine driven by Zustand store via custom hook
4. **Audio**: Download-first with LRU cache, fallback to streaming

### Critical Integration Points

- JWT token flows through HTTP headers and WebSocket query params
- Zustand state changes trigger both Supabase API calls and Rive animations
- Audio download completes before database record created (atomic operation)
- Network status changes trigger sync queue processing

### Build Order Rationale

Start with authentication (foundation for all features) → Add database persistence (enables cloud sync) → Implement offline audio (works independently) → Integrate animations (visual polish) → Connect everything in Phase 5.

Each phase builds on previous work without breaking existing functionality.
