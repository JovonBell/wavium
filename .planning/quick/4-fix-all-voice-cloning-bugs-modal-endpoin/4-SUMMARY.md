---
phase: quick-4
plan: 01
subsystem: voice-cloning
tags: [modal, xtts-v2, voice-clone, frontend, backend, bugfix]
dependency_graph:
  requires: []
  provides: [working-voice-clone-pipeline]
  affects: [tracks-screen, main-layout, voice-clone-service, modal-tts-endpoint]
tech_stack:
  added: []
  patterns:
    - Modal class-method web endpoint (self.tts always loaded via @modal.enter)
    - UUID-based temp file paths for concurrent request isolation
    - AbortController timeout pattern for long GPU synthesis requests
    - Zustand rehydration on layout mount for returning users
    - Storage rollback on failed Postgres insert
key_files:
  created: []
  modified:
    - backend/modal_tts/app.py
    - backend/services/voice_clone_service.py
    - backend/main.py
    - wavium/src/services/api.ts
    - wavium/app/(main)/tracks.tsx
    - wavium/app/(main)/_layout.tsx
    - wavium/src/stores/useMindiStore.ts
decisions:
  - "web_endpoint is a class method on VoiceSynthesizer so self.tts is available — not a standalone function"
  - "AbortController 120s timeout on generateVoiceAudio with GPU warming message after 10s"
  - "recordingUri persisted in Zustand store (no partialize — full store persists)"
  - "Voice rehydration fires on mount only if !hasCustomVoice — avoids redundant API calls"
  - "Storage rollback re-raises original error so endpoint returns 500 to caller"
metrics:
  duration: "~20 minutes"
  completed_date: "2026-03-06"
  tasks_completed: 3
  files_modified: 7
---

# Quick Task 4: Fix All Voice Cloning Bugs (Modal Endpoint + 9 Others) Summary

**One-liner:** Fixed all 10 voice cloning bugs — Modal XTTS v2 class-method endpoint with UUID temp paths, custom voice preview via raw recording, voice status rehydration, 120s AbortController timeout, 'custom' voice persistence, userId null guard, Storage-Postgres atomicity, ephemeral disk TODO, and silent fallback protection.

## What Was Built

Fixed 10 bugs across the full voice cloning pipeline, from Modal GPU endpoint through frontend UX to backend storage.

## Tasks Completed

### Task 1: Fix Modal endpoint architecture + temp file race condition (Bugs 1 & 10)

**Commit:** c087ae0

**Problem:** `synthesize_endpoint` was a standalone `@app.function` that instantiated `VoiceSynthesizer()` locally. Local instantiation bypasses `@modal.enter()`, so `self.tts` was never loaded — every call crashed.

**Fix:** Deleted the standalone function. Added `web_endpoint` as a `@modal.fastapi_endpoint(method="POST")` method directly on the `VoiceSynthesizer` class. Since `@modal.enter()` runs `load_model()` on container start, `self.tts` is always available when `web_endpoint` is called. Calls `self.synthesize_lines()` or `self.synthesize()` directly (not via `.remote()`).

**UUID temp paths:** Replaced all hardcoded `/tmp/silence.wav`, `/tmp/concat_list.txt`, `/tmp/final_output.wav` with `f"/tmp/silence_{run_id}.wav"` etc. where `run_id = uuid.uuid4().hex[:8]`. Added `finally` blocks to clean up all temp files after reads complete.

### Task 2: Fix 5 frontend voice cloning bugs (Bugs 2, 3, 4, 5, 6)

**Commit:** 8cfb231

**Bug 2 — Custom voice preview:** Replaced `if (voiceId === 'custom') return;` with code that loads and plays the `recordingUri` from the store as the preview. Falls back gracefully if `recordingUri` is null.

**Bug 3 — Voice status rehydration:** Added `useEffect` in `_layout.tsx` that calls `getVoiceCloneStatus(effectiveUserId)` on mount. If the backend reports a voice exists, calls `setCustomVoice(voiceId)`. Only fires if `!hasCustomVoice` to avoid redundant calls. Silently ignores errors.

**Bug 4 — 120s timeout:** Added `AbortController` to `generateVoiceAudio` with `setTimeout(() => controller.abort(), 120000)`. Catches `AbortError` and returns a user-friendly message. Always clears the timeout in `finally`.

**Bug 5 — Selection persistence:** Changed `useState` initialization to `creation.selectedVoice ?? (hasCustomVoice && customVoiceId ? 'custom' : null)`. If user has a custom voice and no prior voice was selected, 'custom' is defaulted.

**Bug 6 — userId null guard:** Added `const resolvedUserId = userId || authUser?.id || null`. If `isClonedVoice` and `resolvedUserId` is null, shows `Alert` and returns early. Shows GPU warming message via `setTimeout(..., 10000)` cleared after generation returns.

**useMindiStore:** Added `recordingUri: string | null` field, `setRecordingUri` action, and updated `setCustomVoice` signature to accept optional `recordingUri` second param. Updated `clearCustomVoice` and `resetOnboarding` to clear `recordingUri`.

### Task 3: Fix backend silent fallback, storage atomicity, ephemeral disk (Bugs 7, 8, 9)

**Commit:** 98838e6

**Bug 9 — Silent fallback protection:** Added `elif request.clone_voice_id and not request.user_id:` guard in both `api_generate_audio` and `api_generate_subliminal`. Returns HTTP 400 with clear message instead of silently falling back to edge-tts. Logs a warning before raising.

**Bug 8 — Ephemeral disk TODO:** Added comment block above `app.mount("/audio", ...)` documenting that audio files are lost on Railway redeploy and pointing to Supabase Storage as the future fix.

**Bug 7 — Storage atomicity:** Wrapped `save_voice_metadata` in try/except in `clone_voice()`. On failure, calls `delete_voice_data(user_id)` to roll back the Storage upload, logs the rollback attempt/result, and re-raises the original error.

## Success Criteria Verification

| Bug | Fix | Status |
|-----|-----|--------|
| 1. Modal endpoint crash (local instantiation) | web_endpoint as class method | Fixed |
| 2. Custom voice preview does nothing | Plays recordingUri | Fixed |
| 3. Returning users don't see My Voice | Rehydrate via _layout useEffect | Fixed |
| 4. No timeout on GPU synthesis | 120s AbortController | Fixed |
| 5. Custom voice not selected on return | Default from hasCustomVoice | Fixed |
| 6. userId can be null at synthesis | Resolve from authStore fallback | Fixed |
| 7. Orphaned Storage files on Postgres failure | Rollback in try/except | Fixed |
| 8. Ephemeral disk undocumented | TODO comment added | Fixed |
| 9. Silent fallback to edge-tts | HTTP 400 with clear message | Fixed |
| 10. Temp file race conditions in Modal | UUID-based run_id paths | Fixed |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written. One deviation was judgment-based:

**api_generate_subliminal guard (Rule 2 — Missing validation):** The plan said to check `api_generate_subliminal` for the same pattern if it exists. It passes through to `generate_subliminal()` in tts_service which has the same silent fallback pattern. Added the same `clone_voice_id and not user_id` guard at the endpoint level as a defense-in-depth measure.

### Out of Scope (Pre-existing)

Pre-existing TypeScript error in `record-voice.tsx:263` (HapticButton style array type) — exists before this task's changes, logged to deferred items.

## Manual Deploy Steps (User Action Required)

After this plan completes, the user must:
1. `modal deploy backend/modal_tts/app.py` — redeploy the fixed Modal endpoint
2. Verify `MODAL_ENDPOINT_URL` is set on Railway env vars

## Self-Check: PASSED

All 7 modified files confirmed present on disk. All 3 task commits confirmed in git history (c087ae0, 8cfb231, 98838e6).
