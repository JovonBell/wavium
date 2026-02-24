# Project Research Summary

**Project:** Wavium — Premium UI/UX Aesthetic Overhaul
**Domain:** React Native Expo premium visual design (mindfulness/subliminal audio app)
**Researched:** 2026-02-24
**Confidence:** HIGH

## Executive Summary

Wavium is a functionally complete React Native Expo 54 app undergoing a premium aesthetic overhaul — not a greenfield build. The existing codebase already has the right native libraries installed (Skia 2.2.12, Reanimated 4.1.1, expo-blur, expo-linear-gradient, expo-haptics), which means the overhaul is almost entirely a UI layer concern: design tokens, typography, component refinement, and animation architecture. The only new installs required are three Google Fonts packages for the display typography system (Cinzel, Cormorant Garamond, Raleway). The strategic posture is "refactor and extend, not replace" — most existing components have the right structure but wrong execution.

The recommended approach is a five-phase sequential build with hard dependencies flowing downward. The design token system and font loading must be established first because every other component depends on them. Surface-level UI components (GlassmorphicCard, HapticButton, GlowText) come second and unlock screen-level work. The Mindi animation system and THE VOID player polish come third and fourth respectively — both require the token foundation and a specific architectural refactor (changing `audioLevel` from React state to a Reanimated `useSharedValue`) before any audio-reactive visual work can proceed correctly. Screen-level aesthetic application comes last, picking up the polished components automatically.

The primary risks are performance-related and platform-specific. Android blur (expo-blur) is the single most dangerous area: it requires explicit `experimentalBlurMethod` prop setting, strict limits on concurrent BlurView count (max 2-3 per screen), and a graceful fallback strategy for pre-Android-12 devices. A second critical risk is the `audioLevel` React state pattern currently in VoidContainer — it triggers 10+ React re-renders per second during playback and will cause jank as soon as more visual reactions are layered on. This must be refactored to a SharedValue before any audio-sync animation work begins. A third systemic risk is missing cleanup for Reanimated `withRepeat` animations, which causes memory leaks and ghost animations across screen navigations.

---

## Key Findings

### Recommended Stack

The installed dependency set is essentially perfect for this overhaul — no new heavy native libraries are needed. Skia handles all GPU-rendered effects (gradients, glow halos, particle systems, nebula), Reanimated 4 handles all animation drivers on the UI thread, expo-blur handles glassmorphism on native views (which Skia cannot do), and expo-linear-gradient handles static gradient fills. The only missing piece is typography: three Google Fonts packages unlock the premium typeface hierarchy that competitors like Calm, Headspace, and Endel use to signal brand investment.

**Core technologies:**
- `@shopify/react-native-skia` (2.2.12, installed): GPU-rendered canvas effects — Mindi character, nebula, glow halos, animated gradients. Accepts Reanimated shared values as direct props with no bridge overhead. Use `interpolateColors` from Skia (not Reanimated) for color animation.
- `react-native-reanimated` (4.1.1, installed): All animation drivers — breathing buttons, entrance animations, auto-hide controls, affirmation reveals. Runs on UI thread via worklets at up to 120fps. The engine for every animation in this overhaul.
- `expo-blur` (15.0.8, installed): Glassmorphism on cards and overlays. Solid on iOS; requires `experimentalBlurMethod="dimezisBlurView"` on Android and a fallback for pre-API-31 devices.
- `expo-linear-gradient` (15.0.8, installed): Static gradient fills — backgrounds, gold CTA buttons, inner card highlights. Never animate its `colors` prop (Android bug); use Skia for animated gradients.
- `@expo-google-fonts/cinzel` (new): Display font — screen titles, "THE VOID" hero text. Roman inscription gravitas, ceremonial feel.
- `@expo-google-fonts/cormorant-garamond` (new): Editorial serif — affirmation text, subtitles. Literary, luxury, reads as "written" not "displayed."
- `@expo-google-fonts/raleway` (new): Geometric sans-serif — body text, UI labels, navigation. Pairs naturally with display fonts and remains readable at 12px.

**Critical version note:** Use `expo-font` config plugin (not `useFonts()` runtime hook) — fonts embed at build time, zero async loading race, no font flash on cold start.

### Expected Features

Research across Calm, Headspace, Endel, and Portal identifies clear tiers of what premium immersive apps provide.

**Must have (table stakes) — absence reads as amateur:**
- Custom display font applied globally — system fonts immediately signal no design investment
- Near-black tinted background (#0A0A12 range with purple tint) — pure black makes color elements look pasted-on
- Off-white graduated text hierarchy — pure white (#FFF) body text reads as "development mode"
- Consistent typographic scale — four sizes, two weights, deliberate line-height
- Gold gradient palette replacing flat orange — gradient CTAs signal craftsmanship
- Real glassmorphism on cards — backdrop blur + rgba tint + semi-transparent border
- Glow shadows (not drop shadows) — dark UI illuminates from within, not from above
- 60fps animation everywhere — jank is the single fastest way to destroy premium perception
- Consistent corner radius system — pick two values (20px cards, 12px chips) and never deviate
- Haptic feedback on all primary actions — already available via expo-haptics, must be applied consistently
- Auto-hide player controls with tap-to-reveal — the "empty screen" state must look intentional

**Should have (competitive differentiators):**
- Audio-synced Mindi glow pulse — the sensation the app is alive and responsive to sound
- One-by-one affirmation ceremony reveal — reading becomes meditative, not list-scanning
- Entrance animations per screen — staggered build communicates intentionality
- Mindi idle breathing animation — ambient life between interactions creates emotional attachment
- Sound picker mood preview — background hue shifts per sound selection
- Minimal gradient progress bar — thin glowing line, no percentage text
- Micro-interactions on all touch targets — scale 0.96 on press, spring release

**Defer to v2+:**
- Audio-reactive particle density — performance risk on Android mid-range devices
- Grain texture overlay — requires careful testing across device densities (can read as rendering bug)
- Shared element transitions — Reanimated 4 SharedTransition still experimental

### Architecture Approach

The architecture is a layered system with strict one-way data flow: raw design tokens in `theme/` flow into the Zustand ThemeStore, which exposes the resolved `colors` object to all components via hook. Audio state lives in VoidContainer as a Reanimated `useSharedValue` (after the critical refactor from `useState`), flowing down to Skia components as direct props — no bridge, no re-renders. Mindi sub-components are GPU-isolated: single merged Skia canvas (not three separate canvases), accepting only SharedValue props for animation reactivity.

**Major components:**
1. **Theme System** (`src/theme/`) — pure constants: color scales per TimeOfDay, typography scale, spacing, animation configs. Must be extended with `primaryGradient`, `glassOverlay`, `glassBorder` token groups before any component work.
2. **GlassmorphicCard** — three-layer stack: expo-blur (native glass), rgba tint (color-aware surface), LinearGradient top highlight (edge light). Requires `overflow: 'hidden'` wrapper for borderRadius on Android.
3. **MindiRenderer + MindiGlow** — merged into single Skia canvas. Accepts `audioLevel` as `SharedValue<number>`. Uses `useDerivedValue` to combine idle breath phase + audio boost into final glow radius and scale. Never re-renders.
4. **VoidContainer** — owns audio playback state. `isPlaying` stays React state (triggers legitimate UI changes). `audioLevel` becomes `useSharedValue` (drives Skia reactivity without re-renders). Passes SharedValue down to Mindi, Nebula, and Affirmation components.
5. **AffirmationSpirals** — refactored from "all affirmations floating simultaneously" to sequential one-by-one ceremony reveal driven by `currentIndex` React state (correct use of React state — triggers text change, not per-frame animation).

### Critical Pitfalls

1. **Android blur performance** — expo-blur on Android below API 31 emulates blur at 3-5x the GPU cost of iOS. Mitigation: max 2-3 concurrent BlurViews per screen, `experimentalBlurMethod="dimezisBlurView"`, semi-transparent rgba fallback for pre-API-31. Test on physical mid-range Android before any glassmorphism is "done."

2. **`audioLevel` as React state in THE VOID** — the current codebase updates `audioLevel` via `setInterval` + `setState` at ~10Hz, causing React reconciliation of the entire VoidContainer tree 10 times per second. This must be refactored to `useSharedValue` before audio-reactive animations are added — otherwise every new visual reaction compounds the problem.

3. **Reanimated `withRepeat` without `cancelAnimation` cleanup** — infinite animation loops continue running after component unmount, causing rising CPU/memory across navigation. Fix: create a `useLoop` hook that encapsulates the pattern with cleanup. Establish this in Phase 3 and use it consistently throughout.

4. **`interpolateColor` from Reanimated passed to Skia props** — Reanimated and Skia use different internal color storage formats. Result: wrong colors or black renders. Fix: always use `interpolateColors` from `@shopify/react-native-skia` for any color animation that feeds a Skia component prop.

5. **expo-font flash of invisible text** — if `SplashScreen.preventAutoHideAsync()` isn't called at module level and font loading isn't guarded, cold-start produces a system-font flash. Fix: use the `expo-font` config plugin (not `useFonts()` runtime hook) so fonts are bundled pre-JS-start and the flash is architecturally impossible.

---

## Implications for Roadmap

Based on the dependency graph that emerges from combined research, a five-phase sequential structure is the correct approach. There is very little that can be parallelized safely because each phase is a prerequisite for the next.

### Phase 1: Token Foundation and Typography

**Rationale:** Every component in every subsequent phase pulls color values, gradient stops, and font family references from the theme system. Building components before tokens exist means hardcoded values spread across the codebase, defeating the goal of a coherent system. Font loading must be resolved before any screen is built — the font flash pitfall is architectural, not cosmetic.

**Delivers:** Extended `ThemeColors` interface with `primaryGradient`, `glassOverlay`, `glassBorder` tokens across all 4 time-of-day themes; `goldScale` color constants; `typography.ts` updated with `fontFamilies.display`, `displayHero`, `displayLarge` text styles; expo-font config plugin registration for Cinzel, Cormorant Garamond, Raleway; verified cold-start font behavior.

**Addresses:** Custom display font, typographic scale, near-black tinted background, off-white text hierarchy (all table-stakes features).

**Avoids:** Font flash on startup (Pitfall 4), hardcoded color hex strings in Skia components (Architecture Anti-Pattern 2).

---

### Phase 2: Core UI Component Refinement

**Rationale:** GlassmorphicCard, HapticButton, GlowText, and TimeShiftingBackground are used across all screens. Getting them right before any screen-level work means screens automatically inherit the correct aesthetic. This is the highest-ROI phase for visual impact per line of code changed.

**Delivers:** Refactored GlassmorphicCard with three-layer depth (BlurView + tint + top-edge highlight gradient); gold gradient CTA treatment on HapticButton (LinearGradient border + gradient fill); GlowText display font variant; TimeShiftingBackground using `primaryGradient` token instead of hardcoded hex; Android blur fallback strategy confirmed; BlurView count audited and capped.

**Uses:** expo-blur (three-layer glass pattern), expo-linear-gradient (gradient borders, card highlights), Reanimated (breathing glow on primary CTAs), ThemeStore (all color tokens from Phase 1).

**Implements:** GlassmorphicCard, HapticButton, GlowText, TimeShiftingBackground refactors from ARCHITECTURE.md.

**Avoids:** Android blur performance collapse (Pitfall 1), stacked layer GPU overdraw (Pitfall 3), animating blur intensity directly (Pitfall 2).

---

### Phase 3: Mindi Animation System

**Rationale:** This phase requires Phase 1 tokens and a functional Skia baseline. The critical audioLevel refactor (useState → useSharedValue) must happen as a unit with all downstream Skia component prop type updates — doing it piecemeal creates broken intermediate states where some components receive SharedValue and others receive stale React state. Establish the `useLoop` hook here and enforce it throughout.

**Delivers:** VoidContainer `audioLevel` refactored to `useSharedValue`; MindiGlow + MindiRenderer + MindiEyes merged into single Skia canvas; idle breathing animation (autonomous slow scale loop); audio-reactive glow (breath phase + audioBoost combined via `useDerivedValue`); Mindi eye tracking driven by touch position SharedValue; Mindi entrance animations using Skia `matrix` prop (not `transform`); `useLoop` hook established for all `withRepeat` patterns.

**Uses:** Skia `useDerivedValue`, `interpolateColors` (not Reanimated's), `matrix` prop for transforms, `useSharedValue` for audio reactivity.

**Avoids:** audioLevel as React state (Architecture Anti-Pattern 1), Reanimated/Skia color incompatibility (Pitfall 8), Skia `transform` vs `matrix` issue (Pitfall 9), animation memory leaks (Pitfall 5), JS thread blocking from high-frequency state (Pitfall 6).

---

### Phase 4: THE VOID Player Polish

**Rationale:** Depends on Phase 2 components and Phase 3's audioLevel SharedValue architecture. AffirmationSpirals ceremony reveal uses the correct `currentIndex` React state pattern (legitimate re-render trigger) — but the animation is Reanimated-driven and needs the `useLoop` hook established in Phase 3. ProgressRing replacement is a self-contained Skia refactor that cannot land until the Skia canvas strategy from Phase 3 is established.

**Delivers:** ProgressRing replaced with Skia arc path (GPU-thread, SharedValue-driven); AffirmationSpirals ceremony reveal (one-at-a-time staggered fade/translate, current affirmation highlighted, others dimmed to 40%); PlayerControls minimal progress bar (2px, gradient gold fill, glow effect); auto-hide controls timing tuned (3+ second timeout, verified on physical device); sound picker mood preview (background hue shift per selected track).

**Addresses:** Auto-hide player controls, affirmation ceremony reveal, minimal progress bar, sound picker mood preview (all P1/P2 features from FEATURES.md).

**Avoids:** Visible scrollbars in player, notification-style affirmation cards, cluttered navigation chrome during void experience (all anti-features from FEATURES.md).

---

### Phase 5: Screen-Level Aesthetic Application

**Rationale:** With all components refined and all animation systems correct, applying the aesthetic to individual screens (Home, Tracks, Create) is mostly additive work — swapping in the new component variants and applying the entrance animation pattern. This phase cannot come earlier because components must be final before screens adopt them.

**Delivers:** Home screen spacing/typography hierarchy applied; Tracks screen with GlassmorphicCard treatment; Tab bar refactored to floating glass pill style; all screens with staggered entrance animations (Reanimated `entering` prop, 200-400ms stagger); micro-interactions on all touch targets (scale 0.96 on press, spring release, haptic); StatusBar hidden during player, visible during nav screens.

**Addresses:** Entrance animations per-screen, micro-interactions on touch targets, floating glass tab bar, StatusBar immersive mode (all P2 features from FEATURES.md).

---

### Phase Ordering Rationale

- **Token-first is mandatory**: architecture analysis confirms that NebulaRenderer, TimeShiftingBackground, and GlassmorphicCard all have hardcoded color values that need to flow from tokens. Building any component before tokens exist creates work that must be immediately re-done.
- **Core components before screens**: the component layer is shared infrastructure; screen work built on unfinished components will require rework when components are finalized.
- **Mindi as a unit**: the audioLevel refactor touches VoidContainer, MindiGlow, MindiRenderer, NebulaRenderer, and AffirmationSpirals simultaneously. Splitting this across phases would create a period where the component tree has mixed state/SharedValue props and undefined behavior.
- **VOID polish after Mindi**: AffirmationSpirals and ProgressRing can only be correctly implemented once the Skia canvas strategy and SharedValue patterns from Phase 3 are established.
- **Screens last**: purely additive, no architectural risk, correct behavior guaranteed when components are solid.

### Research Flags

Phases likely needing deeper research or careful spiking during planning:

- **Phase 3 (Mindi Animation System):** The Skia canvas merge (3 canvases → 1) and the `matrix` prop animation pattern for entrance animations are technically nuanced. A small proof-of-concept spike before full implementation is recommended to validate the merged-canvas approach doesn't introduce z-ordering issues.
- **Phase 4 (VOID Polish — ProgressRing):** Replacing the CSS border ring with a Skia arc path requires understanding Skia's `Path` and arc APIs. Research the correct Skia arc-to-path construction for a circular progress indicator before committing to implementation in planning.

Phases with standard, well-documented patterns (skip research-phase):

- **Phase 1 (Token Foundation):** TypeScript interface extension + expo-font config plugin. Both are thoroughly documented with working examples in STACK.md and ARCHITECTURE.md.
- **Phase 2 (Core UI Components):** Three-layer glassmorphism and LinearGradient border patterns are well-established with complete code examples in research. No novel integration needed.
- **Phase 5 (Screen Aesthetic):** Purely compositional — applying known patterns from Phases 1-4 to individual screens. No new technical territory.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core libraries verified against installed package.json and official documentation. Version compatibility confirmed. The only judgment calls (Cinzel vs. Playfair Display) are design decisions, not technical risks. |
| Features | MEDIUM-HIGH | Table stakes and anti-features derived from competitor analysis (Calm, Headspace, Endel, Portal) with curated UI references. Differentiator priority ordering is opinionated but well-reasoned. Subjective value judgments carry medium confidence. |
| Architecture | HIGH | Primary patterns verified against official Skia, Reanimated, and Expo SDK 54 docs. Codebase analyzed directly. The `audioLevel` SharedValue refactor is the most consequential recommendation and is grounded in official Reanimated architecture guidance. |
| Pitfalls | HIGH | Most critical pitfalls traced to official GitHub issues, Expo docs, and Shopify Skia docs. Android blur behavior verified against SDK 54 release notes and Expo discussions. The Skia/Reanimated color incompatibility is explicitly documented in official Skia docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **Android blur quality on physical mid-range device:** Research establishes the risk clearly (3-5x GPU cost, dimezis fallback behavior) but cannot determine exact intensity values and BlurView counts that maintain 60fps on the specific target Android devices without real hardware testing. Establish this empirical baseline in Phase 2 before committing to final blur intensity values.
- **Merged Skia canvas z-ordering:** The recommendation to merge MindiGlow + MindiRenderer + MindiEyes into a single canvas is architecturally correct but the specific Skia `Group` layering to achieve the visual result needs validation. Spike before committing.
- **Mindi audio sync drift over time:** Research flags that Mindi glow pulse sync may drift from audio after 60+ seconds due to animation/audio timer divergence. The SharedValue architecture should prevent this, but requires explicit testing. Add to the "looks done but isn't" checklist for Phase 3.

---

## Sources

### Primary (HIGH confidence)
- `wavium/package.json` — exact installed versions, verified 2026-02-24
- [Expo BlurView SDK 54 docs](https://docs.expo.dev/versions/latest/sdk/blur-view/) — experimentalBlurMethod, borderRadius workaround, intensity animation warning
- [Expo Fonts docs](https://docs.expo.dev/develop/user-interface/fonts/) — config plugin approach, OTF preference, font loading patterns
- [React Native Skia animations docs](https://shopify.github.io/react-native-skia/docs/animations/animations/) — SharedValue as direct props, interpolateColors, BackdropBlur scope
- [React Native Skia backdrop filters docs](https://shopify.github.io/react-native-skia/docs/backdrops-filters/) — BackdropBlur canvas-only scope confirmed
- [Reanimated useSharedValue docs](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/) — UI thread worklet behavior
- [Reanimated 4 Migration Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/) — SDK 54 compatibility confirmed
- [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54) — Reanimated 4.x ships with SDK 54; New Architecture required
- [expo/expo #29408](https://github.com/expo/expo/issues/29408) — animated gradient colors Android bug confirmed
- [expo/expo #23239, #37905, #21289](https://github.com/expo/expo/) — Android BlurView performance issues and API 31 RenderNode path
- [software-mansion/react-native-reanimated #5800, #3304](https://github.com/software-mansion/react-native-reanimated/) — SharedValue memory leaks with array types
- [Shopify/react-native-skia discussion #1825](https://github.com/Shopify/react-native-skia/discussions/1825) — transform vs matrix with Reanimated 3

### Secondary (MEDIUM confidence)
- [Raw Studio — Aesthetics of Calm UX](https://raw.studio/blog/the-aesthetics-of-calm-ux-how-blur-and-muted-themes-are-redefining-digital-design/) — glassmorphism design patterns
- [uisources.com — Calm app](https://uisources.com/app/calm), [Endel app](https://uisources.com/app/endel) — curated UI screenshots for competitor analysis
- [60fps.design — Headspace animations](https://60fps.design/apps/headspace) — animation pattern reference
- [Callstack — 60fps animations in React Native](https://www.callstack.com/blog/60fps-animations-in-react-native) — performance patterns
- [expo/google-fonts GALLERY.md](https://github.com/expo/google-fonts/blob/main/GALLERY.md) — Cinzel, Cormorant Garamond, Raleway availability confirmed
- [Cinzel + Cormorant Garamond pairing](https://daveyandkrista.com/font-pairings-cormorant-garamond-raleway/) — typography pairing rationale

### Tertiary (LOW confidence)
- Design trend analysis sources (atvoid.com, wearetenet.com) — general 2025-2026 UI trends used to validate feature direction; not relied upon for technical decisions

---

*Research completed: 2026-02-24*
*Ready for roadmap: yes*
