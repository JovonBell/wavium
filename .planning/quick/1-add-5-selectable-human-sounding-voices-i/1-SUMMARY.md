---
phase: quick
plan: 1
subsystem: voice-selection
tags: [tts, voice-picker, ui, personalization, decoupling]
dependency_graph:
  requires: []
  provides: [voice-selection-ui, decoupled-voice-config]
  affects: [tracks-screen, audio-generation, store]
tech_stack:
  added: []
  patterns: [glassmorphic-card-list, zustand-creation-state]
key_files:
  created: []
  modified:
    - backend/services/tts_service.py
    - backend/main.py
    - wavium/src/stores/useMindiStore.ts
    - wavium/app/(main)/tracks.tsx
    - wavium/src/services/api.ts
decisions:
  - "Voice selection decoupled from track: selectedVoice added to CreationState independently of selectedTrack"
  - "Default voice changed from jenny to ava across backend and API service"
  - "Voice cards use woman/man Ionicons icons keyed off gender field for visual distinction"
  - "Create button requires both selectedTrackId and selectedVoiceId — enforces complete selection before generation"
metrics:
  duration: 163s
  completed: 2026-03-02
  tasks_completed: 2
  files_modified: 5
---

# Quick Task 1: Add 5 Selectable Human-Sounding Voices Summary

**One-liner:** Five curated edge-tts voices (Ava, Emma, Andrew, Sonia, Brian) with independent voice picker UI on tracks screen, fully decoupled from soundtrack selection.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Expand backend to 5 curated voices and update store with voice selection | e2be970 | tts_service.py, main.py, useMindiStore.ts |
| 2 | Add voice picker UI to tracks screen and wire voice through audio generation | 6ca8cb8 | tracks.tsx, api.ts |

## What Was Built

### Backend Changes (`backend/services/tts_service.py`, `backend/main.py`)

- Replaced 4-voice VOICES dict (`jenny`, `guy`, `aria`, `sonia`) with 5 curated Natural Neural voices:
  - `ava` — en-US-AvaNeural (Warm & smooth, female)
  - `emma` — en-US-EmmaNeural (Gentle & soothing, female)
  - `andrew` — en-US-AndrewNeural (Calm & deep, male)
  - `sonia` — en-GB-SoniaNeural (Warm & elegant, female)
  - `brian` — en-US-BrianNeural (Steady & reassuring, male)
- Added `gender` field to `VoiceInfo` Pydantic model and `get_available_voices()` return data
- Updated all default voice parameters from `"jenny"` to `"ava"` (generate_audio, generate_subliminal, request models)
- Updated `/api/voices` endpoint to pass `gender` field when constructing VoiceInfo

### Store Changes (`wavium/src/stores/useMindiStore.ts`)

- Added `VoiceId` type: `'ava' | 'emma' | 'andrew' | 'sonia' | 'brian'`
- Added `VOICES` config constant with name, gender, description, icon per voice
- Removed `voice` field from `SOUND_TRACKS` entries (decoupled voice from track)
- Added `selectedVoice: VoiceId | null` to `CreationState` interface (default null)
- Added `setSelectedVoice: (voice: VoiceId) => void` to `MindiStoreState` interface
- Implemented `setSelectedVoice` action in store (same pattern as `setSelectedTrack`)

### Tracks Screen Changes (`wavium/app/(main)/tracks.tsx`)

- Added "Choose Your Voice" section header above track picker with subtitle "Who whispers your affirmations?"
- Added 5 compact voice cards (56px min-height) in a vertical list using `GlassmorphicCard`
- Each card shows: `woman`/`man` Ionicons icon (gender-keyed), voice name, description, radio button
- Gold primary color selection state matches existing track card pattern
- `FadeInDown` stagger animations (80ms apart) consistent with track cards
- Added `handleSelectVoice` with `Haptics.impactAsync(Light)` feedback
- Updated page title to "Personalize Your Experience" with section-level "Choose Your Voice" / "Choose Your Sound" headers
- Updated `handleCreateSubliminal` to use `selectedVoiceId` directly (removed `trackConfig.voice` coupling)
- Create button now requires both `selectedTrackId` AND `selectedVoiceId`

### API Service Changes (`wavium/src/services/api.ts`)

- Added `gender` field to `VoiceInfo` interface
- Updated default voice from `'jenny'` to `'ava'` in both `generateVoiceAudio` and `generateSubliminalAudio`

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- TypeScript: `npx tsc --noEmit` passes with zero errors
- 5 voices correctly defined in backend with gender metadata
- Voice selection flows through: UI state -> store (setSelectedVoice) -> handleCreateSubliminal -> generateVoiceAudio(affirmations, voice)
- SOUND_TRACKS no longer has voice field

## Self-Check: PASSED

Files exist:
- backend/services/tts_service.py — FOUND
- backend/main.py — FOUND
- wavium/src/stores/useMindiStore.ts — FOUND
- wavium/app/(main)/tracks.tsx — FOUND
- wavium/src/services/api.ts — FOUND

Commits exist:
- e2be970 — Task 1 commit — FOUND
- 6ca8cb8 — Task 2 commit — FOUND
