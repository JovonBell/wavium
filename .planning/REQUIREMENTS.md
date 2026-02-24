# Requirements: Wavium Aesthetic Overhaul

**Defined:** 2026-02-24
**Core Value:** Every screen should feel like entering a portal where reality dissolves — the aesthetic IS the product for a mindfulness/subliminal app.

## v1 Requirements

Requirements for aesthetic overhaul release. Each maps to roadmap phases.

### Typography

- [ ] **TYPO-01**: App uses Cinzel display font for screen titles and hero text (THE VOID, section headers)
- [ ] **TYPO-02**: App uses Cormorant Garamond for affirmation text and editorial content (20px+)
- [ ] **TYPO-03**: App uses Raleway for body text, UI labels, and navigation elements
- [ ] **TYPO-04**: Typographic scale systemized with 4 sizes: display (~32px), heading (~22px), body (~15px), label (~12px)
- [ ] **TYPO-05**: Off-white text hierarchy applied globally — body rgba(255,255,255,0.82), captions 0.55, hero #FFFFFF
- [ ] **TYPO-06**: Font loading uses expo-font config plugin (build-time embedding, zero font flash on cold start)

### Color System

- [ ] **COLR-01**: Gold gradient palette (#F7C873 → #D4A017 → #A0720C) replaces flat orange on all primary accents
- [ ] **COLR-02**: Near-black background with purple tint (#0A0A12 range) replaces current background
- [ ] **COLR-03**: Purple depth spectrum refined with richer gradient stops across all 4 time-of-day themes
- [ ] **COLR-04**: ThemeColors interface extended with `primaryGradient`, `glassOverlay`, `glassBorder` tokens
- [ ] **COLR-05**: All 4 time-of-day themes (morning/afternoon/evening/night) updated with gradient token values
- [ ] **COLR-06**: Hardcoded hex colors in Skia components (NebulaRenderer, TimeShiftingBackground) replaced with theme tokens

### Surface & Depth

- [ ] **SURF-01**: GlassmorphicCard refactored with three-layer depth (BlurView + rgba tint + top-edge highlight gradient)
- [ ] **SURF-02**: Cards use glow shadows (ambient purple/gold glow) instead of drop shadows
- [ ] **SURF-03**: Consistent corner radius system applied — 20px cards, 12px chips, pill-shaped CTAs
- [ ] **SURF-04**: Android blur fallback strategy implemented (semi-transparent overlay for pre-API-31 devices)
- [ ] **SURF-05**: Maximum 2-3 concurrent BlurViews per screen enforced for Android performance

### Buttons & Interactions

- [ ] **INTR-01**: Primary CTA buttons use gold gradient fill with breathing glow animation
- [ ] **INTR-02**: CTA buttons have gradient borders that pulse subtly
- [ ] **INTR-03**: All touch targets meet 44px minimum and have scale 0.96 press + spring release micro-interaction
- [ ] **INTR-04**: Haptic feedback applied consistently on all primary actions (already available via expo-haptics)
- [ ] **INTR-05**: Consistent spacing system with 4px grid base (8, 12, 16, 24, 32, 48px rhythm) applied app-wide

### Mindi Animation

- [ ] **MIND-01**: Mindi idle breathing animation — slow scale pulse (1.0 → 1.02, 4s loop) when not in active playback
- [ ] **MIND-02**: Mindi glow pulse synced to audio playback via SharedValue (not React state)
- [ ] **MIND-03**: Mindi eye movement/tracking that reacts to touch position on screen
- [ ] **MIND-04**: Mindi entrance animations per screen (translate + scale via Skia `matrix` prop)
- [ ] **MIND-05**: VoidContainer `audioLevel` refactored from useState to useSharedValue (zero re-renders for audio reactivity)
- [ ] **MIND-06**: `useLoop` hook created for all withRepeat animations with proper cancelAnimation cleanup

### THE VOID Player

- [ ] **VOID-01**: Auto-hide player controls after 3-4 seconds idle, tap anywhere to reveal
- [ ] **VOID-02**: Affirmation ceremony — one-by-one reveal with staggered fade/translate animation (not numbered list)
- [ ] **VOID-03**: Current affirmation highlighted during playback (glow pulse, others dimmed to 40%)
- [ ] **VOID-04**: Minimal progress bar — 2px height, gradient gold fill, subtle glow, no percentage text
- [ ] **VOID-05**: ProgressRing replaced with Skia arc path (GPU-rendered, SharedValue-driven)
- [ ] **VOID-06**: Sound picker mood preview — screen background shifts color temperature per selected sound

### Screen Polish

- [ ] **SCRN-01**: Entrance animations on all major screens (staggered Reanimated entering, 200-400ms per element group)
- [ ] **SCRN-02**: Home screen spacing and typography hierarchy applied with new components
- [ ] **SCRN-03**: Tab bar refactored to floating glass pill style
- [ ] **SCRN-04**: StatusBar hidden during player experience, visible during navigation screens
- [ ] **SCRN-05**: Loading states use aesthetic placeholders (pulsing glow, shimmer) — no default ActivityIndicator

### Performance

- [ ] **PERF-01**: All animations maintain 60fps on mid-range Android devices
- [ ] **PERF-02**: Skia interpolateColors used (not Reanimated interpolateColor) for all Skia color animations
- [ ] **PERF-03**: No blur intensity animation — container opacity animated instead for blur reveal effects

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Visual Effects

- **VFX-01**: Audio-reactive particle density — particle count reacts to audio intensity
- **VFX-02**: Grain/noise texture overlay at 3-6% opacity over backgrounds
- **VFX-03**: Shared element transitions between screens (Reanimated 4 SharedTransition — experimental)

### Mindi Evolution

- **MIND-07**: Mindi full evolution system (10 paths, 5 stages)
- **MIND-08**: Mindi constellation star map library

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Backend changes | Frontend-only overhaul — audio pipeline and API are working |
| New screens or features | Only improving existing screens' aesthetics |
| Onboarding ceremony redesign | Keep current flow, just polish visuals |
| Audio pipeline changes | Already works well, no aesthetic component |
| Mindi evolution system | Too large, separate effort/milestone |
| Constellation library | Not built yet, separate effort |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| *(populated by roadmapper)* | | |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 33

---
*Requirements defined: 2026-02-24*
*Last updated: 2026-02-24 after auto-mode definition*
