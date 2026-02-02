# Codebase Concerns

**Analysis Date:** 2026-02-02

## Tech Debt

**Incomplete Backend Endpoints:**
- Issue: Multiple API routes have TODO comments with placeholder implementations that return mock data instead of integrating with Supabase
- Files:
  - `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\routes\evolution.py` (lines 31, 58)
  - `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\routes\library.py` (lines 43, 58, 68, 78)
  - `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\routes\sessions.py` (lines 37, 67)
- Impact: User data (favorites, session history, Mindi evolution state) is not persisted. All endpoints return hardcoded empty responses or defaults. Critical for user experience and feature functionality.
- Fix approach: Implement Supabase client integration in `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\core\config.py`, create database schema, and implement actual queries in each route handler

**Missing Download Functionality:**
- Issue: Download button in player controls is stubbed with TODO comment and disabled (opacity 0.5)
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\src\components\void\PlayerControls.tsx` (line 284)
- Impact: Users cannot download generated subliminals for offline use
- Fix approach: Implement file download logic in player component, handle mobile filesystem permissions

**Missing Initialization Files:**
- Issue: Backend Python package structure lacks `__init__.py` files in core directories (`app/`, `app/api/`, `app/core/`)
- Files:
  - `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\` (missing __init__.py)
  - `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\` (missing __init__.py)
  - `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\core\` (missing __init__.py)
  - `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\routes\` (missing __init__.py)
- Impact: May cause module import failures and package discovery issues in production deployment
- Fix approach: Create empty `__init__.py` files in all package directories

## Security Concerns

**Overly Permissive CORS Configuration:**
- Risk: CORS is configured with `allow_origins=["*"]` and `allow_headers=["*"]`, accepting requests from any origin
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\core\config.py` (line 17), `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\main.py` (line 43)
- Current mitigation: None - production deployment will be vulnerable to CSRF attacks and unauthorized access
- Recommendations:
  - Set `allow_origins` to specific frontend domain(s) in production
  - Use environment variable to control CORS settings per environment
  - Consider using `allow_credentials=False` in production unless credentials are required

**Missing Environment Variable Validation:**
- Risk: Config loads from `.env` file but critical secrets (GROQ_API_KEY, R2 credentials, SUPABASE_KEY) have empty string defaults
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\core\config.py` (lines 20-31)
- Current mitigation: None - will fail silently at runtime when calling services
- Recommendations:
  - Add validation in config to raise errors immediately on missing required env vars
  - Document all required environment variables
  - Add pre-startup health checks in `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\main.py`

**Exposed Error Messages in WebSocket:**
- Risk: WebSocket endpoint sends raw exception messages to clients without sanitization
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\main.py` (lines 128-131)
- Current mitigation: None
- Recommendations:
  - Map exceptions to user-friendly error messages
  - Log full exceptions server-side only
  - Send generic messages to clients

**No Authentication Checks:**
- Risk: User-ID header is extracted but never validated - any client can impersonate any user
- Files: All routes in `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\routes\` use `Header(..., alias="X-User-ID")`
- Current mitigation: None
- Recommendations:
  - Implement JWT token validation
  - Add authentication middleware
  - Validate token matches the claimed user ID

## Known Bugs

**Placeholder User ID in Sessions:**
- Symptoms: Session response returns `id="placeholder"` instead of actual database ID
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\routes\sessions.py` (line 45)
- Trigger: Any call to POST `/api/session/`
- Impact: Cannot track or reference sessions; client-side session management impossible
- Workaround: None - feature non-functional

**Missing Background Audio Files:**
- Symptoms: Audio pipeline logs warning "Background {background} not found, using subliminal only"
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\services\audio_pipeline.py` (line 260)
- Trigger: When background sound file doesn't exist in `assets/backgrounds/`
- Impact: Generated audio has no background layer if files not present
- Workaround: None - depends on asset deployment

## Performance Bottlenecks

**Synchronous FFmpeg Subprocess Calls in Async Pipeline:**
- Problem: Audio processing uses blocking `subprocess.run()` calls in async pipeline
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\services\audio_pipeline.py` (lines 204-211, 234-242, 267-279)
- Cause: FFmpeg operations block event loop, preventing concurrent generation requests
- Improvement path:
  - Wrap subprocess calls with `asyncio.run_in_executor()` to run in thread pool
  - Or use async FFmpeg wrapper library
  - This allows multiple users to generate simultaneously

**Repeated AudioPipeline Instantiation:**
- Problem: AudioPipeline created per request with fresh Groq client and temp directory setup
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\main.py` (line 106), `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\routes\intentions.py` (line 40)
- Cause: No dependency injection or singleton pattern
- Improvement path: Create single AudioPipeline instance at startup, reuse across requests

**No Rate Limiting Implementation:**
- Problem: Config defines `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW` but not used anywhere
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\core\config.py` (lines 39-40)
- Impact: Users can spam audio generation requests, exhausting Groq API quota and storage
- Fix approach: Add rate limiting middleware or decorator to generation endpoints

## Fragile Areas

**Audio Pipeline Error Handling:**
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\services\audio_pipeline.py` (lines 94-97)
- Why fragile: Generic `Exception` catch with `raise e` re-raises without context. Cleanup happens regardless of exception type but may fail silently if cleanup itself throws
- Safe modification:
  - Catch specific exceptions (subprocess.CalledProcessError, FileNotFoundError, etc.)
  - Log before re-raising
  - Use try/finally for guaranteed cleanup
  - Handle cleanup failures separately
- Test coverage: No test file exists; critical pipeline untested

**WebSocket Generation Endpoint:**
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\main.py` (lines 94-133)
- Why fragile:
  - No timeout on generation requests (could hang indefinitely)
  - No request size validation
  - Exception in JSON parsing could crash websocket
  - Progress updates silently fail if socket closed
- Safe modification:
  - Add request timeout
  - Validate input data early
  - Wrap JSON operations in try/except
  - Handle closed socket explicitly
- Test coverage: Not tested

**Temp File Cleanup:**
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\services\audio_pipeline.py` (lines 322-328)
- Why fragile:
  - Uses glob pattern with session ID - if ID not unique, could delete other user's files
  - Silently swallows cleanup errors
  - No validation that files are actually from this session
- Safe modification:
  - Use explicit file list instead of glob
  - Log cleanup failures
  - Add session directory isolation
- Test coverage: No tests for cleanup

**Private Method Access in Routes:**
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\routes\intentions.py` (line 41)
- Why fragile: Route directly calls private method `_generate_affirmations()` - breaks encapsulation
- Safe modification: Create public method `generate_affirmations()` in AudioPipeline
- Impact: Internal refactoring of pipeline breaks intentions route

## Test Coverage Gaps

**No Test Files:**
- What's not tested: Entire backend codebase
- Files: No test files exist (no `test_*.py` or `*_test.py` files found)
- Risk:
  - Audio pipeline can silently fail during generation
  - Database integration will fail in production with no warning
  - WebSocket protocol errors undetected
  - CORS/security issues not caught
- Priority: High - critical for production deployment

**No Frontend Component Tests:**
- What's not tested: Player controls, player, creation UI
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\src\components\void\PlayerControls.tsx` and related components
- Risk: UI state management bugs, animation failures, event handler errors
- Priority: Medium - user-facing but primarily UX issues

## Missing Critical Features

**Database Persistence:**
- Problem: All user data endpoints return empty or mock responses
- Blocks:
  - User library/favorites
  - Session history and streaks
  - Mindi evolution tracking
  - User profiles and preferences
- Impact: No persistent state between app sessions

**User Authentication:**
- Problem: No auth system - any request can spoof any user ID
- Blocks:
  - Secure user data isolation
  - Admin functionality
  - Rate limiting per user
- Impact: Security vulnerability; data leakage between users

**Audio Asset Management:**
- Problem: Background audio files must exist in `assets/backgrounds/` but no system to manage/upload them
- Blocks:
  - Custom background support
  - Background audio selection
- Impact: Fixed set of backgrounds only

**Error Recovery:**
- Problem: Failed generations are not retryable - no job queue or persistence
- Blocks:
  - Resilience to temporary failures
  - Progress tracking across disconnections
- Impact: Users must restart generation on any network issue

## Dependencies at Risk

**Unmaintained/Deprecated Packages:**
- Package: `edge-tts==6.1.9` (Microsoft Edge TTS)
- Risk: Unofficial API wrapper that violates Microsoft ToS; subject to blocking
- Impact: TTS generation will fail if API access revoked
- Migration plan: Switch to commercial TTS API (ElevenLabs, Google Cloud TTS, or AWS Polly)

**Synchronous Subprocess Dependency:**
- Package: `subprocess` (stdlib but blocking usage)
- Risk: Blocks event loop; prevents concurrent request handling
- Impact: Performance degrades with multiple simultaneous users
- Migration plan: Use `asyncio.run_in_executor()` or async FFmpeg library

## Scaling Limits

**Temp Directory Storage:**
- Current capacity: `/tmp/` with no size limits configured
- Limit: Disk will fill up during peak generation traffic
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\core\config.py` (line 34)
- Scaling path:
  - Implement cleanup job that removes files older than N hours
  - Monitor disk usage
  - Move to persistent storage layer if needed
  - Consider streaming audio generation instead of file-based

**API Rate Limits Not Enforced:**
- Current capacity: Unlimited requests (config defines limits but not used)
- Limit: Will exhaust external API quotas (Groq, Edge TTS, R2)
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\core\config.py` (lines 39-40)
- Scaling path:
  - Implement Redis-based rate limiting
  - Add per-user daily generation limits
  - Queue excess requests for background processing
  - Implement cost tracking

**WebSocket Concurrent Connections:**
- Current capacity: No limit on simultaneous WebSocket connections
- Limit: Server memory will exhaust under high concurrent load
- Files: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\main.py` (line 94)
- Scaling path:
  - Add max connection limit
  - Queue requests beyond limit
  - Use load balancer with multiple backend instances
  - Consider message queue for decoupled processing

---

*Concerns audit: 2026-02-02*
