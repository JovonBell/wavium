# Wavium -- App Store Submission Audit Report

**Date:** March 2, 2026
**Auditor:** Claude (Automated Full-Stack Audit)
**Scope:** Frontend (React Native + Expo), Backend (FastAPI), Apple App Store Compliance, Security, Build Readiness

---

## EXECUTIVE SUMMARY

**Wavium is NOT ready for App Store submission.** There are **7 submission blockers** that must be fixed, plus **19 high-severity issues** across code quality, security, and compliance. The app has solid core functionality but needs critical fixes before Apple will approve it.

### Submission Readiness Score: 4/10

---

## SUBMISSION BLOCKERS (Must fix or Apple WILL reject)

### BLOCKER 1: Missing AI Data Sharing Consent Modal
**Apple Guideline 5.1.2(i) -- Enforced since Nov 13, 2025**
- User data (name, intentions) is sent to Groq AI and Microsoft edge-TTS with NO consent screen
- Apple requires an explicit modal BEFORE any data transmission to third-party AI, naming the specific provider
- **Fix:** Add a consent modal on first use: "Wavium uses Groq AI to generate personalized affirmations. Your name and preferences will be sent to Groq's servers. [Allow] [Don't Allow]". Add a Settings toggle to revoke consent.

### BLOCKER 2: Privacy Policy Returns 404 in Production
- `https://wavium-production.up.railway.app/privacy` returns **404 Not Found**
- The deployed backend code is a DIFFERENT VERSION than the local codebase
- Apple requires an accessible privacy policy URL
- **Fix:** Redeploy the backend from the current local code, or host the privacy policy on a static site (GitHub Pages, Vercel) independent of the backend

### BLOCKER 3: Deployed Backend Code Doesn't Match Local Code
- Production server has completely different routes than local codebase
- Local: `/api/account`, `/api/affirmations`, `/api/generate/*`, etc.
- Deployed: `/api/generate-affirmations`, `/api/generate-audio`, `/api/voices`, etc.
- Different voice lists, different endpoint paths, missing routes
- **Fix:** Determine which version is canonical, reconcile, and redeploy

### BLOCKER 4: Account Deletion is Broken
- Backend uses Supabase `anon` key instead of `service_role` key
- `supabase.auth.admin.delete_user()` REQUIRES service_role key -- will fail with permissions error
- Apple requires working account deletion (Guideline 5.1.1(v))
- Only deletes auth user, not user data in tables or Cloudflare R2
- **Fix:** Set `SUPABASE_KEY` to service_role key in Railway. Implement cascade deletion for ALL user data.

### BLOCKER 5: No App Store Screenshots
- Zero screenshot files found anywhere in the project
- Required: iPhone 6.9" (1290x2796) or 6.5" screenshots minimum
- **Fix:** Capture screenshots on iPhone 15/16 Pro Max simulator. Minimum 3 per device size.

### BLOCKER 6: Missing Privacy Manifest (NSPrivacyTracking)
- Apple requires `PrivacyInfo.xcprivacy` for all submissions since Spring 2024
- App uses AsyncStorage (UserDefaults API) and expo-file-system (file timestamp API) -- both "required reason APIs"
- No privacy manifest declarations in app.json
- **Fix:** Add `"privacyManifests"` config to `app.json` under `expo.ios`, declaring required reason APIs

### BLOCKER 7: No Terms of Service
- No ToS file or URL found anywhere in the codebase
- Required for apps with user accounts and AI-generated content
- **Fix:** Create a Terms of Service page alongside the privacy policy

---

## HIGH SEVERITY ISSUES (19 total)

### Security (7)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| S1 | **CORS wildcard `["*"]` with `allow_credentials=True`** in production | `backend/app/main.py:51-62` | Set explicit `CORS_ORIGINS` in Railway env vars |
| S2 | **No rate limiting** on any endpoint -- Groq API can be spammed | `backend/app/core/config.py` (settings defined but never applied) | Install `slowapi`, apply to LLM endpoints |
| S3 | **Unauthenticated API endpoints** -- affirmations, WebSocket, intentions all open | Multiple backend routes | Add JWT verification middleware |
| S4 | **Spoofable X-User-ID header** used for auth on some endpoints | `library.py`, `sessions.py`, `evolution.py` | Replace with JWT-extracted user ID |
| S5 | **Auth tokens in unencrypted AsyncStorage** | `src/lib/supabase.ts:6,14` | Use `expo-secure-store` (iOS Keychain) |
| S6 | **HTTP fallback URLs** -- if `EXPO_PUBLIC_API_URL` unset, defaults to `http://localhost:8000` | `groq.ts`, `api.ts`, `useAuthStore.ts` | Remove HTTP fallbacks, crash instead |
| S7 | **Groq API key needs rotation** -- was shared in chat | `backend/.env` | Rotate at https://console.groq.com |

### Code Quality (7)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| C1 | **3 inconsistent API base URL definitions** -- production could hit localhost | `api/client.ts`, `groq.ts`, `api.ts`, `useAuthStore.ts` | Single `config.ts` source of truth |
| C2 | **VoidContainer re-renders every second** from `currentTime` state update | `VoidContainer.tsx` | Extract time display to memoized child |
| C3 | **6 uncleaned setTimeout/setInterval** causing state-update-after-unmount | `create.tsx`, `name-mindi.tsx`, `home.tsx`, `forgot-password.tsx`, `tracks.tsx` | Store IDs in refs, clear in useEffect cleanup |
| C4 | **User stuck in onboarding** if Supabase user is null during setTimeout | `name-mindi.tsx:109-114` | Add else branch with error/retry |
| C5 | **Deep link to invalid player ID** shows dummy player with empty audio | `player/[id].tsx:38-55` | Show "not found" screen, guard mount |
| C6 | **Script screen renders empty** without data guard | `script.tsx:34,101` | Check for empty affirmations, redirect |
| C7 | **Root layout returns null** during init -- blank screen if Supabase slow | `_layout.tsx:88-90` | Keep splash visible until ready |

### Backend (3)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| B1 | **Blocking `subprocess.run`** in async context (ffmpeg) | `audio_pipeline.py:204-211` | Use `asyncio.create_subprocess_exec` |
| B2 | **No timeouts** on Groq API calls, edge-tts, or subprocess | Multiple | Add timeout params everywhere |
| B3 | **No retry logic** anywhere -- single failure crashes pipeline | All external calls | Add `tenacity` with exponential backoff |

### Compliance (2)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| A1 | **No GDPR/CCPA sections** in privacy policy | `privacy-policy.html` | Add explicit GDPR rights and CCPA sections |
| A2 | **No server-side AI output filtering** -- safety prompt only | `affirmations.py` | Add post-generation content filter |

---

## MEDIUM SEVERITY ISSUES (23 total)

### Code Quality
- Unsubscribed `onAuthStateChange` listener (memory leak pattern) -- `useAuthStore.ts:76`
- AudioSystem config failure still sets `isConfigured = true` -- `AudioSystem.ts:52`
- `Audio.setAudioModeAsync()` with no error handling -- `VoidContainer.tsx:100-106`
- Non-null assertions on env vars -- `supabase.ts:9-10`
- Zustand store selects all fields causing unnecessary re-renders -- `home.tsx:25`
- Audio level updating shared value 10x/second -- `VoidContainer.tsx:166`
- No network connectivity handling anywhere in the app
- No error boundary around individual screens (only root)
- Session token expiry force-navigates to sign-in, losing in-progress work -- `_layout.tsx:72-85`
- Audio failure shows only subtle "Unavailable" label -- `VoidContainer.tsx`

### Security
- WebSocket error leaks raw exception details -- `main.py:161-166`
- Potential path traversal in audio pipeline -- `audio_pipeline.py:256`
- User data in unencrypted AsyncStorage -- `useMindiStore.ts:329`
- Unauthenticated WebSocket endpoint -- `main.py:129-168`

### Build
- Missing peer dependencies: `expo-font`, `expo-constants`, `expo-linking`
- Duplicate worklets packages (`react-native-worklets` + `react-native-worklets-core`)
- Unused `jotai` dependency (only `zustand` is actually imported)
- `expo-av` deprecated (removed in SDK 55) -- migration needed
- httpx has no upper bound pin -- `requirements.txt`
- Splash screen uses legacy config instead of plugin

### Backend
- httpx monkey-patching is fragile -- `main.py:17-22`
- WebSocket send_json can fail inside exception handler -- `main.py:161-168`
- No input length validation on intentions endpoint -- `intentions.py:18`

---

## LOW SEVERITY ISSUES

- 25 console.log/warn/error statements to clean up (see full list in code quality audit)
- Inline styles that should be StyleSheet (multiple files)
- Using array index as key in map() (3 instances)
- Dead code: unused `src/api/client.ts`, `OfflineSystem.ts`, `HapticSystem.ts`
- Backend stub endpoints returning placeholder data
- FastAPI severely outdated (0.109.0 vs 0.135.1)
- Pydantic outdated (2.5.3 vs 2.12.5)
- Unused backend deps: celery, redis, pydub, aiofiles
- Hardcoded dev IP `172.16.225.29` in committed source
- No frontend `.env.example`
- No `autoIncrement` for build numbers in eas.json
- No `ITSAppUsesNonExemptEncryption` flag (causes export compliance question every submission)
- Swagger/OpenAPI docs exposed in production

---

## APP STORE CONNECT CHECKLIST

### Metadata to Prepare
| Field | Recommendation |
|-------|---------------|
| App Name | "Wavium" or "Wavium - AI Affirmations" (max 30 chars) |
| Subtitle | "Personalized AI Affirmations" (max 30 chars) |
| Category | Primary: **Health & Fitness**; Secondary: **Lifestyle** |
| Keywords | affirmations,meditation,mindfulness,wellness,AI,positive,self-care,mental-health,motivation,ambient |
| Support URL | Create a support page or use email |
| Privacy Policy URL | Must work (currently 404!) |
| Copyright | "2026 Joshua Bell" |
| Contact | joshua@profitprocesses.com |

### Age Rating Answers
| Category | Answer | Result |
|----------|--------|--------|
| All violence/sexual/gambling/horror | None | 4+ |
| Health or Wellness Topics | Infrequent | **9+** |
| All others | None | 4+ |

### Privacy Nutrition Labels
**Data Linked to User:** Name, Email, User Content (affirmation preferences), User ID
**Data NOT Linked:** Crash data, usage data (if analytics added)
**Third-Party Sharing:** Must disclose Groq, edge-TTS, Cloudflare R2, Supabase

### Screenshots Required
| Device | Resolution | Required |
|--------|-----------|----------|
| iPhone 6.9" (16 Pro Max) | 1290 x 2796 | YES |
| iPhone 6.5" (14 Plus) | 1284 x 2778 | Recommended |
| iPad 13" | N/A | No (supportsTablet: false) |

---

## QUICK CONFIG FIXES (add to app.json)

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "NSMotionUsageDescription": "Used for parallax visual effects"
      }
    }
  }
}
```

---

## PRIORITIZED ACTION PLAN

### Phase 1: Critical Blockers (Do First)
1. Reconcile local vs deployed backend code -- redeploy correct version
2. Fix privacy policy 404 (consider static hosting)
3. Add AI consent modal (Guideline 5.1.2(i))
4. Fix account deletion (service_role key + cascade delete)
5. Add Terms of Service
6. Add privacy manifest declarations
7. Take App Store screenshots

### Phase 2: Security Hardening
8. Rotate Groq API key
9. Fix CORS to explicit origins
10. Add JWT auth to all backend endpoints
11. Implement rate limiting
12. Move auth tokens to SecureStore
13. Remove HTTP fallback URLs

### Phase 3: Code Quality
14. Centralize API base URL
15. Fix all setTimeout/setInterval cleanup
16. Guard deep link routes
17. Fix VoidContainer performance
18. Remove 25 console statements
19. Install missing peer dependencies
20. Remove unused dependencies (jotai, dead code)

### Phase 4: Polish
21. Add GDPR/CCPA sections to privacy policy
22. Add health disclaimer
23. Add content reporting mechanism
24. Add `ITSAppUsesNonExemptEncryption` flag
25. Update backend dependencies
26. Run `npm audit fix`

---

## WHAT'S ALREADY GOOD

- Bundle ID, version, team ID, and ASC App ID correctly configured
- App icon exists at correct dimensions (1024x1024, no alpha)
- Splash screen configured
- Background audio mode declared
- Content safety prompt in AI system message
- Account deletion UI with double-confirmation
- Sign in with Apple NOT required (email-only auth is exempt)
- .env files properly gitignored, never committed
- No secrets in git history
- TypeScript compiles with zero errors
- EAS build and submit profiles correctly configured
- Core Expo/RN/React versions are compatible
- ErrorBoundary wraps root layout

---

*This report was generated by 6 parallel audit agents analyzing: code quality, App Store compliance, security, backend health, build readiness, and Apple guidelines research.*
