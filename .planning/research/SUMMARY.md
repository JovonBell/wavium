# Project Research Summary

**Project:** Wavium - Subliminal Audio App MVP Completion
**Domain:** Mobile wellness app (subliminal audio + AI companion)
**Researched:** February 2, 2026
**Confidence:** HIGH

## Executive Summary

Wavium is completing an MVP that integrates Supabase authentication/database, Rive character animations (Mindi mascot), and persistent state management into an existing React Native Expo + FastAPI stack. Research shows this requires a 4-layer integration: (1) JWT-based authentication between frontend and backend, (2) optimistic offline-first sync between Zustand and Supabase, (3) emotion-driven Rive state machine, and (4) LRU-cached offline audio storage.

The recommended approach is **authentication-first, then database, then audio, then animations** to establish security boundaries before building dependent features. The stack decision of Supabase + PyJWT for backend auth, Rive Nitro runtime for animations, and Zustand + MMKV for local state is solid and actively maintained in 2026. The core risk is edge-tts reliability (Microsoft can change rate limits without notice), which requires aggressive caching and a documented migration path to self-hosted TTS like Kokoro.

Critical pitfalls include exposed API keys in git history (rotate immediately), hardcoded `/tmp` paths breaking Windows development, Supabase's 2026 API key format breaking Edge Functions, and Rive's runtime transition requiring the new Nitro version. The architecture requires careful attention to JWT verification via JWKS, WebSocket authentication, offline-first sync patterns, and animation state binding through a centralized controller hook.

## Key Findings

### Recommended Stack

Wavium's stack extension adds three critical components: Supabase (auth + database), Rive (character animations), and persistent state management (Zustand + MMKV). All libraries are actively maintained in 2026 with strong React Native and FastAPI support.

**Core technologies:**
- **Supabase-js v2.93.3 + supabase-py v2.27.2**: Unified auth/database/realtime, strong mobile SDK, free tier sufficient for MVP
- **PyJWT v2.9.0**: JWT verification for FastAPI (python-jose is abandoned), validates Supabase tokens via JWKS endpoint
- **Rive Nitro runtime (@rive-app/react-native v6.13.0+)**: State machine-based animations, single .riv file for all Mindi states, better than Lottie for interactive characters
- **Zustand + MMKV**: Fast local state (30x faster than AsyncStorage), synchronous hydration, already in project dependencies
- **Keep edge-tts v6.1.9**: Working TTS for MVP, defer Kokoro TTS migration until post-MVP when self-hosting infrastructure exists

**Critical version requirements:**
- Expo SDK 53+ requires `expo-custom-agp` 8.9.2 and `compileSdkVersion` 36 for Rive compatibility
- Rive requires development build (incompatible with Expo Go) - one-time `expo prebuild --clean` setup
- PyJWT (NOT python-jose) is the 2026 FastAPI standard for JWT validation

### Expected Features

Research identified clear table stakes vs differentiators for subliminal audio apps. Transparency (showing affirmations before/during playback) is critical for user trust and differentiates from sketchy competitors.

**Must have (table stakes):**
- Custom affirmation creation with AI generation (already built, needs auth)
- Background audio mixing (FFmpeg backend working, needs audio file selection)
- Audio playback with standard controls (play/pause/seek)
- Library view with past subliminals (needs Supabase database)
- Transparency: always show affirmations before generation (trust foundation)
- Offline audio download with caching (meditation use case requires offline)
- Daily reminder notifications (consistency drives effectiveness)
- Progress/streak tracking (universal in wellness apps)
- User accounts with cloud sync (Headspace/Calm standard)
- Voice selection options (male/female/tone variety)

**Should have (competitive differentiators):**
- AI companion character (Mindi) with emotional connection (unique to Wavium)
- Character evolution based on session count (Tamagotchi effect for retention)
- Immersive "Void" listening experience (differentiated from standard media player)
- AI-generated personalized affirmations (competitors use pre-made libraries)
- Particle effects during affirmation absorption (visual feedback reinforcement)
- Emotional state reflection in Mindi's mood (mirrors user practice quality)
- Intention-based organization (tag by goal: confidence, sleep, focus)

**Defer (v2+):**
- Mindi evolution system complexity (need baseline engagement data first)
- Advanced particle effects (polish, not core function)
- Session insights/journaling (valuable after consistent practice established)
- Multiple voice/background options (start with 1 good option to avoid decision fatigue)
- Advanced progress visualization (basic streak counter sufficient for MVP)

**Anti-features (explicitly avoid):**
- Hidden subliminal messages without disclosure (damages trust)
- Future-tense affirmations ("I will be" instead of "I am" - psychologically ineffective)
- Generic pre-made library (misses personalization value prop)
- Social features/leaderboards (meditation is private, comparison harmful)
- Character death on neglect (creates guilt, opposite of wellness)

### Architecture Approach

The integration architecture maintains clear boundaries between authentication, database sync, animations, and audio layers. Each layer has a single responsibility and communicates through well-defined interfaces.

**Major components:**

1. **Authentication Layer** (Supabase Auth + FastAPI JWT middleware)
   - Frontend uses Supabase Auth to obtain JWT
   - Backend verifies JWT via JWKS endpoint (no shared secrets)
   - WebSocket connections authenticated via query param token
   - Service role client in backend bypasses RLS for admin operations

2. **Database Sync Layer** (Zustand + Supabase)
   - Optimistic UI updates: Zustand mutates immediately, syncs to Supabase in background
   - Offline queue: failed mutations stored in AsyncStorage, retried on reconnect
   - Conflict resolution: last-write-wins for MVP (use updated_at timestamps)
   - Sync triggers: on app focus, after mutations, periodic background sync

3. **Character Animation Layer** (Rive state machine)
   - State machine inputs: listening (bool), emotion (enum), glow_level (number), trigger_generate (trigger)
   - Animation controller hook maps Zustand state changes to Rive inputs
   - Emotion mapping: idle → listening → generating → peaceful → happy → excited
   - Debounced state changes prevent animation flickering

4. **Offline Audio Layer** (expo-file-system + expo-av)
   - Download-first strategy: download after generation, cache in documentDirectory
   - LRU eviction when cache exceeds 500MB
   - Metadata tracked in AsyncStorage for fast lookups
   - Fallback to streaming on cache miss or download failure

### Critical Pitfalls

Research identified 16 pitfalls across critical/moderate/minor severity. Top 5 that will block MVP if not addressed:

1. **Exposed Groq API key in git history (Critical #5)**
   - Issue: Key committed in early commit, removing file doesn't erase history
   - Prevention: Rotate key immediately, scrub git history with BFG Repo-Cleaner, add pre-commit hooks
   - Detection: Search git history for "GROQ_API_KEY" or "sk-" prefixes

2. **edge-tts rate limiting and silent failures (Critical #2)**
   - Issue: Microsoft rate limits free Edge TTS API aggressively, 10-minute audio limit per request
   - Prevention: Aggressive caching, rate limit 1 gen/user/minute, chunk long requests, retry with backoff
   - Detection: 403 errors after multiple generations, empty/truncated audio files
   - Mitigation: Plan migration to Kokoro TTS when self-hosting infrastructure ready

3. **Hardcoded `/tmp` paths failing on Windows (Critical #4)**
   - Issue: Backend uses `/tmp/wavium` which doesn't exist on Windows (C:\Users\...\AppData\Local\Temp)
   - Prevention: Use `tempfile.gettempdir()` for platform-agnostic paths
   - Detection: FileNotFoundError on Windows, audio generation returns 500 errors
   - Impact: Blocks Windows development contributions

4. **Supabase 2026 API key migration breaking Edge Functions (Critical #1)**
   - Issue: New `sb_publishable_xxx` format causes 401 "JWT is invalid" in Edge Functions
   - Prevention: Test Edge Function auth immediately after Supabase setup, monitor GitHub discussions
   - Detection: Auth works for database but fails for Edge Functions
   - Impact: Consider database-only features until resolved

5. **Rive React Native runtime transition (Moderate #7)**
   - Issue: Old runtime broken with RN 0.80+, new Nitro runtime in preview
   - Prevention: Use Nitro runtime from day one, budget 2x estimated time, start with simple animations
   - Detection: Build failures with Kotlin version conflicts, animations freeze on initial render
   - Impact: Mindi integration takes 1 week minimum (debugging unknowns)

**Additional moderate pitfalls:**
- FFmpegKit retirement (keep mixing server-side, avoid mobile FFmpeg)
- WebSocket timeout mismatches in production (align Gunicorn/Nginx/app to 120s)
- Supabase email verification blocking sign-ups (disable for MVP or implement deep linking)
- Cross-platform audio file storage paths (use Expo FileSystem API exclusively)
- Supabase real-time subscription memory leaks (skip real-time for MVP, no collaboration needed)

**MVP anti-patterns:**
- Scope creep adding "nice to have" features (ruthlessly enforce PROJECT.md scope)
- Over-engineering for future scale (solve problems you have today, not tomorrow)
- Perfectionism blocking launch (ship at 80% done, embrace ugly MVP)

## Implications for Roadmap

Based on research, recommended 5-phase structure prioritizing authentication foundation before dependent features.

### Phase 1: Security & Foundation (Week 1)
**Rationale:** Address critical security issues and platform compatibility blockers before building new features. These are one-time fixes that unblock everything else.

**Delivers:**
- Rotated Groq API key with scrubbed git history
- Platform-agnostic temp directory paths (tempfile.gettempdir())
- Python `__init__.py` files in services/ directory
- Backend works on Windows, Mac, Linux

**Addresses:**
- Critical Pitfall #5: Exposed API key
- Critical Pitfall #4: Hardcoded /tmp paths
- Minor Pitfall #13: Missing __init__.py files

**Avoids:** Development blocked on Windows, API key abuse, mysterious import errors

**Research flag:** Standard practice, skip phase research

---

### Phase 2: Backend Hardening (Week 2)
**Rationale:** Stabilize audio generation pipeline before integrating authentication. TTS reliability is core to the product; must work before adding auth complexity.

**Delivers:**
- edge-tts rate limiting (1 generation per user per minute)
- Affirmation caching by intention hash (avoid duplicate Groq calls)
- Retry logic with exponential backoff for 403/429 errors
- Chunking for long affirmation lists (stay under 10-minute limit)
- Groq API response caching for common intentions
- Monitoring/logging for edge-tts failures

**Addresses:**
- Critical Pitfall #2: edge-tts rate limiting
- Minor Pitfall #12: Groq rate limits during testing

**Uses:**
- Existing edge-tts v6.1.9
- Existing Groq integration
- Python caching (functools.lru_cache or Redis for production)

**Avoids:** Audio generation failures in production, API rate limit blocks

**Research flag:** Standard caching patterns, skip phase research

---

### Phase 3: Supabase Authentication & Database (Week 3)
**Rationale:** Authentication is the foundation for all user-scoped features. Must complete before database persistence, offline audio (needs user_id), or session tracking.

**Delivers:**
- Supabase project setup (database schema, RLS policies)
- Frontend Supabase Auth integration (sign-up, login, session management)
- Backend JWT verification middleware (PyJWT + JWKS)
- Protected FastAPI routes with user context injection
- Database tables: users, subliminals, sessions, mindi_state
- Email verification disabled (reduce MVP friction)

**Addresses:**
- Table stakes: User accounts with sync
- Architecture: Authentication Layer
- Moderate Pitfall #9: Email verification blocking sign-ups
- Critical Pitfall #1: Test 2026 API key compatibility

**Uses:**
- @supabase/supabase-js v2.93.3
- supabase-py v2.27.2
- PyJWT v2.9.0
- expo-sqlite (Supabase dependency)

**Implements:**
- JWT verification via JWKS pattern (ARCHITECTURE.md Pattern 1)
- Service role client for backend operations

**Avoids:** Direct database access from frontend (security risk), python-jose (abandoned)

**Research flag:** NEEDS PHASE RESEARCH for Supabase RLS policies, migration setup, WebSocket auth specifics

---

### Phase 4: Offline-First Audio & Database Sync (Week 4)
**Rationale:** Depends on Phase 3 authentication (needs user_id for cache metadata). Offline audio is table stakes for meditation use case. Sync enables cloud backup.

**Delivers:**
- Audio download manager with expo-file-system
- LRU cache manager (500MB limit, last-played eviction)
- Download progress tracking UI
- Offline playback with fallback to streaming
- Zustand + Supabase sync service (optimistic updates)
- Offline mutation queue with retry logic
- Network status detection and sync triggers
- Library view with cloud-synced subliminals

**Addresses:**
- Table stakes: Audio download/offline, Library view, Cloud sync
- Architecture: Database Sync Layer, Offline Audio Layer
- Moderate Pitfall #10: Cross-platform file paths
- Anti-pattern: Storing JWT in Zustand (use Supabase session management)

**Uses:**
- expo-file-system (documentDirectory for permanent storage)
- Zustand persist with AsyncStorage
- Supabase real-time (optional, skip for MVP)

**Implements:**
- Optimistic Zustand + Supabase sync (ARCHITECTURE.md Pattern 3)
- Offline audio cache (ARCHITECTURE.md Pattern 5)

**Avoids:**
- cacheDirectory (OS can delete)
- Polling for sync (use app focus events)
- Supabase real-time subscriptions (memory leaks, not needed for single-user)

**Research flag:** Standard patterns documented in ARCHITECTURE.md, skip phase research

---

### Phase 5: Mindi Character Animations (Week 5)
**Rationale:** Can be developed in parallel with Phase 4 (no auth dependency), but benefits from completed Zustand stores for state binding. Budget extra time for Rive unknowns.

**Delivers:**
- Rive Nitro runtime integration (@rive-app/react-native v6.13.0+)
- Development build setup (expo-dev-client, expo prebuild)
- Expo SDK 53 Android configuration (compileSdkVersion 36, AGP 8.9.2)
- Mindi .riv file with state machine (idle, listening, peaceful, happy states minimum)
- Animation controller hook (useMindiAnimations)
- Event mapping: Zustand state → Rive inputs
- Particle effect trigger on generation complete (optional, nice-to-have)

**Addresses:**
- Differentiator: AI companion character with emotional states
- Architecture: Character Animation Layer
- Moderate Pitfall #7: Rive runtime transition

**Uses:**
- @rive-app/react-native (Nitro runtime, NOT old runtime)
- expo-dev-client, expo-build-properties, expo-custom-agp

**Implements:**
- Rive state machine integration (ARCHITECTURE.md Pattern 4)
- Centralized animation control (avoid scattered triggers)

**Avoids:**
- Old Rive runtime (broken with RN 0.80+)
- Expo Go (incompatible with Rive, requires dev build)
- Direct Rive input manipulation from components (use controller hook)

**Research flag:** NEEDS PHASE RESEARCH for Rive state machine design, animation file creation, Expo build configuration specifics

---

### Phase 6: Integration & MVP Launch (Week 6)
**Rationale:** Phases 1-5 complete, now connect generation pipeline to auth/database/animations and ship.

**Delivers:**
- WebSocket authentication for generation progress (or polling alternative)
- Generation events trigger Mindi animation state changes
- Session recording on audio playback completion
- Streak tracking and glow level updates
- Daily reminder notifications
- End-to-end testing on physical Android device
- Production deployment with aligned timeouts (Gunicorn/Nginx 120s)

**Addresses:**
- Table stakes: Streak tracking, Daily reminders, Playback controls
- Moderate Pitfall #8: WebSocket timeout mismatches
- Anti-pattern #14: Scope creep
- Anti-pattern #16: Perfectionism blocking launch

**Implements:**
- WebSocket auth pattern (ARCHITECTURE.md Pattern 2) OR polling (simpler for MVP)
- Session tracking integration
- Notification scheduling

**Avoids:**
- Adding "nice to have" features (social, journaling, voice options)
- Polishing animations endlessly (ship with 4 basic Mindi states)
- Waiting for 100% bug-free (ship with known minor bugs documented)

**Research flag:** Standard integration, skip phase research

---

### Phase Ordering Rationale

**Why authentication before database:** JWT verification middleware must be in place before creating user-scoped database endpoints. Can't filter subliminals by user_id without verified user context.

**Why backend hardening before auth:** TTS reliability is independent of auth and must work for the app to be useful. Validate core audio pipeline before adding auth complexity. Faster to debug without JWT verification in the mix.

**Why audio/sync together:** Both depend on authentication (user_id for cache metadata and database queries). Audio download and library sync are closely coupled features (downloaded audio should appear in cloud-synced library).

**Why animations can parallelize:** Rive integration has no auth dependency. Can develop Mindi states while Phase 4 progresses, then integrate in Phase 6. But budget 1 week minimum for Rive debugging (Pitfall #7).

**Why integration is final phase:** Can't test WebSocket auth until Phase 3 completes. Can't trigger Mindi state changes until Phase 5 delivers animation controller. Session recording requires Phase 4 database sync.

**Dependency chain:**
```
Phase 1 (foundation) → Phase 2 (backend) → Phase 3 (auth)
                                              ↓
                                    Phase 4 (audio/sync) ← Phase 5 (animations, parallel)
                                              ↓
                                    Phase 6 (integration)
```

### Research Flags

**Phases needing `/gsd:research-phase` during planning:**

- **Phase 3 (Supabase Auth):** Complex integration with multiple moving parts
  - Reason: Supabase RLS policy design needs research (which tables, what permissions)
  - Reason: Migration strategy for existing data (if any) needs planning
  - Reason: WebSocket auth with JWT in query params has edge cases (token refresh mid-connection)
  - Reason: 2026 API key compatibility issues need GitHub monitoring

- **Phase 5 (Rive Animations):** New runtime in preview, sparse production examples
  - Reason: Rive .riv file creation workflow (who designs? tooling? export process?)
  - Reason: State machine design patterns for emotion-driven character
  - Reason: Expo SDK 53 build configuration changes (AGP version, compileSdk)
  - Reason: Nitro runtime API differences from old runtime (migration guide needed)

**Phases with standard patterns (skip research):**

- **Phase 1 (Security):** Straightforward fixes, well-documented approaches
- **Phase 2 (Backend):** Standard caching and rate limiting patterns
- **Phase 4 (Audio/Sync):** Patterns fully documented in ARCHITECTURE.md
- **Phase 6 (Integration):** Combines existing patterns from earlier phases

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified with official 2026 releases, strong community support, active maintenance |
| Features | MEDIUM | WebSearch-based research with competitor analysis cross-reference, but no user interviews to validate priorities |
| Architecture | HIGH | Multiple production examples for each pattern, official Supabase/Rive docs, established React Native practices |
| Pitfalls | HIGH | Sourced from official GitHub issues (Supabase 2026 keys), library retirement notices (FFmpegKit), and current codebase analysis |

**Overall confidence:** HIGH

Research is well-grounded in official documentation, recent 2026 sources, and cross-referenced across multiple articles. Stack recommendations align with modern best practices. Architecture patterns are production-proven. Pitfalls are concrete and actionable.

### Gaps to Address

**During Phase 3 planning:**
- Exact Supabase RLS policy definitions for subliminals, sessions, mindi_state tables
- Migration strategy if existing local data needs cloud migration
- WebSocket token refresh handling (what happens if JWT expires during long generation?)
- Monitoring approach for Supabase 2026 API key Edge Function compatibility

**During Phase 5 planning:**
- Mindi .riv file creation workflow (design asset pipeline)
- State machine input/output mapping (how many states, what triggers, transition rules)
- Expo build configuration for Rive on SDK 53 (validate exact plugin versions)
- Fallback strategy if Rive Nitro runtime proves unstable (PNG sequence? Lottie?)

**During Phase 6 planning:**
- WebSocket vs polling decision for generation progress (tradeoff: real-time UX vs deployment complexity)
- Session recording logic (when to increment streak? require minimum listen duration?)
- Notification permissions flow (iOS requires prompt, Android more permissive)

**Post-MVP migration flags:**
- edge-tts → Kokoro TTS when rate limits cause user complaints or Microsoft blocks service
- Consider Auth0 or custom auth at 10K+ users (more analytics/control)
- Add conflict detection for sync (last-write-wins breaks down at scale)

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Supabase Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) - Auth integration, session management
- [Rive Expo Integration Guide](https://rive.app/docs/runtimes/react-native/adding-rive-to-expo) - Build configuration, state machine setup
- [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) - AsyncStorage integration patterns
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) - JWT verification patterns
- [Expo FileSystem Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/) - Audio caching, file management

**GitHub Repositories:**
- [supabase-js v2.93.3 Release](https://github.com/supabase/supabase-js) - Latest features, migration notes
- [supabase-py v2.27.2](https://github.com/supabase/supabase-py) - Python SDK capabilities
- [rive-react-native](https://github.com/rive-app/rive-react-native) - Runtime status, known issues
- [Rive Nitro runtime](https://github.com/rive-app/rive-nitro-react-native) - New architecture preview

**Critical Issues:**
- [Supabase 2026 API key breaking Edge Functions](https://github.com/orgs/supabase/discussions/41834) - Production blocker
- [FFmpegKit shutdown notice](https://www.itpathsolutions.com/ffmpegkit-shutdown-what-to-do-next) - Retirement timeline
- [FastAPI PyJWT discussion](https://github.com/fastapi/fastapi/discussions/11345) - python-jose deprecation

### Secondary (MEDIUM confidence)

**Community Guides:**
- [Integrating FastAPI with Supabase Auth](https://dev.to/j0/integrating-fastapi-with-supabase-auth-780) - JWT middleware patterns
- [Zustand MMKV Storage Guide](https://dev.to/mehdifaraji/zustand-mmkv-storage-blazing-fast-persistence-for-zustand-in-react-native-3ef1) - Performance benchmarks
- [Avoid Common Supabase Gotchas in React Native](https://www.prosperasoft.com/blog/database/supabase/supabase-react-native-gotchas/) - Email verification, memory leaks
- [Deploying WebSocket Applications with FastAPI](https://hexshift.medium.com/deploying-websocket-applications-built-with-fastapi-using-uvicorn-gunicorn-and-nginx-04249b1cb87d) - Production timeout configuration

**Feature Research:**
- [Best Affirmations Apps 2025](https://blog.theiam.app/blogs/the-best-affirmations-apps) - Table stakes analysis
- [Finch App Wiki](https://finch.fandom.com/wiki/Finch_App) - Virtual pet engagement patterns
- [Tamagotchi Effect](https://en.wikipedia.org/wiki/Tamagotchi_effect) - Character attachment psychology

**Pitfall Research:**
- [edge-tts common errors](https://pyvideotrans.com/edgetts-error/) - Rate limiting, audio limits
- [Rive React Native maintenance status](https://github.com/rive-app/rive-react-native/issues/369) - Runtime transition context
- [MVP development mistakes](https://www.tresastronautas.com/en/blog/common-mistakes-in-mvp-development-essential-tips-for-success) - Anti-pattern validation

### Tertiary (LOW confidence, needs validation)

**Emerging Technologies:**
- [Kokoro TTS](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models) - Post-MVP alternative, limited production examples
- [Kokoro FastAPI wrapper](https://github.com/remsky/Kokoro-FastAPI) - Integration path, new project (needs vetting)

---

*Research completed: February 2, 2026*

*Ready for roadmap: Yes*

*Next steps: Orchestrator should proceed to requirements definition with Phase 1-6 structure as starting point.*
