# Wavium Aesthetic Overhaul

## What This Is

A comprehensive UI/UX overhaul of Wavium, an AI-powered subliminal audio app with a companion character called Mindi. The app is functionally complete — audio pipeline, screens, navigation all work — but the visual execution doesn't match the vision. Currently rates 5/10 aesthetically: it reads as a competent dark-mode app with a cosmic skin rather than the sacred, immersive portal it's meant to be.

## Core Value

**Every screen should feel like entering a portal where reality dissolves.** If the app looks like a utility with a dark theme, it fails — regardless of how well the audio works. The aesthetic IS the product for a mindfulness/subliminal app.

## Requirements

### Validated

*Existing capabilities (functional, not being changed):*

- ✓ Audio generation pipeline (intention → Groq AI → affirmations → edge-tts → FFmpeg mix)
- ✓ React Native Expo 54 app with Expo Router navigation
- ✓ FastAPI backend with audio serving
- ✓ Zustand + Jotai state management
- ✓ All screens: Home, Create, Affirmations, Sound Picker, THE VOID Player, Script
- ✓ Mindi character (Skia renderer, eyes, glow, particles, speech)
- ✓ Theme system with time-of-day colors
- ✓ Haptic feedback, star field, parallax layers
- ✓ Daily streak system with tier badges
- ✓ Two-stream audio architecture (voice + background)
- ✓ 5 ambient tracks (ocean, rain, binaural, cosmic, lofi)

### Active

- [ ] Typography system with display font for dramatic hierarchy
- [ ] Gold gradient palette replacing flat orange
- [ ] Real glassmorphism (backdrop blur + layered depth)
- [ ] Refined purple depth spectrum (near-black to rich violet)
- [ ] Breathing/glowing CTA buttons with gradient borders
- [ ] Cards with blur, inner glow, and layered shadows
- [ ] THE VOID auto-hide controls (tap to reveal)
- [ ] Mindi glow pulse synced to audio playback
- [ ] Affirmation ceremony (one-by-one reveal animation)
- [ ] Current affirmation highlight during playback
- [ ] Sound picker mood preview (background shifts per sound)
- [ ] Mindi idle breathing animation
- [ ] Mindi eye movement/tracking
- [ ] Mindi entrance animations per screen
- [ ] Consistent spacing system (intentional breathing room)
- [ ] Micro-interactions on all touch targets
- [ ] Minimal/elegant progress bar in player

### Out of Scope

- Backend changes — this is frontend-only
- New features or screens — only improving existing ones
- Mindi full evolution system (10 paths, 5 stages) — too large, separate effort
- Constellation star map library — not built yet, separate effort
- Onboarding ceremony redesign — keep current flow, just polish visuals
- Audio pipeline changes — already works well

## Context

- **Stack:** React Native 0.81, Expo 54, @shopify/react-native-skia, react-native-reanimated, expo-av, expo-haptics, expo-sensors
- **Key files:** Theme in `wavium/src/theme/`, components in `wavium/src/components/`, stores in `wavium/src/stores/`, screens in `wavium/app/`
- **Mindi:** Rendered with Skia (MindiRenderer, MindiEyes, MindiGlow, MindiParticles, MindiSpeech)
- **THE VOID:** VoidContainer with NebulaRenderer, StarField, ParallaxLayer, PlayerControls, AffirmationSpirals
- **UI components:** GlassmorphicCard, GlowText, HapticButton, LoadingOverlay, StreakCard, TabBar, TimeShiftingBackground
- **Performance target:** 60fps animations, no jank on mid-range devices

## Constraints

- **Stack**: Must use existing dependencies — no new heavy libraries
- **Platform**: Must work on both iOS and Android
- **Performance**: 60fps animations, no regression from current state
- **Scope**: Frontend only (`wavium/` directory)
- **Fonts**: Expo supports custom fonts via expo-font (already in Expo SDK)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Gold gradients over flat orange | Flat orange reads as SaaS/utility, gold reads as premium/sacred | — Pending |
| Display font for headings | System font lacks drama for a mindfulness app | — Pending |
| Auto-hide player controls | Full immersion is the core experience promise | — Pending |
| One-by-one affirmation reveal | Numbered list feels like a receipt, ceremony feels like a gift | — Pending |

---
*Last updated: 2026-02-24 after initialization*
