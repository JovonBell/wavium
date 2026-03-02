# Domain Pitfalls: MVP Completion with Supabase, Rive, and Audio Processing

**Domain:** Subliminal audio app MVP completion
**Researched:** 2026-02-02
**Confidence:** HIGH (Supabase, edge-tts, FastAPI), MEDIUM (Rive animations)

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or major production issues.

### Pitfall 1: Supabase 2026 API Key Migration Breaking Edge Functions
**What goes wrong:** After migrating to the new 2026 API key format (`sb_publishable_xxx`), Edge Function calls return 401 Unauthorized errors with "JWT is invalid". The Supabase Gateway expects a legacy JWT format for authentication and fails to validate the new API key format.

**Why it happens:** Supabase introduced new API key formats in 2026, but the gateway validation hasn't been fully updated. The client SDK passes the new format, but Edge Functions reject it.

**Consequences:**
- All authenticated API calls fail with cryptic 401 errors
- Hours of debugging JWT validation logic that's actually correct
- Edge Functions work in development but fail in production

**Prevention:**
- Test Edge Function authentication immediately after Supabase setup
- Monitor Supabase GitHub discussions for updates on the 2026 API key issue
- Consider using database-only features until Edge Functions are stable with new keys
- Keep fallback to legacy auth format documented if needed

**Detection:**
- Edge Function calls return "JWT is invalid" despite valid session
- Auth works for database queries but fails for Edge Functions
- Discrepancy between local development and production behavior

**Phase mapping:** Database Integration phase (must validate before production)

**Source:** [Supabase GitHub Discussion #41834](https://github.com/orgs/supabase/discussions/41834)

---

### Pitfall 2: edge-tts Rate Limiting and Silent Failures
**What goes wrong:** Microsoft recently implemented aggressive rate limiting on the free Edge TTS API that edge-tts uses. Too many requests from the same IP trigger 403 blocks without warning. Additionally, there's a 10-minute audio limit per request that isn't documented clearly.

**Why it happens:** edge-tts is an unofficial wrapper around Microsoft Edge's browser TTS service. Microsoft can change rate limits, API requirements, or block access entirely without notice. It's free because it's meant for browser use, not production apps.

**Consequences:**
- Audio generation suddenly fails after working fine in development
- Users get cryptic errors during audio generation (the core feature)
- No way to detect rate limits before hitting them
- Silent failures on long affirmation lists that exceed 10-minute limit
- **App becomes unusable if Microsoft blocks the service**

**Prevention:**
1. **Implement aggressive caching:** Never regenerate audio that already exists
2. **Rate limit on your side first:** Max 1 generation per user per minute
3. **Chunk long requests:** Split affirmation lists to stay under 10-minute audio limit
4. **Add retry logic with exponential backoff:** Handle 403/429 gracefully
5. **Monitor for blocks:** Log all edge-tts failures with timestamps and IPs
6. **Plan migration path:** Document alternative TTS providers (ElevenLabs, Google TTS, AWS Polly)
7. **Pre-generate sample audio:** Ship app with example subliminals so users can test before generating

**Detection:**
- 403 errors from edge-tts after multiple successful generations
- Audio generation works for first few requests, then fails
- Timeouts on requests with 15+ affirmations
- Empty/truncated audio files without error messages

**Phase mapping:**
- MVP Completion: Add rate limiting and caching NOW
- Post-MVP: Migrate to paid TTS if edge-tts becomes unreliable

**Sources:**
- [edge-tts Common Errors](https://pyvideotrans.com/edgetts-error/)
- [edge-tts GitHub Issues](https://github.com/rany2/edge-tts/issues)
- [Long text producing incomplete audio](https://github.com/rany2/edge-tts/issues/190)

---

### Pitfall 3: FFmpegKit Retirement Breaking Audio Processing
**What goes wrong:** FFmpegKit was officially retired on January 6, 2025, with all native binaries for Android/iOS being removed by April 1, 2025. Apps using FFmpegKit for audio mixing will break without notice.

**Why it happens:** The current codebase references audio mixing (affirmations + background soundscape), which likely requires FFmpeg. The most popular React Native FFmpeg library is now deprecated.

**Consequences:**
- Audio mixing pipeline breaks completely
- No official migration path documented
- Alternative libraries have different APIs (rewrite needed)
- Build failures on new Android/iOS versions

**Prevention:**
1. **Audit current FFmpeg usage:** Check if backend uses FFmpeg for mixing (not visible in current TTS-only code)
2. **Use VideoKit-FFmpeg-Android:** Actively maintained FFmpeg wrapper with Gradle integration
3. **Or use native audio libraries:** React Native has expo-av and react-native-audio for simple mixing
4. **Backend-side mixing:** Keep FFmpeg in Python backend (more stable than mobile FFmpeg)
5. **Pre-mixed audio option:** Ship background tracks pre-mixed with silence for layering

**Detection:**
- Build failures on Android with FFmpeg dependencies
- Audio mixing functions return undefined or throw "module not found"
- App crashes when attempting to mix affirmations with background audio

**Phase mapping:**
- Pre-MVP: Confirm FFmpeg isn't in React Native dependencies
- MVP: Keep mixing on backend (Python + FFmpeg is stable)
- Post-MVP: If mobile mixing needed, use VideoKit-FFmpeg-Android

**Sources:**
- [FFmpegKit Shutdown Notice](https://www.itpathsolutions.com/ffmpegkit-shutdown-what-to-do-next)
- [FFmpeg in Android with Example](https://www.geeksforgeeks.org/android/how-to-use-ffmpeg-in-android-with-example/)

---

### Pitfall 4: Hardcoded `/tmp` Paths Failing on Windows
**What goes wrong:** The current codebase (PROJECT.md confirms this) hardcodes `/tmp/wavium` for temporary audio files. This fails on Windows (where temp is `C:\Users\{user}\AppData\Local\Temp`) and causes silent failures or crashes.

**Why it happens:** Developer wrote code on Mac/Linux without testing cross-platform paths. Python's `os.path.join()` helps but doesn't solve the root directory issue.

**Consequences:**
- Backend fails to start on Windows development machines
- Audio files can't be written, generation silently fails
- File not found errors when serving generated audio
- Blocks Windows developers from contributing

**Prevention:**
1. **Use platform-agnostic temp directory:**
   ```python
   import tempfile
   TEMP_DIR = tempfile.gettempdir()
   OUTPUT_DIR = os.path.join(TEMP_DIR, "wavium")
   ```
2. **Or use project-relative paths:**
   ```python
   OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "audio_output")
   ```
3. **Document dev environment requirements:** If backend must run on Linux, say so explicitly
4. **CI/CD on multiple platforms:** Test builds on Windows, Mac, Linux

**Detection:**
- FileNotFoundError or PermissionError on Windows when generating audio
- Backend starts but audio generation endpoint returns 500 errors
- Audio files written but not accessible at expected URLs

**Phase mapping:**
- Immediate fix: This blocks Windows development (already identified in PROJECT.md)

**Source:** Current codebase analysis + standard Python cross-platform practice

---

### Pitfall 5: Exposed API Keys in Git History
**What goes wrong:** PROJECT.md confirms a Groq API key was exposed in git history. Even after removing the key from current files, it remains in git history forever. Attackers scan public repos for keys in commits.

**Why it happens:** Developer committed `.env` file or hardcoded key before adding `.gitignore`. Removing the file in a later commit doesn't erase history.

**Consequences:**
- Exposed Groq API key gets scraped and abused
- Unexpected API bills (if Groq charges for overuse)
- Rate limits hit because others are using your key
- Security audit failure before launch

**Prevention:**
1. **Rotate the key immediately:** Generate new Groq API key, revoke old one
2. **Purge git history:**
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch backend/.env' \
   --prune-empty --tag-name-filter cat -- --all
   ```
   **OR use BFG Repo-Cleaner** (faster, safer)
3. **Force push cleaned history:** `git push origin --force --all`
4. **Audit for other secrets:** Check for Supabase keys, R2 credentials, etc.
5. **Use environment variables exclusively:** Never commit secrets
6. **Add pre-commit hooks:** Tools like `detect-secrets` or `git-secrets`

**Detection:**
- Search git history for "GROQ_API_KEY" or "sk-" prefixes
- GitHub secret scanning alerts (if repo becomes public)
- Unexpected API usage in Groq dashboard

**Phase mapping:**
- **IMMEDIATE:** Rotate key before any other work (already compromised)

**Source:** Current project context (PROJECT.md)

---

### Pitfall 6: Supabase Real-time Subscription Memory Leaks
**What goes wrong:** Subscribing to Supabase real-time channels in React Native components without unsubscribing on unmount causes memory leaks. Each re-render creates a new subscription, and zombie subscriptions keep piling up.

**Why it happens:** Real-time subscriptions maintain WebSocket connections. If the component unmounts without calling `unsubscribe()`, the connection persists and continues receiving data that nobody is listening for.

**Consequences:**
- App memory usage grows over time (especially on Android)
- Multiple duplicate updates for the same data (doubled, tripled subscriptions)
- WebSocket connection limits hit (Supabase has per-connection limits)
- App becomes sluggish or crashes after extended use

**Prevention:**
1. **Always unsubscribe in cleanup:**
   ```typescript
   useEffect(() => {
     const subscription = supabase
       .channel('subliminals')
       .on('postgres_changes', { ... }, handler)
       .subscribe()

     return () => {
       subscription.unsubscribe()
     }
   }, [])
   ```
2. **Use Zustand stores for subscriptions:** Centralize subscriptions in state stores, not components
3. **Avoid subscriptions for MVP:** Real-time is overkill for this app (only one user, no collaboration)
4. **Monitor active connections:** Log subscription count in development

**Detection:**
- Memory profiler shows growing heap size over time
- Same data appears twice in UI after navigating back to a screen
- "Max subscriptions reached" errors in Supabase logs
- App performance degrades during long sessions

**Phase mapping:**
- Database Integration: Skip real-time subscriptions for MVP
- Post-MVP: Only add real-time if collaborative features are added

**Sources:**
- [Avoid Common Supabase Gotchas in React Native](https://www.prosperasoft.com/blog/database/supabase/supabase-react-native-gotchas/)
- [Supabase Docs: React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or require refactoring.

### Pitfall 7: Rive React Native Runtime Transition
**What goes wrong:** The original Rive React Native library couldn't build with React Native 0.80+ (released July 2025). A critical glitching bug took 6 months to resolve. There's now a new Nitro-based runtime in development preview, but the API may change.

**Why it happens:** Rive is rebuilding their React Native runtime using Nitro (new architecture). The old runtime is effectively deprecated but not officially sunset. The new one is functional but in preview.

**Consequences:**
- Time invested in learning old API becomes wasted if it breaks
- Migration to new runtime mid-MVP causes delays
- New runtime bugs without Stack Overflow solutions (too new)
- Android error messages are non-descriptive in RN 0.78-0.79 (fixed in 0.80)

**Prevention:**
1. **Use the new Nitro runtime from day one:** `rive-nitro-react-native` (preview but actively maintained)
2. **Pin React Native to 0.80+:** Solves Android error message issues
3. **Start with simple Rive files:** Test state machine transitions before creating complex Mindi animations
4. **Create fallback static animations:** PNG sequence as backup if Rive breaks
5. **Budget extra time:** Rive integration will take 2x longer than estimated (debugging unknowns)

**Detection:**
- Build failures on Android with Kotlin version conflicts (needs 1.8.0+)
- iOS build errors requiring deployment target bump to 14.0+
- Duplicate class errors during Android build
- Animations freeze or reset on initial render

**Phase mapping:**
- Mindi Character: Allocate 1 week for Rive debugging alone
- MVP: Keep Mindi animations simple (idle, listening, generating states only)
- Post-MVP: Add complex emotional states after proving Rive stability

**Sources:**
- [Maintenance status of Rive React Native](https://github.com/rive-app/rive-react-native/issues/369)
- [Rive Nitro React Native (new runtime)](https://github.com/rive-app/rive-nitro-react-native)
- [Lag on initial Rive render](https://community.rive.app/c/support/lag-and-reset-on-initial-rive-render-critical-for-onboarding-react-native)

---

### Pitfall 8: FastAPI WebSocket Timeout Mismatches in Production
**What goes wrong:** Default 30-second timeout in Gunicorn kills active WebSocket workers mid-stream. If Nginx, Gunicorn, and application timeouts aren't aligned, audio generation progress streams disconnect randomly.

**Why it happens:** Audio generation (Groq AI + TTS + mixing) can take 30-60 seconds. Gunicorn's worker timeout assumes short-lived HTTP requests. WebSockets are persistent connections that need different timeout handling.

**Consequences:**
- Progress updates stop after 30 seconds, but generation continues silently
- Users see "Connection lost" errors during long generations
- Partial audio files written but never delivered
- Works in development (Uvicorn alone) but fails in production (Gunicorn + Nginx)

**Prevention:**
1. **Increase Gunicorn timeout for WebSocket workers:**
   ```bash
   gunicorn -k uvicorn.workers.UvicornWorker --timeout 120 main:app
   ```
2. **Align all timeouts:**
   - Gunicorn: 120 seconds
   - Nginx `proxy_read_timeout`: 120 seconds
   - Application-level timeout: 120 seconds
3. **Send keepalive pings:** Ping client every 15 seconds during generation to keep connection alive
4. **Implement session resumption:** Allow client to reconnect mid-generation and resume progress
5. **Or avoid WebSockets for MVP:** Use polling with status endpoint (simpler, more reliable)

**Detection:**
- WebSocket connections close after exactly 30 seconds
- Generation completes but client never receives final message
- Works locally with `uvicorn` but fails on deployed backend
- Nginx logs show 502 Bad Gateway during long requests

**Phase mapping:**
- Backend Deployment: Test audio generation end-to-end with production-like setup
- MVP: Consider polling instead of WebSockets (simpler debugging)

**Sources:**
- [Deploying WebSocket Applications with FastAPI](https://hexshift.medium.com/deploying-websocket-applications-built-with-fastapi-using-uvicorn-gunicorn-and-nginx-04249b1cb87d)
- [FastAPI WebSocket Production Best Practices](https://render.com/articles/fastapi-production-deployment-best-practices)
- [Zero-Downtime WebSocket Deployment Strategies](https://hexshift.medium.com/zero-downtime-websocket-deployment-strategies-with-fastapi-2e2df9ebfe3d)

---

### Pitfall 9: Supabase Email Verification Blocking Sign-ups
**What goes wrong:** By default, Supabase Auth requires email verification before creating a session for new users. If the app doesn't implement deep link handling for email verification, users complete sign-up but can't log in.

**Why it happens:** Supabase assumes you'll handle email verification links that redirect back to the app. React Native needs Expo linking configuration and deep link handlers to catch these.

**Consequences:**
- Users sign up successfully but see "Email not verified" errors
- Email verification links open in browser, not in app
- No way to complete verification flow from mobile device
- Support tickets: "I signed up but can't log in"

**Prevention:**
1. **Disable email verification for MVP:**
   ```typescript
   // Supabase Dashboard → Authentication → Email Auth → Disable "Confirm email"
   ```
2. **Or implement deep linking properly:**
   - Configure `app.json` with URL scheme: `wavium://`
   - Handle `wavium://auth/confirm` in app
   - Supabase dashboard: Set redirect URL to custom scheme
3. **Use magic links instead:** No password + no verification needed
4. **Show clear instructions:** If verification required, tell users to check email

**Detection:**
- Users report "Email not confirmed" errors after sign-up
- Verification emails work, but links open in Safari/Chrome instead of app
- Session is null after sign-up despite successful registration
- Supabase logs show "email not verified" auth attempts

**Phase mapping:**
- Authentication Phase: Test sign-up flow end-to-end on physical device
- MVP: Disable email verification to reduce friction

**Sources:**
- [Supabase React Native Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Supabase Gotchas: Email Verification](https://www.prosperasoft.com/blog/database/supabase/supabase-react-native-gotchas/)

---

### Pitfall 10: Cross-Platform Audio File Storage Paths
**What goes wrong:** React Native audio playback requires platform-specific file paths. iOS uses `file://` URIs, Android uses content URIs or absolute paths, and caching directories differ between platforms.

**Why it happens:** Each platform has different file system security models. iOS sandboxes apps strictly, Android has shared storage vs app-private storage, and Expo's FileSystem API abstracts this but can still leak platform quirks.

**Consequences:**
- Audio downloads succeed but playback fails with "file not found"
- Files disappear after app restart (written to cache, OS clears it)
- Offline playback works on iOS but fails on Android (or vice versa)
- Storage path formatted correctly for one platform breaks the other

**Prevention:**
1. **Use Expo FileSystem exclusively:**
   ```typescript
   import * as FileSystem from 'expo-file-system'
   const audioPath = FileSystem.documentDirectory + 'subliminals/' + filename
   ```
2. **Use `documentDirectory` for permanent storage:** Not `cacheDirectory` (OS can delete)
3. **Handle platform differences with FileSystem API:**
   - Expo handles `file://` prefix automatically
   - Don't construct file paths manually
4. **Test on both platforms:** Android 13+ has different storage permissions
5. **Handle missing files gracefully:** Check file exists before playback

**Detection:**
- Audio playback throws "source not found" on one platform but works on another
- Downloaded files don't persist after app restart
- Android 13+ throws permission errors despite requesting storage permission
- Files visible in file explorer but app can't access them

**Phase mapping:**
- Audio Download Implementation: Test on physical Android and iOS devices
- MVP: Android-only reduces testing surface

**Sources:**
- [Expo FileSystem Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [React Native Audio Playback Offline Storage](https://rntp.dev/docs/guides/offline-playback)
- [Platform-Specific Modules in Expo](https://docs.expo.dev/router/advanced/platform-specific-modules/)

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

### Pitfall 11: CORS Misconfiguration Blocking React Native
**What goes wrong:** Backend currently allows all origins (`allow_origins=["*"]`), which is flagged in PROJECT.md for production. But React Native doesn't send Origin headers like browsers do, so CORS can break unexpectedly when tightened.

**Why it happens:** CORS is a browser security feature. React Native fetch() doesn't enforce CORS, but some middleware or CDN layers do. Changing from `*` to specific domains can break mobile app without warning.

**Consequences:**
- Works in development, fails in production after CORS lockdown
- Confusing "Network request failed" errors with no CORS details
- Works in Expo Go, fails in standalone app

**Prevention:**
1. **Test CORS changes with production build:** Not just Expo Go
2. **Whitelist specific origins for web, keep permissive for mobile:**
   ```python
   origins = ["https://wavium.app"]  # Web only
   if request.headers.get("User-Agent", "").startswith("wavium-mobile"):
       origins.append("*")
   ```
3. **Or use API key authentication instead of CORS:** Better mobile security model
4. **Don't rely on CORS for mobile security:** Not enforced client-side

**Detection:**
- Network requests fail with "CORS policy" errors (rare in RN, but possible)
- Requests work from Postman but fail from app
- Production app can't reach API despite correct URL

**Phase mapping:**
- Backend Deployment: Document CORS configuration for mobile vs web

**Source:** Current codebase analysis + FastAPI CORS documentation

---

### Pitfall 12: Groq API Rate Limits During Testing
**What goes wrong:** Groq's free tier has rate limits (requests per minute, tokens per day). Rapid testing of affirmation generation hits limits quickly, breaking development flow.

**Why it happens:** Each test run generates affirmations, burning through rate limits. No caching means same intention generates new API calls every time.

**Consequences:**
- Development blocked when rate limit is hit
- Manual waiting for rate limit reset (1 minute or 24 hours)
- Frustration during debugging ("it worked a minute ago")

**Prevention:**
1. **Cache affirmations by intention hash:**
   ```python
   cache_key = hashlib.md5(intention.encode()).hexdigest()
   if cache_key in cache:
       return cache[cache_key]
   ```
2. **Use mock responses in tests:** Don't hit real API during unit tests
3. **Implement response fixtures:** Pre-generated affirmations for common intentions
4. **Monitor rate limit headers:** Groq returns rate limit info in response headers
5. **Add retry with exponential backoff:** Handle 429 errors gracefully

**Detection:**
- Groq API returns 429 "Rate limit exceeded" errors
- Affirmation generation fails intermittently during rapid testing
- Works once, then fails on retry without code changes

**Phase mapping:**
- Backend Development: Add caching before extensive testing

**Source:** Standard API rate limiting practice + Groq API documentation

---

### Pitfall 13: Missing Python `__init__.py` Files Breaking Imports
**What goes wrong:** PROJECT.md flags this issue: backend services lack `__init__.py` files. Without them, Python can't import modules properly, causing "ModuleNotFoundError" at runtime.

**Why it happens:** Python 3.3+ made `__init__.py` optional for namespace packages, but it's still best practice and required in some deployment environments.

**Consequences:**
- `from services.groq_service import generate_affirmations` fails
- Works in development (loose import resolution) but fails in Docker
- Confusing import errors that aren't consistent across environments

**Prevention:**
1. **Add `__init__.py` to every Python package directory:**
   ```bash
   touch backend/services/__init__.py
   ```
2. **Even empty files work:** They signal "this is a package"
3. **Add to CI checks:** Fail build if `__init__.py` is missing in package dirs

**Detection:**
- ModuleNotFoundError despite files existing at the path
- Works when running `python main.py` but fails when running as package
- Docker builds fail with import errors

**Phase mapping:**
- Immediate fix: Takes 10 seconds, prevents mysterious bugs

**Source:** Current project context (PROJECT.md)

---

## MVP Completion Anti-Patterns

### Pitfall 14: Scope Creep via "Nice to Have" Features
**What goes wrong:** During MVP completion, the temptation to add "quick wins" derails focus. Features like social sharing, analytics, push notifications, or custom voice upload feel small but each adds days of work and testing.

**Why it happens:** ~60% complete feels like the finish line is close, so adding "one more feature" seems harmless. But each feature has integration, testing, and edge case handling that balloons scope.

**Consequences:**
- MVP timeline extends from 2 weeks to 2 months
- Core features remain buggy because attention is split
- User testing delayed because "one more feature" is always needed
- App never ships because definition of "complete" keeps changing

**Prevention:**
1. **Ruthlessly enforce the MVP scope in PROJECT.md:**
   - Out of scope list is gospel
   - New ideas go into "Post-MVP" document
2. **Ask "Does missing this break the core experience?"**
   - If no: defer it
3. **Set hard deadline:** Ship MVP by X date regardless of "nice to haves"
4. **Track "won't do" list:** Celebrate saying no to features
5. **User test with gaps:** Better to ship and learn than polish in a vacuum

**Detection:**
- Roadmap keeps expanding with new tickets
- "Just one more thing" becomes a daily phrase
- Core features like authentication are still buggy but polishing UI
- Launch date slips repeatedly

**Phase mapping:**
- Entire MVP: Review PROJECT.md weekly to prevent scope drift

**Sources:**
- [Common Mistakes in MVP Development](https://www.tresastronautas.com/en/blog/common-mistakes-in-mvp-development-essential-tips-for-success)
- [Building an MVP? Avoid These 15 Common Mistakes](https://www.lowcode.agency/blog/mvp-development-challenges-mistakes)
- [How to Prevent Scope Creep in MVP](https://imaginovation.net/blog/prevent-scope-creep-mvp-development/)

---

### Pitfall 15: Over-Engineering Solutions for Future Scale
**What goes wrong:** Adding Redis for caching, implementing microservices, setting up Kubernetes, or building complex state machines for "when we have 10K users" — all while having zero users.

**Why it happens:** Engineering excitement about solving scale problems. Architecture patterns from big tech blogs feel professional. Fear that "we'll regret not doing this right."

**Consequences:**
- Development velocity tanks (configuring infrastructure instead of building features)
- Bugs multiply with architectural complexity
- MVP never ships because "the foundation isn't ready"
- Simple problems solved with complex tools (using a cannon to kill a fly)

**Prevention:**
1. **Solve problems you have today, not problems you might have tomorrow**
2. **Default to simple:**
   - Database caching > Redis (Supabase has built-in caching)
   - Monolith > Microservices (FastAPI + RN app is fine)
   - Single server > Load balancer (handle 100 users first)
3. **Budget for refactoring:** Accept you'll rebuild parts later (that's healthy)
4. **Validate before optimizing:** Get 100 users before worrying about 10K users

**Detection:**
- Architecture diagrams have more boxes than features
- Using buzzwords like "event-driven" or "eventually consistent" for MVP
- Spending days configuring infrastructure, weeks since last user-facing feature
- Teammates ask "why are we doing this?" and answer is "for scale"

**Phase mapping:**
- Entire MVP: Review architecture decisions for "do we need this today?"

**Sources:**
- [MVP Development Cost & Budget Breakdown](https://gainhq.com/blog/mvp-development-cost/)
- [Top 5 Pre-requisites Before Building Your MVP](https://www.creolestudios.com/top-5-pre-requisites-you-should-consider-before-building-your-mvp/)

---

### Pitfall 16: Perfectionism Blocking MVP Launch
**What goes wrong:** Refusing to ship until every animation is perfect, every error message is polished, every edge case is handled. Chasing 100% quality for 0% users.

**Why it happens:** Emotional investment in the product. Fear of judgment ("what if people think it's ugly?"). Conflating MVP with final product.

**Consequences:**
- Months of polishing instead of shipping
- Building features nobody asked for (assumed needs)
- Competitor ships first with worse product but wins
- Burnout from endless refinement without validation

**Prevention:**
1. **Define "done" as "usable" not "perfect":**
   - Can a user create and listen to a subliminal? Ship it.
2. **Ship with known bugs (if non-blocking):**
   - Document them, fix after user feedback
3. **Embrace ugly MVP:** Airbnb's first site was hideous, worked anyway
4. **Time-box polish:** 20% of time for polish, 80% for functionality
5. **Get embarrassed by v1:** If you're not embarrassed, you waited too long

**Detection:**
- Using words like "just needs a bit more polish" for weeks
- Redesigning completed features instead of building missing ones
- Fear of showing anyone the app
- Blocked on subjective quality judgments ("does this feel right?")

**Phase mapping:**
- Final MVP Week: Ship even if it feels 80% done

**Sources:**
- [Common Mistakes When Building an MVP](https://www.fsk.ventures/resources/common-mistakes-made-when-building-an-mvp-and-how-to-avoid-them)
- [MVP Scoping: When and How to Do It Right](https://www.upsilonit.com/blog/how-to-define-mvp-scope-tips-for-those-planning-development)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Security & Key Rotation | Exposed Groq key still in git history (Critical #5) | Rotate key immediately, scrub git history with BFG |
| Supabase Authentication | Email verification blocking sign-ups (Moderate #9) | Disable verification for MVP or implement deep linking |
| Supabase Integration | 2026 API key breaking Edge Functions (Critical #1) | Test Edge Functions early, monitor GitHub for updates |
| Rive Animation Integration | Build failures with old runtime (Moderate #7) | Use Nitro runtime from day one, budget 2x estimated time |
| Audio Generation Pipeline | edge-tts rate limiting silently failing (Critical #2) | Add rate limiting, caching, retry logic, plan TTS migration |
| Audio Mixing Implementation | FFmpegKit retirement breaking mobile FFmpeg (Critical #3) | Keep mixing server-side, avoid mobile FFmpeg for MVP |
| Backend Deployment | WebSocket timeout mismatches (Moderate #8) | Align Gunicorn/Nginx/app timeouts to 120s, or use polling |
| File Path Handling | Hardcoded `/tmp` failing on Windows (Critical #4) | Use `tempfile.gettempdir()` or project-relative paths |
| Offline Audio Storage | Cross-platform path handling breaking playback (Moderate #10) | Use Expo FileSystem API exclusively, test on both platforms |
| Roadmap Planning | Scope creep adding non-essential features (Anti-pattern #14) | Ruthlessly enforce PROJECT.md scope, defer everything else |
| Final MVP Week | Perfectionism preventing launch (Anti-pattern #16) | Define "done" as usable, ship with known minor bugs |

---

## Research Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Supabase + React Native | HIGH | Official docs + community articles + 2026-specific GitHub issues |
| edge-tts reliability | HIGH | Multiple sources confirm rate limiting + 10-min audio limit |
| Rive animations | MEDIUM | New Nitro runtime is preview status, limited production experience |
| FFmpeg mobile | HIGH | FFmpegKit retirement is official + documented alternatives |
| FastAPI WebSockets | HIGH | Multiple production deployment guides + known timeout issues |
| MVP anti-patterns | HIGH | Multiple 2026 resources + consistent patterns across sources |

---

## Critical Path for MVP

To minimize pitfalls during MVP completion, address in this order:

1. **Week 1 - Security & Stability:**
   - Rotate Groq API key (Critical #5)
   - Fix hardcoded `/tmp` path (Critical #4)
   - Add Python `__init__.py` files (Minor #13)

2. **Week 2 - Backend Foundation:**
   - Implement edge-tts rate limiting & caching (Critical #2)
   - Test Supabase 2026 API key compatibility (Critical #1)
   - Add Groq API response caching (Minor #12)

3. **Week 3 - Frontend Integration:**
   - Integrate Supabase auth (disable email verification) (Moderate #9)
   - Connect frontend to backend API (avoid direct Groq calls)
   - Test audio download with Expo FileSystem (Moderate #10)

4. **Week 4 - Mindi & Polish:**
   - Integrate Rive Nitro runtime (budget 1 week) (Moderate #7)
   - Add WebSocket timeout configuration or switch to polling (Moderate #8)
   - Test end-to-end on physical Android device

5. **Week 5 - Launch:**
   - Resist scope creep (Anti-pattern #14)
   - Ship with known minor bugs (Anti-pattern #16)
   - Monitor edge-tts reliability in production

---

## Post-MVP Migration Flags

Issues that will require refactoring after validation:

- **edge-tts → Paid TTS:** When rate limits cause user complaints
- **WebSockets → Polling:** If production timeout issues persist
- **Rive complexity:** If Nitro runtime proves unstable
- **Backend scaling:** When single server can't handle load (not a day 1 problem)

---

## Sources

### Supabase + React Native
- [Avoid Common Supabase Gotchas in React Native](https://www.prosperasoft.com/blog/database/supabase/supabase-react-native-gotchas/)
- [Use Supabase Auth with React Native | Supabase Docs](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Edge Function JWT Invalid with 2026 API Keys](https://github.com/orgs/supabase/discussions/41834)
- [Solving Stream Module Issue in React Native with Supabase](https://medium.com/@josephmuhindo089/solving-the-stream-module-issue-in-react-native-with-supabase-a-clean-lightweight-solution-c8f2789f9a7b)

### Rive Animations
- [Rive React Native - Maintenance Status Discussion](https://github.com/rive-app/rive-react-native/issues/369)
- [Rive Nitro React Native (New Runtime)](https://github.com/rive-app/rive-nitro-react-native)
- [Lag on Initial Rive Render - Critical for Onboarding](https://community.rive.app/c/support/lag-and-reset-on-initial-rive-render-critical-for-onboarding-react-native)

### edge-tts Reliability
- [Common Edge-TTS Errors](https://pyvideotrans.com/edgetts-error/)
- [edge-tts GitHub Issues](https://github.com/rany2/edge-tts/issues)
- [Long Text Strings Produce Incomplete Audio Files](https://github.com/rany2/edge-tts/issues/190)

### FFmpeg Mobile
- [FFmpegKit Shutdown - What's Next](https://www.itpathsolutions.com/ffmpegkit-shutdown-what-to-do-next)
- [How to Use FFmpeg in Android with Example](https://www.geeksforgeeks.org/android/how-to-use-ffmpeg-in-android-with-example/)
- [Using FFmpeg for Faster Audio Decoding](https://medium.com/@donturner/using-ffmpeg-for-faster-audio-decoding-967894e94e71)

### FastAPI + WebSockets
- [Deploying WebSocket Applications with FastAPI](https://hexshift.medium.com/deploying-websocket-applications-built-with-fastapi-using-uvicorn-gunicorn-and-nginx-04249b1cb87d)
- [FastAPI Production Deployment Best Practices](https://render.com/articles/fastapi-production-deployment-best-practices)
- [Zero-Downtime WebSocket Deployment Strategies](https://hexshift.medium.com/zero-downtime-websocket-deployment-strategies-with-fastapi-2e2df9ebfe3d)

### React Native Audio & Storage
- [Offline Playback | React Native Track Player](https://rntp.dev/docs/guides/offline-playback)
- [Expo FileSystem Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Downloading and Saving Files in React Native Expo](https://medium.com/@fabi.mofar/downloading-and-saving-files-in-react-native-expo-5b3499adda84)
- [Platform-Specific Modules - Expo Documentation](https://docs.expo.dev/router/advanced/platform-specific-modules/)

### MVP Best Practices
- [Common Mistakes in MVP Development - Essential Tips](https://www.tresastronautas.com/en/blog/common-mistakes-in-mvp-development-essential-tips-for-success)
- [Building an MVP? Avoid These 15 Common Mistakes](https://www.lowcode.agency/blog/mvp-development-challenges-mistakes)
- [How to Prevent & Manage Scope Creep in MVP](https://imaginovation.net/blog/prevent-scope-creep-mvp-development/)
- [Avoiding Common Mistakes When Building an MVP](https://www.fsk.ventures/resources/common-mistakes-made-when-building-an-mvp-and-how-to-avoid-them)
- [MVP Scoping: When and How to Do It Right](https://www.upsilonit.com/blog/how-to-define-mvp-scope-tips-for-those-planning-development)
