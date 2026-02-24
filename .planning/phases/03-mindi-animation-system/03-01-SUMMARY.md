---
phase: 03-mindi-animation-system
plan: 01
subsystem: ui
tags: [react-native-reanimated, shared-value, animation, skia, hooks]

# Dependency graph
requires:
  - phase: 02-core-ui-components
    provides: VoidContainer, MindiRenderer, child component structure
provides:
  - useLoop hook for safe repeating animations with cleanup
  - SharedValue<number> audioLevel replacing useState re-renders
  - useDerivedValue pattern for Skia animated props
affects: [03-mindi-animation-system, 04-progress-ring]

# Tech tracking
tech-stack:
  added: []
  patterns: [useLoop hook for withRepeat+cancelAnimation, SharedValue prop threading, useDerivedValue for Skia props]

key-files:
  created:
    - wavium/src/hooks/useLoop.ts
  modified:
    - wavium/src/components/void/VoidContainer.tsx
    - wavium/src/components/mindi/MindiRenderer.tsx
    - wavium/src/components/mindi/MindiGlow.tsx
    - wavium/src/components/void/StarField.tsx
    - wavium/src/components/void/NebulaRenderer.tsx
    - wavium/src/components/void/AffirmationSpirals.tsx

key-decisions:
  - "GlowCircle sub-component for per-layer useDerivedValue in MindiGlow -- hooks cannot be called in .map() loops"
  - "NebulaCloud receives SharedValue and computes derived radius/opacity internally -- keeps Skia props reactive without render cycles"

patterns-established:
  - "SharedValue prop threading: parent writes .value on JS thread, children read in worklets/useDerivedValue"
  - "useDerivedValue for Skia animated props: Skia components consume SharedValue directly"
  - "useLoop hook: canonical pattern for withRepeat + cancelAnimation cleanup"

requirements-completed: [MIND-05, MIND-06]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 3 Plan 01: useLoop Hook + audioLevel SharedValue Refactor Summary

**useLoop hook for safe repeating animations, and audioLevel refactored from useState to useSharedValue across 6 components to eliminate re-renders during audio playback**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T18:41:49Z
- **Completed:** 2026-02-24T18:45:02Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Created reusable useLoop hook wrapping withRepeat/withTiming with cancelAnimation cleanup
- Converted VoidContainer audioLevel from useState(0) to useSharedValue(0), eliminating ~10 re-renders/sec during playback
- Updated all 5 child components (MindiRenderer, MindiGlow, StarField, NebulaRenderer, AffirmationSpirals) to accept SharedValue<number>
- Introduced useDerivedValue pattern for Skia Circle opacity/radius props in MindiGlow and NebulaRenderer

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useLoop hook** - `3ffd767` (feat)
2. **Task 2: Refactor VoidContainer audioLevel** - `fd52de5` (feat)
3. **Task 3: Update child components to accept SharedValue** - `affb260` (feat)

## Files Created/Modified
- `wavium/src/hooks/useLoop.ts` - Reusable loop animation hook with cleanup
- `wavium/src/components/void/VoidContainer.tsx` - audioLevel changed from useState to useSharedValue
- `wavium/src/components/mindi/MindiRenderer.tsx` - SharedValue<number> prop type, .value read in worklet
- `wavium/src/components/mindi/MindiGlow.tsx` - GlowCircle sub-component with useDerivedValue for Skia opacity
- `wavium/src/components/void/StarField.tsx` - SharedValue<number> prop type, .value read in TwinklingStar worklet
- `wavium/src/components/void/NebulaRenderer.tsx` - NebulaCloud with useDerivedValue for radius/opacity Skia props
- `wavium/src/components/void/AffirmationSpirals.tsx` - SharedValue<number> prop type, .value read in SpiralText worklet

## Decisions Made
- Created GlowCircle sub-component in MindiGlow to call useDerivedValue per-layer (React hooks cannot be called inside .map() loops)
- NebulaCloud refactored to receive SharedValue directly and compute derived Skia props internally, keeping cloud radius/opacity reactive without causing React re-renders

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SharedValue audioLevel pipeline is complete -- all Void components read audioLevel on UI thread
- useLoop hook available for 03-02 (Mindi state machine animations) and 03-03 (performance optimizations)
- useDerivedValue pattern established for any future Skia animated props

---
*Phase: 03-mindi-animation-system*
*Completed: 2026-02-24*
