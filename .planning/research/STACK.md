# Technology Stack for Wavium MVP Completion

**Project:** Wavium - Subliminal Audio App
**Research Date:** February 2, 2026
**Focus:** Adding Supabase auth, Rive animations, and database persistence to existing React Native Expo + FastAPI app

---

## Executive Summary

This milestone adds three critical components to the existing Wavium stack: **Supabase authentication and database**, **Rive character animations** (Mindi mascot), and **persistent state management**. The recommended stack leverages modern, actively maintained libraries with strong React Native and FastAPI support.

**Key Decisions:**
- **Supabase-js v2.93.3** + **supabase-py v2.27.2** for unified auth/database
- **@rive-app/react-native (new runtime)** for Mindi animations
- **Zustand persist + MMKV** for high-performance local state
- **PyJWT** (NOT python-jose) for FastAPI JWT validation
- **Keep edge-tts** for MVP (explore Kokoro TTS post-MVP)

---

## Recommended Stack

### Authentication & Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **@supabase/supabase-js** | ^2.93.3 | React Native client | Official Supabase client with React Native support, includes auth + realtime | HIGH |
| **supabase** (Python) | ^2.27.2 | FastAPI backend client | Official Python SDK with auth, postgrest, storage, realtime | HIGH |
| **PyJWT** | ^2.9.0 | JWT validation in FastAPI | Active maintenance, official FastAPI recommendation (python-jose is abandoned) | HIGH |
| **expo-sqlite** | ^15.0.0 | Supabase dependency | Required for Supabase session persistence on mobile | HIGH |
| **react-native-url-polyfill** | ^2.0.0 | Supabase dependency | URL polyfill required by supabase-js in React Native | HIGH |

**Why Supabase:**
- Unified auth + PostgreSQL database + real-time + storage in one service
- Strong React Native and Python SDK support
- Row-level security (RLS) for data access control
- Free tier sufficient for MVP
- Established ecosystem with active maintenance

**Why PyJWT over python-jose:**
- python-jose is abandoned (last release 2021, security issues)
- FastAPI officially switched to PyJWT in 2026
- Simpler API, active maintenance, Python 3.10+ compatible

**Sources:**
- [Supabase Expo React Native Guide](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)
- [supabase-js v2.93.3 Release](https://github.com/supabase/supabase-js)
- [supabase-py v2.27.2](https://github.com/supabase/supabase-py)
- [FastAPI PyJWT Discussion](https://github.com/fastapi/fastapi/discussions/11345)

---

### Animation System (Mindi Character)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **@rive-app/react-native** | ^6.13.0+ | Mindi character animations | New Nitro-based runtime, state machine support, single file for all states | HIGH |
| **expo-dev-client** | latest | Development build | Required for Rive (incompatible with Expo Go) | HIGH |
| **expo-build-properties** | latest | Native configuration | Set Android compileSdkVersion 36 for Rive compatibility | HIGH |
| **expo-custom-agp** | 8.9.2 | Android Gradle Plugin | Required for Expo SDK 53+ with Rive | MEDIUM |

**Why @rive-app/react-native (new runtime):**
- **State machine support**: Single .riv file with multiple Mindi states (idle, listening, peaceful, happy)
- **Interactive animations**: Can respond to user input and app state changes
- **Performance**: Nitro-based runtime optimized for React Native new architecture
- **Better than Lottie**: Rive state machines eliminate need for multiple JSON files, enable complex logic

**Why NOT Lottie:**
- Lottie requires separate JSON file for each animation state
- No state machine = more complex state management in JS
- Less interactive (pre-rendered only)
- Rive recommended by PRD for "state-based complexity"

**Critical Gotcha - Expo Go Incompatibility:**
Rive contains custom native code and **cannot run in Expo Go**. You MUST use a development build (`expo-dev-client`). This is non-negotiable.

**Android SDK 53 Configuration:**
Expo SDK 53 defaults to older Android SDK versions. Rive requires:
- `compileSdkVersion` 36
- Android Gradle Plugin 8.9.1+

Configuration in `app.json`:
```json
{
  "expo": {
    "plugins": [
      ["expo-custom-agp", "8.9.2"],
      ["expo-build-properties", {
        "android": { "compileSdkVersion": 36 }
      }]
    ]
  }
}
```

**Sources:**
- [Rive Expo Integration Guide](https://rive.app/docs/runtimes/react-native/adding-rive-to-expo)
- [Rive React Native GitHub](https://github.com/rive-app/rive-react-native)
- [Rive Nitro Runtime Announcement](https://github.com/rive-app/rive-nitro-react-native)

---

### State Management & Persistence

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **zustand** | ^5.0.9 | Client state management | Already in project, lightweight, React 19 compatible | HIGH |
| **react-native-mmkv** | ^4.1.0 | High-performance storage | Already in project, 30x faster than AsyncStorage for Zustand persist | HIGH |
| **@react-native-async-storage/async-storage** | ^2.2.0 | Fallback storage | Already in project, used by Supabase for session storage | HIGH |

**State Architecture:**

**1. Zustand Stores (Client State)**
- User preferences (haptics, notifications)
- Mindi state (name, glow level, streak)
- UI state (player controls, current track)
- Temporary creation flow state

**2. Supabase (Server State)**
- User accounts and authentication
- Subliminal library (affirmations, audio URLs)
- Usage statistics for streaks

**3. Persistence Strategy:**
- **MMKV for Zustand**: High-frequency UI state (player position, preferences)
- **Supabase for critical data**: User accounts, subliminal library, cannot be lost
- **AsyncStorage for Supabase sessions**: Session tokens managed by Supabase SDK

**Why MMKV over AsyncStorage for Zustand:**
- 30x faster read/write operations
- Synchronous API (no async hydration issues)
- Already in your dependencies
- "What AsyncStorage should have been" - community consensus

**Zustand + Supabase Sync Pattern:**
```typescript
// Store holds optimistic local state
const useSubliminalStore = create(
  persist(
    (set) => ({
      subliminals: [],
      addSubliminal: (sub) => {
        set((state) => ({ subliminals: [...state.subliminals, sub] }))
        // Sync to Supabase in background
        supabase.from('subliminals').insert(sub)
      }
    }),
    {
      name: 'subliminals',
      storage: createJSONStorage(() => new MMKV())
    }
  )
)

// Subscribe to Supabase real-time for sync across devices
supabase
  .channel('subliminals')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'subliminals' },
    (payload) => {
      useSubliminalStore.setState({ subliminals: payload.new })
    }
  )
  .subscribe()
```

**Sources:**
- [Zustand Persist Documentation](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [zustand-mmkv-storage Guide](https://dev.to/mehdifaraji/zustand-mmkv-storage-blazing-fast-persistence-for-zustand-in-react-native-3ef1)
- [Supabase Zustand Integration](https://www.restack.io/docs/supabase-knowledge-supabase-zustand-integration)

---

### Backend API (FastAPI + Supabase Integration)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **fastapi** | ^0.109.0 | Already in use | Current, no change needed | HIGH |
| **supabase** | ^2.27.2 | Supabase Python client | Auth, database, storage from FastAPI | HIGH |
| **PyJWT** | ^2.9.0 | JWT token validation | Validate Supabase tokens, active maintenance | HIGH |
| **python-dotenv** | ^1.0.0 | Already in use | Environment configuration | HIGH |

**FastAPI + Supabase Auth Pattern:**

**1. Dependency Injection for Auth:**
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Verify JWT with Supabase secret
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,  # From Supabase dashboard: Settings > Auth
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Protected route
@app.post("/api/subliminals")
async def create_subliminal(data: dict, user = Depends(get_current_user)):
    # User is authenticated, access user["sub"] for user ID
    return {"user_id": user["sub"]}
```

**2. Supabase Client with RLS:**
```python
from supabase import create_client

# Service role for admin operations (bypass RLS)
supabase_admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# User-scoped client (respects RLS)
def get_user_supabase(token: str):
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    supabase.auth.set_session(token)  # Sets user context for RLS
    return supabase
```

**Why This Pattern:**
- FastAPI dependency injection provides clean auth checks
- PyJWT validates tokens without external service calls (fast)
- User-scoped Supabase client enforces Row Level Security
- Service role client reserved for system operations only

**Sources:**
- [FastAPI Supabase Auth Integration](https://dev.to/j0/integrating-fastapi-with-supabase-auth-780)
- [Validating Supabase JWT with FastAPI](https://dev.to/zwx00/validating-a-supabase-jwt-locally-with-python-and-fastapi-59jf)
- [FastAPI + Supabase Template](https://euclideanai.substack.com/p/fastapi-supabase-template-for-llm)

---

## Text-to-Speech Decision

| Technology | Status | Purpose | Recommendation | Confidence |
|------------|--------|---------|----------------|------------|
| **edge-tts** | ^6.1.9 | Currently in use | **Keep for MVP** | HIGH |
| **Kokoro TTS** | Alternative | Post-MVP upgrade | Evaluate after MVP | MEDIUM |

**Why Keep edge-tts for MVP:**
- Already integrated and working
- Free (uses Microsoft Edge TTS service)
- Good voice quality for subliminal use case
- Low risk, don't disrupt working feature

**Why Consider Kokoro TTS Post-MVP:**
- **Self-hosted**: No reliance on Microsoft service availability
- **Fast**: 82M parameter model, runs 36x real-time on CPU
- **Quality**: Comparable to commercial TTS, beats ElevenLabs in some tests
- **Open source**: Apache 2.0 license, full control
- **FastAPI wrapper available**: Drop-in replacement with OpenAI-compatible API

**When to Switch:**
- Post-MVP when self-hosting infrastructure is ready
- If Microsoft Edge TTS becomes unreliable
- If voice customization becomes a differentiator

**Kokoro Setup (Future):**
```bash
# Docker deployment
docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest

# Python client
import requests
response = requests.post(
    "http://localhost:8880/v1/audio/speech",
    json={"model": "kokoro", "input": text, "voice": "af_bella"}
)
```

**Sources:**
- [Kokoro TTS Open Source Models](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models)
- [Kokoro FastAPI Wrapper](https://github.com/remsky/Kokoro-FastAPI)
- [Kokoro Setup Guide](https://medium.com/@shrinath.suresh/setting-up-kokoro-tts-locally-a-complete-beginner-friendly-guide-c1eaade469ca)

---

## Installation

### React Native (Expo) - New Dependencies

```bash
# Supabase
npx expo install @supabase/supabase-js react-native-url-polyfill expo-sqlite

# Rive animations
npx expo install @rive-app/react-native expo-dev-client expo-build-properties expo-custom-agp

# No additional state management needed (Zustand, MMKV already installed)
```

### Backend (FastAPI) - New Dependencies

```bash
# Add to requirements.txt
supabase==2.27.2
PyJWT==2.9.0

# Install
pip install -r requirements.txt
```

### Configuration Files

**app.json** (for Rive + Expo SDK 53):
```json
{
  "expo": {
    "plugins": [
      ["expo-custom-agp", "8.9.2"],
      ["expo-build-properties", {
        "android": { "compileSdkVersion": 36 },
        "ios": { "deploymentTarget": "15.1" }
      }]
    ]
  }
}
```

**backend/.env** (add Supabase config):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### First-Time Setup Commands

```bash
# Frontend: Rebuild with custom native code
cd wavium
npx expo prebuild --clean
npx expo run:android  # or run:ios

# Backend: No changes needed to start command
cd ../backend
python main.py  # or uvicorn main:app --reload
```

---

## Alternatives Considered

### Authentication

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Backend Auth | **Supabase** | Firebase Auth | Supabase better for self-hosted, SQL database, FastAPI integration |
| | | Custom JWT + Postgres | More work, Supabase provides auth + database + real-time |
| JWT Library | **PyJWT** | python-jose | Abandoned, security issues, not Python 3.10+ compatible |
| | | authlib | More features than needed, PyJWT simpler for MVP |

### Animation

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Character Animation | **Rive** | Lottie | No state machines, requires multiple files per state |
| | | React Native Animated | Too low-level, more code for complex Mindi states |
| | | react-native-skia | Already in project but overkill for character animation |

### State Management

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Client State | **Zustand** | Redux Toolkit | Already using Zustand, no reason to switch |
| | | Jotai | Already in project but Zustand better for persist |
| Persistence | **MMKV** | AsyncStorage | 30x slower, async hydration issues |
| | | expo-secure-store | For sensitive data only, slower for general state |

### Text-to-Speech

| Category | Current (MVP) | Future Alternative | Why Switch Later |
|----------|---------------|-------------------|------------------|
| TTS Engine | **edge-tts** | Kokoro TTS | Self-hosted, faster, more control, but requires infrastructure |
| | | ElevenLabs API | Too expensive ($0.18-0.30/1K chars), vendor lock-in |
| | | Coqui XTTS v2 | Good quality but slower than Kokoro, larger model |

---

## Architecture Pattern

### Data Flow: Auth + Database

```
┌─────────────────────────────────────────────────────────────────┐
│                     REACT NATIVE APP                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Zustand    │  │   Supabase   │  │     Rive     │         │
│  │  (UI State)  │  │   Client     │  │   (Mindi)    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘         │
│         │                  │                                     │
│         │ MMKV persist     │ JWT auth + realtime                │
│         ▼                  ▼                                     │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Local Storage│  │  Supabase    │                            │
│  │   (MMKV)     │  │   Session    │                            │
│  └──────────────┘  │ (AsyncStorage)│                            │
│                    └──────┬───────┘                             │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS (JWT bearer token)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND                              │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ JWT Validate │→ │   Supabase   │  │  edge-tts    │         │
│  │   (PyJWT)    │  │  Python SDK  │  │  (Audio Gen) │         │
│  └──────────────┘  └──────┬───────┘  └──────────────┘         │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │ Postgrest API
                             ▼
                    ┌─────────────────┐
                    │    SUPABASE     │
                    │   (PostgreSQL)  │
                    │  • Auth         │
                    │  • Database     │
                    │  • Storage      │
                    │  • Realtime     │
                    └─────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Zustand Store** | UI state, optimistic updates, local preferences | MMKV (persist), Supabase (sync) |
| **Supabase Client (RN)** | Auth state, database queries, real-time subscriptions | Zustand (state updates), FastAPI (initial auth) |
| **Rive Runtime** | Mindi character rendering, state machine | Zustand (reads state for animation triggers) |
| **MMKV** | Fast local persistence for Zustand | Zustand middleware |
| **FastAPI** | AI generation, audio mixing, protected endpoints | Supabase (data access), PyJWT (token validation) |
| **Supabase (service)** | User accounts, subliminal storage, real-time sync | FastAPI (via SDK), React Native (via SDK) |

---

## Migration Notes

### Existing Code Impacts

**What Stays:**
- React Native 0.81.5, Expo 54 (no version changes)
- Zustand state management structure
- FastAPI endpoints (add auth middleware)
- edge-tts audio generation
- FFmpeg mixing

**What Changes:**
- **Add** Supabase auth to login/signup flows
- **Replace** local-only storage with Supabase + Zustand sync
- **Add** Rive animations for Mindi character
- **Add** JWT validation to FastAPI routes
- **Add** Supabase Python client for backend database access

**Migration Checklist:**
1. Set up Supabase project (create database, enable auth)
2. Configure RLS policies for `subliminals` table
3. Add Supabase environment variables to `.env`
4. Install React Native dependencies
5. Configure `app.json` for Rive (compileSdkVersion 36)
6. Run `expo prebuild --clean` (rebuild with native code)
7. Create Rive animation file (`.riv`) with Mindi states
8. Install Python dependencies (supabase, PyJWT)
9. Add JWT validation dependency to FastAPI routes
10. Update Zustand stores to sync with Supabase

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Rive requires dev build (no Expo Go) | Medium | Document clearly, provide build commands, one-time setup |
| Expo SDK 53 + Rive Android conflicts | Medium | Use expo-custom-agp and expo-build-properties, documented solution |
| Supabase RLS misconfiguration | High | Start with restrictive policies, test with user tokens, document patterns |
| MMKV async hydration in Zustand | Low | Zustand handles async storage, use `onRehydrateStorage` callback if needed |
| PyJWT version conflicts | Low | Pin version ^2.9.0, widely used, stable API |
| edge-tts API changes | Medium | Have Kokoro TTS researched as backup, monitor edge-tts reliability |

---

## Performance Considerations

| Concern | Strategy | Expected Impact |
|---------|----------|-----------------|
| Rive animation battery drain | Use state machine idle/active states, reduce particle count during background | Minimal with proper state management |
| MMKV write frequency | Debounce Zustand state updates (e.g., save player position every 5s, not every second) | High performance, synchronous writes |
| Supabase real-time connections | Only subscribe to user's own data, unsubscribe when not needed | ~1 connection per user, negligible |
| JWT validation overhead | Validate once per request, cache user in request scope, no external API calls | <1ms per request |

---

## Success Criteria

This stack is successful if:

- [ ] User can sign up/login with email + password via Supabase
- [ ] Subliminals persist to Supabase database, sync across app restarts
- [ ] Mindi character animates with at least 4 states (idle, listening, peaceful, happy) via Rive
- [ ] Zustand + MMKV provides fast local state with Supabase sync
- [ ] FastAPI validates Supabase JWT tokens on protected routes
- [ ] No performance regressions (animations maintain 60fps)
- [ ] Development build works on Android (target platform)

---

## Open Questions

**For Implementation Phase:**
1. What Supabase RLS policies are needed for `subliminals` table? (user can CRUD own data only)
2. Who creates the Mindi `.riv` animation file? (designer needed, or use placeholder)
3. What Zustand stores need Supabase sync vs MMKV-only? (subliminals sync, UI preferences local)
4. Do we need offline mode? (Supabase caches locally, but creation requires backend)

**For Post-MVP:**
1. When to migrate from edge-tts to Kokoro TTS? (based on reliability or self-hosting need)
2. Should we add `@react-native-google-signin` for OAuth? (email/password sufficient for MVP per PRD)
3. Do we need Supabase Storage for audio files or use Cloudflare R2? (PRD mentions R2)

---

## Sources Summary

### Official Documentation (HIGH Confidence)
- [Supabase Expo React Native Guide](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)
- [Rive Expo Integration](https://rive.app/docs/runtimes/react-native/adding-rive-to-expo)
- [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)

### GitHub Repositories (HIGH Confidence)
- [supabase-js v2.93.3](https://github.com/supabase/supabase-js)
- [supabase-py v2.27.2](https://github.com/supabase/supabase-py)
- [rive-react-native](https://github.com/rive-app/rive-react-native)
- [Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI)

### Community Resources (MEDIUM Confidence)
- [FastAPI + Supabase Auth Pattern](https://dev.to/j0/integrating-fastapi-with-supabase-auth-780)
- [Zustand MMKV Storage Guide](https://dev.to/mehdifaraji/zustand-mmkv-storage-blazing-fast-persistence-for-zustand-in-react-native-3ef1)
- [PyJWT vs python-jose Discussion](https://github.com/fastapi/fastapi/discussions/11345)
- [Open Source TTS Comparison 2026](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models)

---

## Conclusion

This stack provides a **solid foundation for MVP completion** with minimal risk:

1. **Supabase** unifies auth + database + real-time (eliminates need for separate services)
2. **Rive** enables rich Mindi character with state machines (better than Lottie for this use case)
3. **Zustand + MMKV** provides fast local state with Supabase sync (best of both worlds)
4. **PyJWT** for FastAPI is the modern standard (python-jose is dead)
5. **Keep edge-tts** for MVP, explore Kokoro post-MVP (don't introduce risk)

All libraries are **actively maintained in 2026**, have **strong community support**, and **integrate cleanly with the existing React Native + FastAPI stack**.

**Next Steps:** Proceed to roadmap creation with these technology decisions locked in.
