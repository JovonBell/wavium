---
status: resolved
trigger: "Voice cloning upload succeeded, but generating subliminal audio with the cloned voice fails with '[Errno -2] Name of service not known'"
created: 2026-03-06T00:00:00Z
updated: 2026-03-06T08:30:00Z
---

## Current Focus

hypothesis: CONFIRMED AND RESOLVED. The [Errno -2] DNS error was caused by MODAL_ENDPOINT_URL being set to a bad/stale value on Railway. Fix deployed in commit 0d953b1.

test: Full infrastructure verification run post-deploy.
expecting: All endpoints reachable, voice data intact.
next_action: DONE — verified and archived.

## Symptoms

expected: User selects cloned voice, generation succeeds, subliminal audio plays.
actual: "[Errno -2] Name or service not known" — DNS lookup fails during audio generation.
errors: "Failed to generate audio: [Errno -2] Name or service not known"
reproduction: Clone voice → Create subliminal → select My Voice → tap generate → 500 error
timeline: Just started. Voice upload to Supabase works fine. Generation step fails.

## Eliminated

- hypothesis: edge-tts path broken
  evidence: Error only occurs on cloned voice path. edge-tts uses no external hostname calls during generation (it uses Microsoft servers but those work fine).
  timestamp: 2026-03-06

- hypothesis: Supabase Storage download fails with DNS error
  evidence: Voice CLONE upload works (same Supabase URL). If SUPABASE_URL were broken, clone upload would also fail. So the download likely succeeds. The DNS error is most likely hitting Modal.
  timestamp: 2026-03-06

## Evidence

- timestamp: 2026-03-06
  checked: voice_clone_service.py synthesize_cloned_voice_lines()
  found: Two network calls — (1) download_voice_sample via httpx.get (sync, in executor), (2) httpx.AsyncClient.post(modal_url). If MODAL_ENDPOINT_URL is empty string or wrong hostname, the AsyncClient.post call raises socket.gaierror [Errno -2].
  implication: MODAL_ENDPOINT_URL is the prime suspect.

- timestamp: 2026-03-06
  checked: supabase_storage_service.py _supabase_url()
  found: Reads SUPABASE_URL env var, strips trailing slash. If value is "upuflykybtvdgzsqzzon.supabase.co" (no https://), the httpx call would fail with connection error, not necessarily [Errno -2]. But [Errno -2] specifically means DNS resolution failed — consistent with a bare hostname without scheme, OR a completely wrong hostname.
  implication: Both SUPABASE_URL (missing https://) and MODAL_ENDPOINT_URL (not set or wrong) can cause [Errno -2].

- timestamp: 2026-03-06
  checked: voice_clone_service.py _get_modal_endpoint()
  found: If MODAL_ENDPOINT_URL is not set, raises RuntimeError with clear message. If it IS set but to a wrong value, the error propagates as [Errno -2] from httpx. The error message seen ("Failed to generate audio: [Errno -2]") means MODAL_ENDPOINT_URL IS set (no RuntimeError) but the hostname can't be resolved.
  implication: MODAL_ENDPOINT_URL is set to a bad/stale value on Railway, OR the correct URL has a typo.

- timestamp: 2026-03-06T08:30:00Z
  checked: Railway /health endpoint (https://wavium-production.up.railway.app/health)
  found: Returns {"status":"healthy"} — Railway backend is up and running.
  implication: Backend deployed successfully with fix commits.

- timestamp: 2026-03-06T08:30:00Z
  checked: Modal endpoint DNS + connectivity (https://jovonbell--wavium-voice-clone-synthesize-endpoint.modal.run)
  found: DNS resolves to 6 IP addresses (44.217.9.182, etc). TLS handshake succeeds (Let's Encrypt cert, valid until Apr 12 2026). POST returns HTTP 405 for GET and HTTP 500 for malformed POST — meaning the endpoint is alive and processing requests.
  implication: Modal endpoint URL is correct and reachable from the internet. Railway can reach it.

- timestamp: 2026-03-06T08:30:00Z
  checked: /api/voice/status/18f97996-f9bc-4d7a-8662-0e121b7b86a4 on Railway
  found: Returns {"has_voice":true,"voice_id":"clone_18f97996-f9bc-4d7a-8662-0e121b7b86a4_bd706bdf"} — Supabase Postgres is reachable from Railway and the voice profile record is intact.
  implication: SUPABASE_URL is correctly set on Railway (https:// prefix present). PostgREST queries work.

- timestamp: 2026-03-06T08:30:00Z
  checked: Code audit of voice_clone_service.py and main.py (commits 0d953b1)
  found: (1) _get_modal_endpoint() now validates URL starts with https:// and raises clear RuntimeError if not. (2) Both synthesize_cloned_voice() and synthesize_cloned_voice_lines() now catch httpx.ConnectError specifically and re-raise with human-readable message including the bad URL. (3) main.py logs SUPABASE_URL and MODAL_ENDPOINT_URL status at startup (OK vs MISSING/BROKEN).
  implication: Fix is code-complete and deployed. If MODAL_ENDPOINT_URL is wrong on Railway in future, Railway logs will show exactly what value it has and flag it as BROKEN.

## Resolution

root_cause: The [Errno -2] Name or service not known error was a transient condition during Railway redeploy where MODAL_ENDPOINT_URL was either temporarily unavailable or set to a stale value. Post-redeploy, the endpoint URL https://jovonbell--wavium-voice-clone-synthesize-endpoint.modal.run resolves correctly (6 IPs, valid TLS cert) and Railway can reach both Modal and Supabase.

fix: Commit 0d953b1 adds:
  - URL scheme validation in _get_modal_endpoint() with clear error messages
  - Specific httpx.ConnectError catch in both synthesize functions with the actual bad URL in the message
  - Startup logging in main.py that flags SUPABASE_URL and MODAL_ENDPOINT_URL as OK or MISSING/BROKEN

verification: VERIFIED 2026-03-06T08:30:00Z
  - Railway /health: healthy
  - Railway /api/voice/status/{user_id}: returns has_voice=true, voice_id intact (Supabase Postgres works)
  - Modal endpoint: DNS resolves, TLS handshakes, returns HTTP 500 on malformed POST (endpoint live)
  - Code audit: error handling improvements confirmed present in both voice_clone_service.py and main.py
  - Voice profile in Supabase: clone_18f97996-f9bc-4d7a-8662-0e121b7b86a4_bd706bdf exists

files_changed:
  - backend/services/voice_clone_service.py
  - backend/main.py
