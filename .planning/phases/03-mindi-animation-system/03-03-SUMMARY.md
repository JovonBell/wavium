---
phase: "03"
plan: "03"
subsystem: mindi-animation
tags: [eye-tracking, entrance-animation, touch, shared-values, skia]
dependency-graph:
  requires: [03-01, 03-02]
  provides: [eye-touch-tracking, entrance-animations]
  affects: [MindiEyes, MindiRenderer]
tech-stack:
  added: []
  patterns: [useDerivedValue-for-skia-props, onResponderMove-touch-tracking, entrance-animation-pattern]
key-files:
  created: []
  modified:
    - wavium/src/components/mindi/MindiEyes.tsx
    - wavium/src/components/mindi/MindiRenderer.tsx
decisions:
  - "Touch pupil offset uses 0.015 multiplier with 0.5x/0.4x radius clamp for natural eye movement"
  - "Entrance wraps all layers (particles, glow, body) in single Animated.View for unified appearance"
  - "onResponderMove used instead of gesture handler for lightweight touch tracking"
metrics:
  duration: "102s"
  completed: "2026-02-24"
---

# Phase 3 Plan 3: Eye Tracking + Entrance Animations Summary

Touch-based eye tracking via useDerivedValue offsets on Skia Circle props, plus fadeScale entrance animation wrapping all Mindi layers.

## Task Summary

| Task | Description | Commit | Key Changes |
|------|------------|--------|-------------|
| 1 | Eye touch tracking (MIND-03) | 29f8c90, 305f082 | Added touchX/touchY SharedValue props to MindiEyes; derived pupil+highlight offsets; touch handler in MindiRenderer |
| 2 | Entrance animations (MIND-04) | 305f082 | Added entrance prop with fadeScale default; opacity timing + spring translateY/scale on mount |

## Implementation Details

### Eye Touch Tracking

- `MindiEyes` accepts optional `touchX`/`touchY` SharedValue props
- `useDerivedValue` computes pupil offset: touch delta from center multiplied by 0.015, clamped to max radius
- Horizontal clamp: `pupilRadius * 0.5`, vertical clamp: `pupilRadius * 0.4` (slightly tighter vertical range)
- Both pupil and highlight (reflection dot) circles use derived cx/cy values
- Existing state-driven `pupilX`/`pupilY` values are additive with touch offset
- `MindiRenderer` creates `touchX`/`touchY` SharedValues and updates them via `onResponderMove`

### Entrance Animations

- New `entrance` prop on MindiRenderer: `'fadeScale' | 'none'`, defaults to `'fadeScale'`
- fadeScale entrance: opacity 0->1 (600ms timing), translateY 30->0 (gentle spring), scale 0.5->1 (bouncy spring)
- Entrance Animated.View wraps all layers (particles, glow, body) so everything appears together
- SharedValues initialized to pre-animation state to avoid flash of content

## Deviations from Plan

None - plan executed exactly as written.

## Acceptance Criteria

- [x] Eyes track touch/finger position on screen (MIND-03)
- [x] Mindi animates into view with translate + scale entrance on each screen (MIND-04)
