---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/modal_tts/app.py
  - backend/services/voice_clone_service.py
  - backend/main.py
  - wavium/src/services/api.ts
  - wavium/app/(main)/tracks.tsx
  - wavium/app/(main)/_layout.tsx
  - wavium/src/stores/useMindiStore.ts
autonomous: true
requirements: [VC-BUGFIX-01, VC-BUGFIX-02, VC-BUGFIX-03, VC-BUGFIX-04, VC-BUGFIX-05, VC-BUGFIX-06, VC-BUGFIX-07, VC-BUGFIX-08, VC-BUGFIX-09, VC-BUGFIX-10]

must_haves:
  truths:
    - "Modal endpoint receives HTTP POST and synthesizes voice using XTTS v2 model loaded via @modal.enter()"
    - "Custom voice preview plays the user's raw recording when tapped in the voice picker"
    - "Returning users see 'My Voice' option after re-login without re-recording"
    - "Generation request has a 120s timeout with 'GPU warming up' feedback after 10s"
    - "Custom voice selection persists when navigating away from tracks screen and back"
    - "userId is always non-null at synthesis time (falls back to auth store)"
    - "Backend logs a warning and returns an error when cloned voice synthesis fails instead of silently falling back to edge-tts"
    - "Concurrent Modal synthesis calls do not corrupt each other's temp files"
    - "Failed Postgres insert after successful Storage upload triggers Storage cleanup"
  artifacts:
    - path: "backend/modal_tts/app.py"
      provides: "Fixed Modal endpoint as a class method on VoiceSynthesizer"
      contains: "@modal.fastapi_endpoint"
    - path: "wavium/app/(main)/tracks.tsx"
      provides: "Voice preview, selection persistence, userId fallback"
    - path: "wavium/src/services/api.ts"
      provides: "AbortController timeout on generateVoiceAudio"
    - path: "wavium/app/(main)/_layout.tsx"
      provides: "Voice status rehydration on app load"
    - path: "wavium/src/stores/useMindiStore.ts"
      provides: "recordingUri field, VoiceOption-compatible selectedVoice"
    - path: "backend/main.py"
      provides: "Silent fallback protection on clone path"
    - path: "backend/services/voice_clone_service.py"
      provides: "Atomic storage+postgres with rollback, uuid temp paths"
  key_links:
    - from: "wavium/app/(main)/_layout.tsx"
      to: "wavium/src/services/api.ts"
      via: "getVoiceCloneStatus() call on mount"
      pattern: "getVoiceCloneStatus"
    - from: "wavium/app/(main)/tracks.tsx"
      to: "wavium/src/stores/useMindiStore.ts"
      via: "recordingUri for custom voice preview playback"
      pattern: "recordingUri"
    - from: "backend/modal_tts/app.py"
      to: "VoiceSynthesizer class"
      via: "web_endpoint is a method on the class, calls self.synthesize_lines directly"
      pattern: "self\\.synthesize_lines"
---

<objective>
Fix all 10 voice cloning bugs across the Modal endpoint, frontend voice picker, voice status rehydration, fetch timeout, selection persistence, userId null guard, silent fallback protection, temp file race conditions, and storage atomicity.

Purpose: Voice cloning is architecturally broken (Modal endpoint crashes every call) and has 9 additional bugs that would prevent it from working even if Modal were fixed. This plan fixes all of them in one pass.

Output: A fully functional voice cloning pipeline from recording through synthesis.
</objective>

<execution_context>
@/Users/joshuabellhome/.claude/get-shit-done/workflows/execute-plan.md
@/Users/joshuabellhome/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/debug/voice-clone-backend-synthesis.md
@.planning/debug/voice-clone-picker-playback.md
@.planning/debug/voice-clone-frontend-generation.md
@.planning/debug/voice-clone-frontend-recording.md
@.planning/debug/voice-clone-backend-upload.md

<interfaces>
<!-- Key types and contracts the executor needs. -->

From wavium/src/stores/useMindiStore.ts:
```typescript
export type VoiceId = 'ava' | 'emma' | 'andrew' | 'sonia' | 'brian';
// VoiceOption extends VoiceId with 'custom'
type VoiceOption = VoiceId | 'custom'; // defined in tracks.tsx

interface CreationState {
  intention: string;
  affirmations: string[];
  selectedTrack: SoundTrack | null;
  selectedVoice: VoiceId | null;  // BUG: cannot hold 'custom'
  audioUrl: string | null;
}

interface MindiStoreState {
  userId: string | null;
  hasCustomVoice: boolean;
  customVoiceId: string | null;
  userName: string;
  setCustomVoice: (voiceId: string) => void;
  // ... other fields
}
```

From wavium/src/services/api.ts:
```typescript
export async function getVoiceCloneStatus(
  userId: string
): Promise<{ hasVoice: boolean; voiceId: string | null }>
// ^ Defined but NEVER CALLED. Must be called on app init.

export async function generateVoiceAudio(
  affirmations: string[], voice: string,
  cloneVoiceId?: string | null, userId?: string | null
): Promise<{ audioUrl: string; error?: string }>
// ^ No timeout — needs AbortController with 120s limit
```

From wavium/src/stores/useAuthStore.ts:
```typescript
export const useAuthStore = create<AuthState>((set, get) => ({
  session: Session | null;  // session?.user?.id is the Supabase userId
  user: User | null;
}));
```

From backend/modal_tts/app.py:
```python
@app.cls(gpu="T4", timeout=300, scaledown_window=60)
class VoiceSynthesizer:
    @modal.enter()
    def load_model(self): ...      # loads self.tts
    @modal.method()
    def synthesize(self, text, reference_audio) -> bytes: ...
    @modal.method()
    def synthesize_lines(self, lines, reference_audio) -> bytes: ...

# BUG: synthesize_endpoint is a SEPARATE @app.function that instantiates
# VoiceSynthesizer() locally — self.tts is never loaded, crashes every time
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Modal endpoint architecture + temp file race condition</name>
  <files>backend/modal_tts/app.py</files>
  <action>
Restructure the Modal app to fix Bug 1 (architectural crash) and Bug 10 (temp file race condition).

**Bug 1 fix — Move endpoint into VoiceSynthesizer class:**

Delete the standalone `synthesize_endpoint` function (lines 148-183). Instead, add a new method `web_endpoint` on the `VoiceSynthesizer` class decorated with `@modal.fastapi_endpoint(method="POST")`. This method receives the request dict, decodes reference_audio_b64, and calls `self.synthesize_lines(...)` or `self.synthesize(...)` DIRECTLY (not via `.remote()`) since it runs in the same container with `self.tts` already loaded.

The web_endpoint method should:
1. Validate that `reference_audio_b64` key exists in request, return 400 JSON error if missing
2. Validate that either `text` or `lines` key exists, return 400 JSON error if neither
3. Decode reference_audio_b64 via base64.b64decode
4. Call `self.synthesize_lines(lines, ref_audio)` if `lines` key present and non-empty
5. Call `self.synthesize(text, ref_audio)` if only `text` key present
6. Return `{"audio_b64": base64.b64encode(audio_bytes).decode()}`
7. Wrap in try/except to return JSON error on failure (not raw traceback)

Remove `@modal.concurrent(max_inputs=4)` from the class decorator — it stays on the class level `@app.cls` only. The `@modal.concurrent` decorator should NOT appear on the standalone function either (since we're deleting it).

IMPORTANT: The `@app.cls` decorator must keep `image=image` if not already there. Check current code — if `image` is not on `@app.cls`, add it.

**Bug 10 fix — UUID-based temp paths:**

In `synthesize_lines()`, replace all hardcoded `/tmp/` paths with UUID-based paths:
- Replace `silence_path = "/tmp/silence.wav"` with `silence_path = f"/tmp/silence_{run_id}.wav"` where `run_id = uuid.uuid4().hex[:8]`
- Replace `concat_list = "/tmp/concat_list.txt"` with `concat_list = f"/tmp/concat_{run_id}.txt"`
- Replace `final_path = "/tmp/final_output.wav"` with `final_path = f"/tmp/output_{run_id}.wav"`
- Add cleanup: after reading the final output bytes, delete all temp files (silence, concat list, final output, all wav_parts, ref_path) in a try/except block
- Add `import uuid` at the top of the file

Also in `synthesize()`, clean up ref_path and out_path after reading output bytes.

After these changes, the `@app.cls` block should have: `gpu="T4"`, `timeout=300`, `scaledown_window=60`, `image=image`. The standalone function and its decorators are completely removed.
  </action>
  <verify>
    <automated>cd /Users/joshuabellhome/wavium && python3 -c "
import ast
with open('backend/modal_tts/app.py') as f:
    source = f.read()
tree = ast.parse(source)
# Check no standalone synthesize_endpoint function exists
functions = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef) and n.col_offset == 0]
assert 'synthesize_endpoint' not in functions, 'standalone synthesize_endpoint still exists'
# Check web_endpoint exists as a method
classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef) and n.name == 'VoiceSynthesizer']
assert len(classes) == 1, 'VoiceSynthesizer class not found'
methods = [n.name for n in classes[0].body if isinstance(n, ast.FunctionDef)]
assert 'web_endpoint' in methods, 'web_endpoint method not found on VoiceSynthesizer'
# Check no VoiceSynthesizer() local instantiation (the bug)
assert 'synth = VoiceSynthesizer()' not in source, 'local VoiceSynthesizer instantiation still present'
# Check UUID-based paths
assert 'run_id' in source, 'UUID-based run_id not found in synthesize_lines'
assert '/tmp/silence.wav' not in source, 'hardcoded silence path still present'
assert '/tmp/concat_list.txt' not in source, 'hardcoded concat path still present'
assert '/tmp/final_output.wav' not in source, 'hardcoded output path still present'
print('All checks passed')
"
    </automated>
  </verify>
  <done>
    - VoiceSynthesizer.web_endpoint is a @modal.fastapi_endpoint(method="POST") method on the class
    - self.tts is available because @modal.enter() runs load_model() on container start
    - No standalone synthesize_endpoint function exists
    - All /tmp paths in synthesize_lines use UUID-based names
    - Temp files are cleaned up after use
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix all frontend voice cloning bugs (preview, rehydration, timeout, persistence, userId guard)</name>
  <files>wavium/src/services/api.ts, wavium/app/(main)/tracks.tsx, wavium/app/(main)/_layout.tsx, wavium/src/stores/useMindiStore.ts</files>
  <action>
Fix Bugs 2, 3, 4, 5, 6 across 4 frontend files.

**File 1: wavium/src/stores/useMindiStore.ts — Add recordingUri field**

1. Add `recordingUri: string | null;` to the MindiStoreState interface (alongside customVoiceId)
2. Add `setRecordingUri: (uri: string) => void;` to the actions
3. Initialize `recordingUri: null` in the store creation
4. Implement: `setRecordingUri: (uri) => set({ recordingUri: uri })`
5. Add `recordingUri` to the persist whitelist (in the `partialize` option of the persist middleware — find the existing partialize function and add recordingUri to the returned object)
6. Also update `setCustomVoice` to accept an optional second param for recordingUri: `setCustomVoice: (voiceId: string, recordingUri?: string) => void;` — impl: `set({ hasCustomVoice: true, customVoiceId: voiceId, ...(recordingUri ? { recordingUri } : {}) })`

**File 2: wavium/src/services/api.ts — Add 120s timeout to generateVoiceAudio (Bug 4)**

In the `generateVoiceAudio` function:
1. Before the fetch call, create an AbortController: `const controller = new AbortController();`
2. Set a timeout: `const timeoutId = setTimeout(() => controller.abort(), 120000);`
3. Pass `signal: controller.signal` in the fetch options
4. In the finally block (add try/finally around the fetch): `clearTimeout(timeoutId);`
5. In the catch block, check for AbortError: if `error instanceof Error && error.name === 'AbortError'`, return `{ audioUrl: '', error: 'Generation timed out after 2 minutes. The GPU may be cold-starting — please try again.' }`

**File 3: wavium/app/(main)/tracks.tsx — Fix preview, persistence, userId guard (Bugs 2, 5, 6)**

Bug 2 fix (voice preview):
- Import `useMindiStore` to also destructure `recordingUri` from the store
- In `handleSelectVoice`, replace the early return `if (voiceId === 'custom') return;` with:
  ```typescript
  if (voiceId === 'custom') {
    // Play the raw recording as preview (no backend call needed)
    if (!recordingUri) return;
    if (isLoadingVoicePreview.current) return;
    isLoadingVoicePreview.current = true;
    try {
      try { await audio.stop(); } catch {}
      const loaded = await audio.load(recordingUri);
      if (!loaded) { isLoadingVoicePreview.current = false; return; }
      await audio.setVolume(0.8);
      await audio.play();
      previewTimeoutRef.current = setTimeout(() => { audio.stop().catch(() => {}); }, 6000);
    } catch (error) {
      console.warn('Could not play voice preview:', error);
    } finally {
      isLoadingVoicePreview.current = false;
    }
    return;
  }
  ```

Bug 5 fix (selection persistence):
- Change the local state initialization from `useState<VoiceOption | null>(creation.selectedVoice)` to:
  ```typescript
  useState<VoiceOption | null>(
    hasCustomVoice && customVoiceId ? 'custom' : creation.selectedVoice
  )
  ```
  This auto-selects custom voice if user has one and no other voice was explicitly selected. But ONLY as a default — if they previously selected a built-in voice, that wins via creation.selectedVoice being non-null.
  Actually, simpler: just check if `creation.selectedVoice` is null and `hasCustomVoice` is true, then default to 'custom'. Otherwise use `creation.selectedVoice`:
  ```typescript
  const [selectedVoiceId, setSelectedVoiceIdLocal] = useState<VoiceOption | null>(
    creation.selectedVoice ?? (hasCustomVoice && customVoiceId ? 'custom' : null)
  );
  ```

Bug 6 fix (userId null guard):
- Import `useAuthStore` from the auth store
- At the top of the component (after existing destructuring), add:
  ```typescript
  const authUser = useAuthStore((s) => s.user);
  ```
- In `handleCreateSubliminal`, after computing `isClonedVoice`, add a userId resolution:
  ```typescript
  const resolvedUserId = userId || authUser?.id || null;
  if (isClonedVoice && !resolvedUserId) {
    Alert.alert('Error', 'Could not identify your account. Please sign out and sign in again.');
    return;
  }
  ```
- Update the generateVoiceAudio call to use `resolvedUserId` instead of `userId`:
  ```typescript
  const { audioUrl, error } = await generateVoiceAudio(
    creation.affirmations,
    voice,
    isClonedVoice ? customVoiceId : null,
    isClonedVoice ? resolvedUserId : null,
  );
  ```

Also add a "GPU warming up" message: After `setGenerationProgress(30)`, add:
```typescript
// Show GPU warming message after 10s for cloned voice
let warmupTimeout: NodeJS.Timeout | null = null;
if (isClonedVoice) {
  warmupTimeout = setTimeout(() => {
    setGenerationMessage('GPU is warming up — this may take up to a minute...');
  }, 10000);
}
```
And clear it after the generateVoiceAudio call returns: `if (warmupTimeout) clearTimeout(warmupTimeout);`

**File 4: wavium/app/(main)/_layout.tsx — Rehydrate voice status on app load (Bug 3)**

- Import `useEffect` from React
- Import `useMindiStore` from stores
- Import `useAuthStore` from stores
- Import `getVoiceCloneStatus` from services/api
- Inside `MainLayout` component, add a useEffect that runs once on mount:
  ```typescript
  const userId = useMindiStore((s) => s.userId);
  const hasCustomVoice = useMindiStore((s) => s.hasCustomVoice);
  const setCustomVoice = useMindiStore((s) => s.setCustomVoice);
  const authUserId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    const effectiveUserId = userId || authUserId;
    if (effectiveUserId && !hasCustomVoice) {
      getVoiceCloneStatus(effectiveUserId).then(({ hasVoice, voiceId }) => {
        if (hasVoice && voiceId) {
          setCustomVoice(voiceId);
        }
      }).catch(() => {
        // Silently fail — voice status is a nice-to-have on load
      });
    }
  }, [userId, authUserId]);
  ```
  </action>
  <verify>
    <automated>cd /Users/joshuabellhome/wavium && node -e "
const fs = require('fs');

// Check api.ts has AbortController
const api = fs.readFileSync('wavium/src/services/api.ts', 'utf8');
console.assert(api.includes('AbortController'), 'api.ts missing AbortController');
console.assert(api.includes('120000') || api.includes('120_000'), 'api.ts missing 120s timeout');

// Check tracks.tsx has userId fallback and recording preview
const tracks = fs.readFileSync('wavium/app/(main)/tracks.tsx', 'utf8');
console.assert(tracks.includes('useAuthStore'), 'tracks.tsx missing useAuthStore import');
console.assert(tracks.includes('resolvedUserId'), 'tracks.tsx missing resolvedUserId');
console.assert(tracks.includes('recordingUri'), 'tracks.tsx missing recordingUri for preview');
console.assert(!tracks.includes(\"if (voiceId === 'custom') return;\"), 'tracks.tsx still has early return for custom voice');

// Check _layout.tsx has voice rehydration
const layout = fs.readFileSync('wavium/app/(main)/_layout.tsx', 'utf8');
console.assert(layout.includes('getVoiceCloneStatus'), '_layout.tsx missing voice rehydration');

// Check store has recordingUri
const store = fs.readFileSync('wavium/src/stores/useMindiStore.ts', 'utf8');
console.assert(store.includes('recordingUri'), 'store missing recordingUri field');

console.log('All frontend checks passed');
"
    </automated>
  </verify>
  <done>
    - Custom voice tap plays the user's raw recording as a preview (not an early return)
    - Voice status is rehydrated from backend on app load for returning users
    - generateVoiceAudio has a 120s AbortController timeout
    - GPU warming message shown after 10s during cloned voice generation
    - Custom voice selection defaults correctly when returning to tracks screen
    - userId falls back to auth store if MindiStore userId is null, with error alert if both null
    - recordingUri is stored in Zustand and persisted via AsyncStorage
  </done>
</task>

<task type="auto">
  <name>Task 3: Fix backend silent fallback, storage atomicity, and add Railway ephemeral disk TODO</name>
  <files>backend/main.py, backend/services/voice_clone_service.py</files>
  <action>
Fix Bugs 7, 8, 9 on the backend.

**File 1: backend/main.py — Fix silent fallback to edge-tts (Bug 9)**

In the `api_generate_audio` function (around line 190), change the silent fallback behavior:

Replace:
```python
if request.clone_voice_id and request.user_id:
    # Use cloned voice
    ...
else:
    audio_path = await generate_audio(request.affirmations, request.voice)
```

With:
```python
if request.clone_voice_id and request.user_id:
    # Use cloned voice via Modal serverless GPU (XTTS v2)
    from services.voice_clone_service import synthesize_cloned_voice_lines
    audio_path = await synthesize_cloned_voice_lines(
        lines=request.affirmations,
        voice_id=request.clone_voice_id,
        user_id=request.user_id,
    )
elif request.clone_voice_id and not request.user_id:
    # clone_voice_id was specified but user_id is missing — do NOT silently fall back
    import logging
    logging.warning(
        f"clone_voice_id={request.clone_voice_id} specified but user_id is missing. "
        "Cannot synthesize cloned voice without user_id."
    )
    raise HTTPException(
        status_code=400,
        detail="user_id is required when using a cloned voice (clone_voice_id was provided but user_id was missing)"
    )
else:
    audio_path = await generate_audio(request.affirmations, request.voice)
```

Do the same check in `api_generate_subliminal` if a similar pattern exists there (check around line 210+ for the same `if request.clone_voice_id and request.user_id` pattern).

**Bug 8 — Railway ephemeral disk TODO:**

In `backend/main.py`, find the StaticFiles mount for audio (around line 81-83). Add a comment:
```python
# TODO: Audio files are stored on Railway's ephemeral disk and lost on redeploy.
# Future fix: Upload generated audio to Supabase Storage and serve signed URLs.
# This affects replay of saved subliminals after Railway restarts.
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")
```

**File 2: backend/services/voice_clone_service.py — Atomic storage + postgres (Bug 7)**

In `clone_voice()`, wrap the Postgres metadata save in a try/except that rolls back the Storage upload on failure:

Replace the sequential upload + metadata save (lines ~93-100) with:
```python
# Upload WAV to Supabase Storage
await loop.run_in_executor(
    None, lambda: upload_voice_sample(user_id, voice_id, wav_bytes)
)

# Save metadata — rollback storage upload if this fails
try:
    await loop.run_in_executor(
        None, lambda: save_voice_metadata(user_id, voice_id, name)
    )
except Exception as e:
    # Rollback: delete the orphaned Storage file
    import logging
    logging.warning(f"Postgres metadata save failed for voice {voice_id}, rolling back Storage upload: {e}")
    try:
        from services.supabase_storage_service import delete_voice_data
        await loop.run_in_executor(
            None, lambda: delete_voice_data(user_id)
        )
    except Exception as rollback_err:
        logging.error(f"Storage rollback also failed: {rollback_err}")
    raise  # Re-raise the original error so the endpoint returns 500
```
  </action>
  <verify>
    <automated>cd /Users/joshuabellhome/wavium && python3 -c "
import ast
with open('backend/main.py') as f:
    source = f.read()
# Check silent fallback protection
assert 'clone_voice_id and not request.user_id' in source or 'not request.user_id' in source, 'missing user_id guard for clone path'
assert 'user_id is required when using a cloned voice' in source, 'missing error message for missing user_id'
# Check ephemeral disk TODO
assert 'ephemeral disk' in source.lower() or 'ephemeral' in source, 'missing ephemeral disk TODO'

with open('backend/services/voice_clone_service.py') as f:
    vc_source = f.read()
# Check rollback logic
assert 'rollback' in vc_source.lower() or 'Rollback' in vc_source, 'missing rollback logic in clone_voice'
print('All backend checks passed')
"
    </automated>
  </verify>
  <done>
    - Backend returns HTTP 400 with clear message when clone_voice_id is set but user_id is missing (no silent fallback)
    - Railway ephemeral disk limitation documented with TODO for future Supabase Storage migration
    - Storage upload is rolled back if Postgres metadata insert fails (no orphaned files)
  </done>
</task>

</tasks>

<verification>
After all 3 tasks complete:

1. `python3 -c "import ast; ast.parse(open('backend/modal_tts/app.py').read()); print('Modal app parses')"` — Modal app is valid Python
2. `python3 -c "import ast; ast.parse(open('backend/main.py').read()); print('main.py parses')"` — Backend main is valid Python
3. `python3 -c "import ast; ast.parse(open('backend/services/voice_clone_service.py').read()); print('voice_clone_service parses')"` — Voice clone service is valid Python
4. `cd wavium && npx tsc --noEmit --pretty 2>&1 | head -30` — TypeScript compiles without errors (may have pre-existing warnings)

Manual deploy steps (NOT part of this plan — user action):
- `modal deploy backend/modal_tts/app.py` — Redeploy the fixed Modal endpoint
- Verify MODAL_ENDPOINT_URL is set on Railway env vars
</verification>

<success_criteria>
All 10 bugs addressed:
1. Modal endpoint is a class method with access to self.tts (not a broken standalone function)
2. Custom voice preview plays the raw recording URI
3. Voice status rehydrated from backend on app load via _layout.tsx
4. 120s AbortController timeout on generateVoiceAudio with GPU warming message
5. Custom voice selection persists across screen navigation
6. userId resolves from auth store as fallback, with error alert if null
7. Storage upload rolled back on Postgres failure
8. Railway ephemeral disk documented with TODO
9. Silent fallback to edge-tts replaced with HTTP 400 error
10. Temp files use UUID-based paths to prevent race conditions
</success_criteria>

<output>
After completion, create `.planning/quick/4-fix-all-voice-cloning-bugs-modal-endpoin/4-SUMMARY.md`
</output>
