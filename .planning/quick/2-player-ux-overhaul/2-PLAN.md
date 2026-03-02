---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  # Task 1 — Backend: longer affirmations + name personalization
  - backend/services/groq_service.py
  - backend/services/tts_service.py
  - backend/main.py
  # Task 2 — Audio: crossfade looping + volume persistence + home ambient
  - wavium/src/systems/CrossfadeAudioPair.ts
  - wavium/src/components/void/VoidContainer.tsx
  - wavium/src/stores/useMindiStore.ts
  - wavium/src/services/api.ts
  - wavium/src/components/ui/HomeAmbientPlayer.tsx
  - wavium/app/(main)/_layout.tsx
  - wavium/app/(main)/home.tsx
  # Task 3 — Visual: affirmation redesign, Mindi reposition, shooting stars, glassmorphic controls, vignette, entrance, celebration
  - wavium/src/components/void/AffirmationSpirals.tsx
  - wavium/src/components/void/StarField.tsx
  - wavium/src/components/void/PlayerControls.tsx
  - wavium/src/components/mindi/MindiRenderer.tsx
autonomous: true
requirements: [PLAYER-UX-OVERHAUL]

must_haves:
  truths:
    - "Background audio loops seamlessly with crossfade (no hard pop/click at loop boundary)"
    - "Affirmations show one at a time in lower half, crossfading between them"
    - "Mindi is positioned in upper third of screen, translucent, not blocking affirmation text"
    - "Affirmations include user's name and there are 25-30 per session"
    - "Volume settings persist across sessions via AsyncStorage"
    - "Shooting stars streak across the void every 8-15 seconds"
    - "Player controls have glassmorphic bottom bar styling"
    - "Home screen plays soft ambient music on mount"
  artifacts:
    - path: "wavium/src/systems/CrossfadeAudioPair.ts"
      provides: "Seamless crossfade audio looping utility"
      exports: ["CrossfadeAudioPair"]
    - path: "wavium/src/components/ui/HomeAmbientPlayer.tsx"
      provides: "Ambient audio on home screen"
      exports: ["default"]
    - path: "wavium/src/components/void/AffirmationSpirals.tsx"
      provides: "One-at-a-time affirmation display with crossfade"
    - path: "backend/services/groq_service.py"
      provides: "25-30 personalized affirmations with user name"
  key_links:
    - from: "wavium/src/systems/CrossfadeAudioPair.ts"
      to: "wavium/src/components/void/VoidContainer.tsx"
      via: "import and instantiation replacing raw Audio.Sound refs"
      pattern: "CrossfadeAudioPair"
    - from: "wavium/src/stores/useMindiStore.ts"
      to: "wavium/src/components/void/VoidContainer.tsx"
      via: "persisted voiceVolume and backgroundVolume read on mount"
      pattern: "voiceVolume|backgroundVolume"
    - from: "wavium/src/components/ui/HomeAmbientPlayer.tsx"
      to: "wavium/app/(main)/_layout.tsx"
      via: "mounted as sibling to Slot for persistent playback"
      pattern: "HomeAmbientPlayer"
---

<objective>
Complete Player UX overhaul across backend and frontend: seamless audio crossfade looping, longer personalized affirmations with user name, one-at-a-time affirmation display, Mindi repositioned to upper third, shooting stars, glassmorphic controls, vignette overlay, staggered entrance, haptic sync, volume persistence, home screen ambient music, and session completion celebration.

Purpose: Transform the player from a functional prototype into a polished, immersive experience where audio never hard-stops, affirmations feel personal, and the visual atmosphere is premium.
Output: Updated backend services, new CrossfadeAudioPair system, redesigned AffirmationSpirals, visual polish across VoidContainer/StarField/PlayerControls/MindiRenderer, home ambient player.
</objective>

<execution_context>
@/Users/joshuabellhome/.claude/get-shit-done/workflows/execute-plan.md
@/Users/joshuabellhome/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@wavium/src/components/void/VoidContainer.tsx
@wavium/src/components/void/AffirmationSpirals.tsx
@wavium/src/components/void/PlayerControls.tsx
@wavium/src/components/void/StarField.tsx
@wavium/src/components/void/NebulaRenderer.tsx
@wavium/src/components/mindi/MindiRenderer.tsx
@wavium/src/stores/useMindiStore.ts
@wavium/src/services/api.ts
@wavium/app/(main)/_layout.tsx
@wavium/app/(main)/home.tsx
@backend/services/groq_service.py
@backend/services/tts_service.py
@backend/main.py

<interfaces>
<!-- Key types and contracts the executor needs -->

From wavium/src/stores/useMindiStore.ts:
```typescript
export type MindiState = 'idle' | 'listening' | 'peaceful' | 'happy' | 'excited' | 'generating';
export type SoundTrack = 'ocean-waves' | 'rainfall' | 'deep-focus' | 'cosmic-drift' | 'lofi-chill' | 'lofi-dream' | 'lofi-jazz' | 'zen-garden' | 'night-drive' | 'forest-dawn';
export type VoiceId = 'ava' | 'emma' | 'andrew' | 'sonia' | 'brian';
// Store uses zustand persist with AsyncStorage (key: 'wavium-store')
```

From wavium/src/components/void/VoidContainer.tsx:
```typescript
interface VoidContainerProps {
  audioUrl: string;
  affirmations: string[];
  title: string;
  duration: number;
  track?: string;
  onClose?: () => void;
  onComplete?: () => void;
  onToggleScript?: () => void;
}
// Currently uses bgSoundRef and voiceSoundRef (Audio.Sound refs)
// backgroundVolume default 0.7, voiceVolume default 0.15
```

From wavium/src/components/void/AffirmationSpirals.tsx:
```typescript
interface AffirmationSpiralsProps {
  affirmations: string[];
  isPlaying: boolean;
  audioLevel?: SharedValue<number>;
  currentIndex?: number;
}
// Currently renders ALL affirmations in a ScrollView with staggered reveal
```

From backend/main.py:
```python
class GenerateAffirmationsRequest(BaseModel):
    intention: str
# No user_name field currently
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Backend — Longer personalized affirmations with user name</name>
  <files>
    backend/services/groq_service.py
    backend/services/tts_service.py
    backend/main.py
  </files>
  <action>
**groq_service.py:**
1. Update SYSTEM_PROMPT to request 25-30 affirmations (currently 10-15). Add instruction: "Generate 25-30 affirmations" and "Occasionally weave in the user's first name naturally (e.g., 'You are powerful, {name}' or '{name}, you attract abundance') — use the name in roughly 30% of affirmations, not every one."
2. Update `generate_affirmations` signature to accept optional `user_name: str = ""` parameter.
3. Modify the user message to include the name: `f"Create affirmations for {user_name + ' who' if user_name else 'someone who'} wants to: {intention}"`. Also add a system-level note: if user_name is provided, include it naturally in ~30% of affirmations.

**main.py:**
1. Add `user_name: str = ""` field to `GenerateAffirmationsRequest` model.
2. Pass `user_name` through to `generate_affirmations()` call in `api_generate_affirmations` endpoint.

**tts_service.py:**
1. In `generate_subliminal`, after joining affirmations with pauses, shuffle the affirmation list before repeating so loops feel fresh: after joining `full_text`, if the resulting TTS audio would be short relative to `duration_secs`, duplicate and shuffle affirmations to fill more time. Specifically: if `len(affirmations) < 25`, repeat the list with `random.shuffle` to reach ~30 items before joining.
2. Add a gentle 2-second fade-in and 2-second fade-out to the final mix by updating the FFmpeg filter_complex: add `afade=t=in:st=0:d=2` to the voice track and `afade=t=out:st={duration_secs-2}:d=2` to the output.
  </action>
  <verify>
    <automated>cd /Users/joshuabellhome/wavium/backend && python -c "from services.groq_service import generate_affirmations; from services.tts_service import generate_subliminal; from main import GenerateAffirmationsRequest; req = GenerateAffirmationsRequest(intention='be confident', user_name='Josh'); print('OK: user_name field accepted')"</automated>
  </verify>
  <done>
    - GenerateAffirmationsRequest accepts user_name field
    - groq_service generates 25-30 affirmations with name personalization in ~30%
    - tts_service shuffles repeated affirmations for variety and applies fade-in/fade-out
    - Backend imports and model validation pass without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Audio system — CrossfadeAudioPair, volume persistence, home ambient</name>
  <files>
    wavium/src/systems/CrossfadeAudioPair.ts
    wavium/src/components/void/VoidContainer.tsx
    wavium/src/stores/useMindiStore.ts
    wavium/src/services/api.ts
    wavium/src/components/ui/HomeAmbientPlayer.tsx
    wavium/src/components/ui/index.ts
    wavium/app/(main)/_layout.tsx
    wavium/app/(main)/home.tsx
  </files>
  <action>
**CrossfadeAudioPair.ts (NEW — create `wavium/src/systems/` directory if needed):**
Create a class `CrossfadeAudioPair` that manages seamless looping audio:
- Holds two `Audio.Sound` instances (soundA, soundB) and tracks which is "active"
- `async load(uri: string, volume: number)` — loads the URI into soundA and starts playing
- Uses `setOnPlaybackStatusUpdate` to detect when the active sound reaches 3 seconds before its end (`durationMillis - positionMillis < 3000`)
- When near-end detected: load the same URI into the inactive sound, set its volume to 0, start playing it, then crossfade over 2.5s using `setInterval` (every 50ms, step volume: active decreases, inactive increases linearly)
- After crossfade completes, swap active/inactive references
- `async setVolume(volume: number)` — sets volume on the currently active sound
- `async stop()` — stops both sounds
- `async unload()` — unloads both sounds
- Export the class as default and named export

**useMindiStore.ts:**
1. Add persisted fields to the store state: `voiceVolume: number` (default 0.15), `backgroundVolume: number` (default 0.7), `userName: string` (default '')
2. Add actions: `setVoiceVolume: (v: number) => void`, `setBackgroundVolume: (v: number) => void`, `setUserName: (name: string) => void`
3. These are persisted via the existing zustand persist middleware (already using AsyncStorage)

**VoidContainer.tsx:**
1. Import `CrossfadeAudioPair` and replace `bgSoundRef` with a `useRef<CrossfadeAudioPair>` initialized to `new CrossfadeAudioPair()`. Replace `voiceSoundRef` similarly.
2. Read initial volumes from store: `const { voiceVolume: storedVoiceVolume, backgroundVolume: storedBgVolume, setVoiceVolume: persistVoiceVolume, setBackgroundVolume: persistBgVolume, userName } = useMindiStore()`
3. Initialize `voiceVolume` and `backgroundVolume` state from store values instead of hardcoded 0.15/0.7.
4. In `playTwoStreams`, use `bgCrossfade.current.load(bgUrl, backgroundVolume)` instead of `Audio.Sound.createAsync`. For voice, use `voiceCrossfade.current.load(audioUrl, voiceVolume)`.
5. In `handleVoiceVolumeChange` and `handleBackgroundVolumeChange`, also call `persistVoiceVolume(value)` / `persistBgVolume(value)` to save to store.
6. In `stopAllAudio`, call `.stop()` on both CrossfadeAudioPair instances.
7. In cleanup useEffect, call `.unload()` on both instances.
8. Update `handleSeek` to work with the crossfade pair (expose a `setPosition` method on CrossfadeAudioPair that seeks the active sound).

**api.ts:**
1. Update `generateSubliminalAudio` to accept optional `userName` parameter and pass it to the request body as `user_name`.
2. Update default `durationSecs` from 300 to 1800 to match the player's duration.
3. Add the `user_name` field to the generate-affirmations fetch call as well (add a `generateAffirmations` function if it doesn't exist, or update the existing flow where affirmations are generated).

**HomeAmbientPlayer.tsx (NEW):**
Create a minimal component that:
- Plays a quiet ambient track (`ocean-waves` at volume 0.08) on mount using `Audio.Sound.createAsync` with `isLooping: true`
- Accepts an `isActive` boolean prop — when false (e.g., player screen is open), fades volume to 0 over 500ms
- Fades in on mount over 1s from volume 0 to 0.08
- Cleans up (unloads) on unmount
- Uses `Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false })` on mount
- Export as default

**_layout.tsx:**
1. Import HomeAmbientPlayer
2. Mount it as a sibling before the `<Slot />`, passing `isActive={!pathname.includes('/player')}`

**home.tsx:**
1. Read `userName` from the store (already has access to useMindiStore)
2. Update the greeting to use userName if available: instead of "Welcome back", show `"Welcome back, {userName}"` — only if userName is non-empty, otherwise keep "Welcome back"
  </action>
  <verify>
    <automated>cd /Users/joshuabellhome/wavium/wavium && npx tsc --noEmit --pretty 2>&1 | head -40</automated>
  </verify>
  <done>
    - CrossfadeAudioPair class created with load/crossfade/stop/unload/setVolume/setPosition methods
    - VoidContainer uses CrossfadeAudioPair for both bg and voice streams — no hard loop boundaries
    - Volume settings persist to AsyncStorage via store and restore on next session
    - HomeAmbientPlayer plays soft ocean-waves on home screen, fades out when entering player
    - Home screen greeting shows user's name when available
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 3: Visual polish — Affirmation redesign, Mindi reposition, shooting stars, glassmorphic controls, vignette, entrance, celebration</name>
  <files>
    wavium/src/components/void/AffirmationSpirals.tsx
    wavium/src/components/void/VoidContainer.tsx
    wavium/src/components/void/StarField.tsx
    wavium/src/components/void/PlayerControls.tsx
    wavium/src/components/mindi/MindiRenderer.tsx
  </files>
  <action>
**AffirmationSpirals.tsx — FULL REDESIGN:**
1. Remove ScrollView and the "show all affirmations" approach entirely.
2. Show ONE affirmation at a time, centered in the lower half of the screen (below center, roughly 60-75% down).
3. Use a crossfade transition between affirmations: outgoing text fades out + translateY -20 over 600ms, incoming text fades in + translateY from +20 to 0 over 600ms, with 200ms overlap.
4. Use Reanimated's `useAnimatedStyle` with shared values for opacity and translateY. When `currentIndex` changes, trigger the transition.
5. Keep the glow effect on the current affirmation (textShadowColor from primaryGradient[0], textShadowRadius pulsing 10-25).
6. Style: `fontFamily: fontFamilies.editorialRegular`, `fontSize: 22`, centered, `paddingHorizontal: 40`, max 3 lines with ellipsis.
7. Add a subtle "breath" scale animation (1.0 to 1.02 over 4s, repeating) on the text container for a living feel.

**VoidContainer.tsx — Layout changes (add to Task 2 modifications):**
1. Reposition mindiContainer: change from `justifyContent: 'center'` to `top: SCREEN_HEIGHT * 0.18` (upper third). Remove `justifyContent`/`alignItems` from style.absoluteFillObject approach — use explicit `position: absolute, top: SCREEN_HEIGHT * 0.18, alignSelf: 'center'`.
2. Add a vignette overlay: after the ParallaxLayer, before the tap area, add a `<LinearGradient>` covering the full screen with colors `['transparent', 'transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']` and locations `[0, 0.4, 0.75, 1.0]` — this darkens the bottom for better text readability. Set `pointerEvents="none"`.
3. Add staggered entrance animation: wrap each layer (StarField, Nebula, Mindi, Affirmations) in `<Animated.View entering={FadeIn.delay(index * 200).duration(800)}>` for a cinematic reveal when the void opens.
4. Add session completion celebration: when `currentTime >= duration` (or within 2s of duration), trigger a celebration sequence: set Mindi state to 'happy', fire `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`, and show a brief "Session Complete" overlay text that fades in for 2s then calls `onComplete?.()`.

**StarField.tsx — Shooting stars:**
1. Add a `ShootingStar` component: a small Skia `Line` or animated `View` that streaks diagonally across the screen. Start from random position on right or top edge, travel at ~30-45 degree angle, with a trail (opacity gradient from 1.0 to 0 along length).
2. Use a simple `View` approach: position absolute, width 80-120px, height 2px, rotated -30deg, with a horizontal LinearGradient from `colors.textPrimary` (opacity 0.8) to transparent.
3. Animate translateX from right edge to left edge + translateY downward, over 600-800ms, with `FadeIn` and `FadeOut`.
4. In the parent StarField (specifically only the 'near' layer to avoid triple-rendering), use a `useEffect` with `setInterval` at random 8000-15000ms intervals to spawn a shooting star. Track active shooting stars in state (max 1 at a time). Each star auto-removes after animation completes.

**PlayerControls.tsx — Glassmorphic bottom bar:**
1. Wrap the entire `bottomBar` View in a `BlurView` with `intensity={25}` and `overflow: 'hidden'`.
2. Add `borderRadius: 24` to the bottom bar container, `marginHorizontal: 16`, `marginBottom: 8`, `padding: 20`.
3. Add a subtle top border: `borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)'`.
4. Add the glass surface gradient: a `<LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} />` as an absolute-fill child behind content.
5. Keep existing controls layout but tighten spacing to fit the contained card feel.

**MindiRenderer.tsx — Translucency prop:**
1. Add optional `opacity?: number` prop to `MindiRendererProps` (default 1.0).
2. Apply this opacity to the outermost container or the entrance style: multiply `entranceOpacity.value * (opacity ?? 1)` in the entranceStyle.
3. In VoidContainer.tsx, pass `opacity={0.7}` to MindiRenderer when it's rendered in the void (upper third position) — makes Mindi translucent so affirmation text behind/below is partially visible.
4. Increase audio reactivity: change the audio scale multiplier in `animatedStyle` from `0.05` to `0.12` for more visible pulsing with the beat.
  </action>
  <verify>
    <automated>cd /Users/joshuabellhome/wavium/wavium && npx tsc --noEmit --pretty 2>&1 | head -40</automated>
  </verify>
  <done>
    - AffirmationSpirals shows one affirmation at a time in lower half with crossfade transitions
    - Mindi repositioned to upper third at ~18% from top, rendered at 0.7 opacity
    - Shooting stars appear every 8-15s in the near StarField layer
    - PlayerControls bottom bar has glassmorphic card with blur, rounded corners, glass gradient
    - Vignette gradient overlay darkens bottom of void for text readability
    - Staggered entrance animations on void layers for cinematic open
    - Session completion fires celebration haptic and shows overlay before calling onComplete
    - MindiRenderer accepts opacity prop and has increased audio reactivity (0.12 multiplier)
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. `cd /Users/joshuabellhome/wavium/wavium && npx tsc --noEmit` — TypeScript compiles cleanly
2. `cd /Users/joshuabellhome/wavium/backend && python -c "from main import app; print('Backend OK')"` — Backend imports work
3. Visual check: Open the void player and verify:
   - Mindi is in upper third, translucent
   - One affirmation at a time in lower half, crossfading
   - Shooting stars appear periodically
   - Bottom controls have glassmorphic card styling
   - Audio loops without clicks/pops (crossfade)
   - Vignette visible at bottom edge
</verification>

<success_criteria>
- Audio loops seamlessly with no audible gap or pop at loop boundaries
- Affirmations display one-at-a-time with smooth crossfade transitions
- Mindi is positioned in upper ~18% of screen at 0.7 opacity
- Player controls are wrapped in a glassmorphic rounded card
- Shooting stars streak across near star layer every 8-15 seconds
- Home screen plays quiet ambient music that fades when entering player
- Volume settings survive app restart via persisted store
- Session completion triggers celebration haptic + overlay
- Backend generates 25-30 affirmations with user name woven into ~30%
</success_criteria>

<output>
After completion, create `.planning/quick/2-player-ux-overhaul/2-SUMMARY.md`
</output>
