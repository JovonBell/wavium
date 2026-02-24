# Phase 2: Core UI Components - Research

**Researched:** 2026-02-24
**Domain:** React Native glass UI components, gradient buttons, micro-interactions, Android blur fallback
**Confidence:** HIGH

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SURF-01 | GlassmorphicCard 3-layer depth (BlurView + rgba tint + top-edge highlight) | Current card has BlurView + overlay but no top-edge highlight gradient. Add LinearGradient from expo-linear-gradient as third layer. |
| SURF-02 | Cards use glow shadows (ambient purple/gold glow) instead of drop shadows | Currently uses `shadowColor: colors.primary` only when `borderGlow=true`. Change to always apply ambient glow using theme's `surfaceGlow` or `primaryGradient[0]`. |
| SURF-03 | Consistent corner radius: 20px cards, 12px chips, pill CTAs | Current: cards `borderRadius.lg` (12px), chips `borderRadius.full` (9999px). Update borderRadius tokens and component usage. |
| SURF-04 | Android blur fallback for pre-API-31 | BlurView from expo-blur needs `experimentalBlurMethod="dimezisBlurView"` on Android. Pre-API-31 fallback: semi-transparent View with background color. |
| SURF-05 | Max 2-3 BlurViews per screen | GlassmorphicCard + TabBar = 2 BlurViews on most screens. StreakCard should NOT use BlurView. This constraint is already close to being met. |
| INTR-01 | Primary CTA buttons gold gradient fill + breathing glow | HapticButton primary variant uses flat `colors.primary`. Replace with LinearGradient wrapper + withRepeat shadow pulse. |
| INTR-02 | CTA gradient borders that pulse | Secondary variant has flat `borderColor: colors.primary`. Replace with gradient border technique (inner content + gradient background with padding). |
| INTR-03 | 44px min touch targets, scale 0.96 press + spring release | Current scale: 0.95. Already animated with spring. Update to 0.96 and verify 44px min height. |
| INTR-04 | Haptic feedback on all primary actions | Already implemented in HapticButton. Verify all screen CTAs use HapticButton. |
| INTR-05 | 4px grid spacing applied app-wide | Already exists in spacing.ts with 4px BASE. Verify all components use tokens not hardcoded values. |
| PERF-03 | No blur intensity animation | Current GlassmorphicCard uses static `intensity={20}`. Correct. Ensure no future animation of blur intensity. |

## Current Component Analysis

### GlassmorphicCard.tsx
- **Layers:** 2 — BlurView + surfaceGlow overlay
- **Missing:** Top-edge highlight gradient (Layer 3)
- **Border:** Uses `colors.primary + '40'` when borderGlow, `colors.textMuted + '20'` otherwise
- **Shadow:** Only applied when `borderGlow=true`
- **Corner radius:** `borderRadius.lg` = 12px (should be 20px per SURF-03)
- **Android:** No explicit blur fallback

### HapticButton.tsx
- **Primary style:** Flat backgroundColor `colors.primary`
- **Missing:** Gold gradient fill, breathing glow animation
- **Scale:** 0.95 (should be 0.96 per INTR-03)
- **Touch target:** Not explicitly enforced, relies on padding
- **Haptics:** Fully implemented with Light/Medium/Heavy options

### StreakCard.tsx
- **Surface:** Uses `colors.surface` background (no blur - good for SURF-05)
- **Corner radius:** `borderRadius.lg` = 12px (should be 20px per SURF-03 cards)

### TabBar.tsx
- **BlurView:** Uses intensity=30 (one of the 2-3 allowed per screen)
- **Corner radius:** `borderRadius.xl` = 16px (close but not 20px)

### Spacing System
- Already 4px BASE with xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48
- Missing 12px step — add as `spacing.smd` or adjust usage

## Architecture Decisions

1. **Android blur fallback:** Use `Platform.OS === 'android' && Platform.Version < 31` to detect. Render semi-transparent View with `colors.glassOverlay` at higher opacity instead of BlurView.
2. **Top-edge highlight:** Use `expo-linear-gradient` LinearGradient positioned absolutely at top of card, height ~1px, colors from transparent to `glassBorder` and back.
3. **Button gradient fill:** Wrap button content in LinearGradient from expo-linear-gradient. For primary variant, use `colors.primaryGradient`.
4. **Breathing glow:** Use `withRepeat(withTiming(...))` on shadow opacity (not blur intensity per PERF-03). Animate shadowOpacity between 0.2 and 0.5.
5. **Corner radius update:** Change `borderRadius.lg` from 12 to 16, add `borderRadius.xl` as 20. Or add a new `cardRadius = 20` constant.

## Plan Structure

### Wave 1 (parallel):
- **02-01:** GlassmorphicCard 3-layer refactor (SURF-01, SURF-02, SURF-04, SURF-05, PERF-03)
- **02-02:** HapticButton gradient CTA + micro-interactions (INTR-01, INTR-02, INTR-03, INTR-04)

### Wave 2 (depends on Wave 1):
- **02-03:** Corner radius + spacing consistency pass (SURF-03, INTR-05)
