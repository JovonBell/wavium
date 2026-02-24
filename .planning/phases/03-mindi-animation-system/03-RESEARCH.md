# Phase 3: Mindi Animation System - Research

**Researched:** 2026-02-24
**Confidence:** HIGH

## Current State Analysis

### VoidContainer.tsx (CRITICAL — MIND-05)
- `audioLevel` is `useState(0)` updated every 100ms via `setInterval` → causes full component tree re-render 10x/sec
- All children receive `audioLevel` as number prop: StarField, NebulaRenderer, AffirmationSpirals, MindiRenderer
- MindiRenderer passes it to MindiGlow
- **Fix:** Change to `useSharedValue(0)`, pass SharedValue to children, read on UI thread

### MindiRenderer.tsx
- Has floating animation (floatY) and state-specific animations (scale, headTilt)
- NO explicit breathing scale pulse (1.0→1.02, 4s) for idle — the `floatY` bounce handles vertical motion but not the "breathing" scale
- `audioLevel` received as number prop, used in animatedStyle: `scale: scale.value * (1 + audioLevel * 0.05)`
- No entrance animation on screen transitions

### MindiGlow.tsx
- `audioLevel` received as number prop, used in animatedStyle and Skia opacity
- `pulseAnim` SharedValue drives scale/opacity pulsing
- Correct pattern but audioLevel prop causes re-renders when parent passes new value

### MindiEyes.tsx
- Has `pupilX`, `pupilY` SharedValues but only driven by state changes
- No touch position tracking — eyes don't follow finger
- Blinking works well (random interval)

### Missing: useLoop hook (MIND-06)
- Multiple components use `withRepeat(withTiming(...), -1, true)` pattern
- None have proper `cancelAnimation()` cleanup in useEffect return
- Memory leak risk on unmount

### Missing: Skia interpolateColors (PERF-02)
- NebulaRenderer uses theme tokens as static string props to Skia Circle colors
- No dynamic color interpolation currently happening in Skia components
- This requirement is partially met — no wrong interpolateColor usage exists
- Add interpolateColors from @shopify/react-native-skia where needed

## Plan Structure

### Wave 1 (parallel):
- **03-01:** useLoop hook + audioLevel SharedValue refactor (MIND-05, MIND-06) — architectural foundation
- **03-02:** Mindi breathing + glow audio sync (MIND-01, MIND-02, PERF-02) — animation implementation

### Wave 2 (depends on Wave 1):
- **03-03:** Eye tracking + entrance animations (MIND-03, MIND-04) — depends on SharedValue plumbing from 03-01
