# Roadmap: Wavium Aesthetic Overhaul

## Overview

Five sequential phases transform Wavium from a competent dark-mode app into a sacred, immersive portal. The sequence is strictly dependency-ordered: design tokens and typography must exist before any component can consume them; core UI components must be final before screens adopt them; the Mindi animation architecture must be refactored before audio-reactive visuals can be safely added; THE VOID player polish depends on the Skia patterns established in the Mindi phase; screen-level application comes last and is purely additive.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Token Foundation** - Establish the design token system and typography that every subsequent phase depends on (completed 2026-02-24)
- [ ] **Phase 2: Core UI Components** - Refactor shared components (glass cards, buttons, surfaces) to deliver the premium aesthetic
- [ ] **Phase 3: Mindi Animation System** - Refactor audio reactivity architecture and implement all Mindi animations
- [ ] **Phase 4: THE VOID Player** - Polish the immersive player experience (affirmation ceremony, progress bar, auto-hide controls)
- [ ] **Phase 5: Screen Polish** - Apply the completed component system to all screens with entrance animations and micro-interactions

## Phase Details

### Phase 1: Token Foundation
**Goal**: The design token system and typography are established so every component in every subsequent phase draws from a single source of truth
**Depends on**: Nothing (first phase)
**Requirements**: TYPO-01, TYPO-02, TYPO-03, TYPO-04, TYPO-05, TYPO-06, COLR-01, COLR-02, COLR-03, COLR-04, COLR-05, COLR-06
**Success Criteria** (what must be TRUE):
  1. App opens with Cinzel, Cormorant Garamond, and Raleway fonts rendered — no system-font flash on cold start
  2. All four time-of-day themes (morning, afternoon, evening, night) render gold gradients instead of flat orange on primary elements
  3. The near-black purple-tinted background (#0A0A12 range) is visible on all screens — no pure black or grey backgrounds remain
  4. Text hierarchy is visible — hero text, body, and captions are clearly differentiated by font, size, and opacity
  5. ThemeColors interface includes primaryGradient, glassOverlay, and glassBorder tokens accessible to all components
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Color token system: extend ThemeColors interface + all 4 theme objects with gradient tokens (Wave 1)
- [ ] 01-02-PLAN.md — Typography system: install fonts, register expo-font config plugin, fontFamilies + textStyles (Wave 1)
- [ ] 01-03-PLAN.md — Skia token cleanup: refactor NebulaRenderer and TimeShiftingBackground to consume theme tokens (Wave 2)

### Phase 2: Core UI Components
**Goal**: Shared UI components deliver real glassmorphism, gold gradient interactions, and a consistent spatial system so all screens automatically inherit the premium aesthetic
**Depends on**: Phase 1
**Requirements**: SURF-01, SURF-02, SURF-03, SURF-04, SURF-05, INTR-01, INTR-02, INTR-03, INTR-04, INTR-05, PERF-03
**Success Criteria** (what must be TRUE):
  1. Cards show three-layer glass depth (blur layer + tint + top-edge highlight) — visible as distinct depth from the background
  2. Primary CTA buttons animate with a breathing gold glow — the pulse is visible at rest without any interaction
  3. Every touch target responds with a scale-down-and-spring-back micro-interaction when tapped
  4. Cards and chips use the consistent corner radius system (20px cards, 12px chips) with no deviations
  5. On an Android device, glassmorphism cards render without performance drop — blur fallback activates cleanly on pre-API-31 devices
**Plans**: TBD

### Phase 3: Mindi Animation System
**Goal**: Mindi is alive — she breathes at idle, glows in sync with audio playback, tracks touch on screen, and arrives with presence on each screen, all without causing React re-renders
**Depends on**: Phase 2
**Requirements**: MIND-01, MIND-02, MIND-03, MIND-04, MIND-05, MIND-06, PERF-02
**Success Criteria** (what must be TRUE):
  1. Mindi visibly breathes (slow scale pulse) when audio is not playing
  2. Mindi's glow intensifies and pulses in sync with audio during playback — the connection between sound and visual is perceptible
  3. Mindi's eyes track touch position as the user moves a finger across the screen
  4. Mindi animates into view distinctly on each screen transition (translate + scale entrance)
  5. VoidContainer does not trigger React re-renders during audio playback — audioLevel is a SharedValue, not React state
**Plans**: TBD

### Phase 4: THE VOID Player
**Goal**: The player experience is fully immersive — controls disappear by default, affirmations reveal as a ceremony, and every visual element is GPU-rendered and SharedValue-driven
**Depends on**: Phase 3
**Requirements**: VOID-01, VOID-02, VOID-03, VOID-04, VOID-05, VOID-06
**Success Criteria** (what must be TRUE):
  1. Player controls fade out automatically after 3-4 seconds of idle; a single tap anywhere reveals them
  2. Affirmations appear one-by-one with staggered animation — the current affirmation glows while others dim to near-invisible
  3. The progress bar is minimal (approximately 2px tall) with a gold gradient fill and subtle glow — no percentage label
  4. Selecting a different sound causes the background color temperature to visibly shift to match that sound's mood
  5. The circular progress indicator is rendered as a Skia arc path with smooth GPU-driven animation (no CSS border trick)
**Plans**: TBD

### Phase 5: Screen Polish
**Goal**: Every screen feels like a portal — entrance animations, consistent spacing, the glass tab bar, and immersive StatusBar behavior are applied across the full app
**Depends on**: Phase 4
**Requirements**: SCRN-01, SCRN-02, SCRN-03, SCRN-04, SCRN-05, PERF-01
**Success Criteria** (what must be TRUE):
  1. Navigating to any major screen triggers a staggered entrance — elements build in sequentially, not all at once
  2. The tab bar appears as a floating glass pill — clearly lifted off the screen with blur and rounded ends
  3. The StatusBar is hidden during THE VOID player experience and visible during navigation screens
  4. Loading states show pulsing glow or shimmer placeholders — no default ActivityIndicator spinner appears anywhere
  5. All animations maintain 60fps on a mid-range Android device — no visible jank or frame drops during any transition or idle animation
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Token Foundation | 3/3 | Complete   | 2026-02-24 |
| 2. Core UI Components | 0/TBD | Not started | - |
| 3. Mindi Animation System | 0/TBD | Not started | - |
| 4. THE VOID Player | 0/TBD | Not started | - |
| 5. Screen Polish | 0/TBD | Not started | - |
