---
status: awaiting_human_verify
trigger: "Full app audit — TTS cuts out mid-playback, new UI components untested, Supabase auth unknown"
created: 2026-03-02T00:00:00Z
updated: 2026-03-02T00:30:00Z
---

## Current Focus

hypothesis: All bugs found and fixed. Supabase auth does not exist yet (confirmed).
test: Full code audit of all critical files completed
expecting: Voice TTS loops continuously; ambient player does not interfere; UI components stable
next_action: Human verifies playback session and acknowledges Supabase status

## Symptoms

expected: Voice TTS plays continuously through entire session without cutting out. All new UI components work correctly. Supabase auth login/logout functions properly.
actual: Voice audio cuts out mid-playback during player session. Other components untested/unaudited. Supabase auth status unknown.
errors: No specific error messages — audio just stops.
reproduction: Start a subliminal playback session, voice audio stops partway through.
started: After quick task 2 (player UX overhaul) which added CrossfadeAudioPair system.

## Eliminated

- hypothesis: Bug was in VoidContainer orchestration (wrong load order, bad cleanup)
  evidence: VoidContainer is clean — load/stop/unload all correct. Bug was inside CrossfadeAudioPair itself.
  timestamp: 2026-03-02T00:00:00Z

- hypothesis: HomeAmbientPlayer conflicts via shared Audio.Sound instances
  evidence: Separate Audio.Sound instances. Conflict was only via setAudioModeAsync (now fixed).
  timestamp: 2026-03-02T00:20:00Z

## Evidence

- timestamp: 2026-03-02T00:00:00Z
  checked: CrossfadeAudioPair.ts _startCrossfade() stale reference
  found: |
    activeSound and incomingSound were captured AFTER this.soundA/soundB were
    reassigned to newSound. When inactiveRef === 'A': both variables pointed to the
    same new sound. Crossfade interval set volume in both directions on same instance
    (cancelling to ~0), then stopAsync() silenced it entirely.
  implication: Primary cause of every TTS cutout.

- timestamp: 2026-03-02T00:05:00Z
  checked: CrossfadeAudioPair.ts _attachStatusUpdate() — no didJustFinish guard
  found: |
    If audio ended before remaining <= 3000ms was polled, isPlaying became false
    and the guard `if (!durationMillis || !isPlaying) return` blocked the trigger.
    Sound ended silently with no restart.
  implication: Secondary TTS cutout cause for short clips.

- timestamp: 2026-03-02T00:10:00Z
  checked: HomeAmbientPlayer.tsx — Audio.setAudioModeAsync({ staysActiveInBackground: false })
  found: |
    Called on every mount. HomeAmbientPlayer is always mounted in _layout.tsx.
    Would stomp VoidContainer's staysActiveInBackground: true on iOS, killing
    background audio when app is backgrounded during a player session.
  implication: Latent iOS background playback bug.

- timestamp: 2026-03-02T00:15:00Z
  checked: HomeAmbientPlayer.tsx — load/isActive race condition
  found: |
    isActive effect returns early if soundRef.current === null. If isActive went
    false before loadAndPlay() finished, the sound loaded and immediately faded in
    even though the player was open.
  implication: Ambient audio could bleed into player session on slow connections.

- timestamp: 2026-03-02T00:20:00Z
  checked: AffirmationSpirals.tsx — textShadowRadius in useAnimatedStyle
  found: |
    glowRadius SharedValue returned as textShadowRadius from useAnimatedStyle.
    Not animatable on Fabric/new architecture — causes yellow warnings in dev,
    potential crash on Fabric builds.
  implication: New arch compatibility bug.

- timestamp: 2026-03-02T00:25:00Z
  checked: StarField.tsx, PlayerControls.tsx, MindiRenderer.tsx
  found: All three clean. No bugs found.
  implication: No action needed.

- timestamp: 2026-03-02T00:28:00Z
  checked: Supabase — searched all .ts/.tsx files for "supabase"
  found: ZERO matches. No supabase client, no auth screens, no login/logout exist.
  implication: Supabase auth is a missing feature, not a bug. Must be built from scratch.

## Fixes Applied

### Fix 1 — CrossfadeAudioPair: stale sound reference (PRIMARY TTS CUTOUT)
File: wavium/wavium/src/systems/CrossfadeAudioPair.ts
Captured `outgoingSound` BEFORE reassigning sound slots. Interval now uses
`outgoingSound` (old, fading out) and `newSound` (new, fading in) as distinct refs.

### Fix 2 — CrossfadeAudioPair: short audio never loops (SECONDARY TTS CUTOUT)
File: wavium/wavium/src/systems/CrossfadeAudioPair.ts
Added `didJustFinish` check — immediately calls _startCrossfade() as hard-loop
fallback if audio ends before the window fires. Dynamic trigger window:
min(3000ms, max(500ms, duration * 10%)).

### Fix 3 — CrossfadeAudioPair: active-check and crossfading guard at top
File: wavium/wavium/src/systems/CrossfadeAudioPair.ts
amActive and crossfading guards moved to top of status callback, before any
property access, preventing inactive sound from double-triggering.

### Fix 4 — HomeAmbientPlayer: setAudioModeAsync overriding VoidContainer
File: wavium/wavium/src/components/ui/HomeAmbientPlayer.tsx
Removed Audio.setAudioModeAsync call entirely. Audio mode managed by VoidContainer.

### Fix 5 — HomeAmbientPlayer: load/isActive race
File: wavium/wavium/src/components/ui/HomeAmbientPlayer.tsx
Added `if (isActive)` guard in loadAndPlay() so ambient does not fade in if
the player opened before the async load completed.

### Fix 6 — AffirmationSpirals: textShadowRadius in useAnimatedStyle
File: wavium/wavium/src/components/void/AffirmationSpirals.tsx
Removed textShadowRadius from useAnimatedStyle (not animatable on Fabric).
Moved to static StyleSheet. Removed glowRadius SharedValue + animation (unused).
Cleaned up GLOW_PULSE_MIN and GLOW_PULSE_DURATION constants.

## Components Audited — Clean

- StarField.tsx: shooting star scheduling correct, no bugs
- PlayerControls.tsx: JSX nesting correct, all props typed correctly, no bugs
- MindiRenderer.tsx: opacity prop wired correctly (entranceOpacity * opacity), no bugs

## Supabase Auth Status

NOT INTEGRATED. Zero references in codebase. Missing feature, not a bug.

## Resolution

root_cause: |
  CrossfadeAudioPair._startCrossfade() captured sound references after slot
  reassignment — both variables pointed to same new instance every cycle.
  All audio silenced on every crossfade. Secondary: no didJustFinish guard
  meant short clips that ended before the 3s window never restarted.

fix: |
  6 fixes applied across 3 files. See Fixes Applied above.

verification: awaiting human confirmation
files_changed:
  - wavium/wavium/src/systems/CrossfadeAudioPair.ts
  - wavium/wavium/src/components/ui/HomeAmbientPlayer.tsx
  - wavium/wavium/src/components/void/AffirmationSpirals.tsx
