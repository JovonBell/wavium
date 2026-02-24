# Architecture Research

**Domain:** React Native premium aesthetic system (visual/theme layer for mindfulness app)
**Researched:** 2026-02-24
**Confidence:** HIGH (primary findings verified against official Skia, Reanimated, and Expo documentation)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      SCREEN LAYER                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Home    │  │  Create  │  │  Tracks  │  │ THE VOID │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │              │              │
├───────┴─────────────┴─────────────┴──────────────┴──────────────┤
│                   COMPONENT LAYER                               │
│  ┌────────────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │ GlassmorphicCard│  │  HapticButton │  │ TimeShiftBackground│  │
│  │  GlowText      │  │  StreakCard   │  │ MindiRenderer      │  │
│  └────────┬───────┘  └───────┬───────┘  └─────────┬──────────┘  │
│           │                 │                     │             │
├───────────┴─────────────────┴─────────────────────┴─────────────┤
│                   ANIMATION SYSTEM                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Shared Values (Reanimated)  ←→  Skia Props (direct)    │   │
│  │  audioLevel SV → Skia radius/opacity (no bridge needed) │   │
│  │  isPlaying SV → animation drivers → UI thread worklets  │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                   THEME SYSTEM                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │  Design Tokens │  │  ThemeStore    │  │  Font System       │  │
│  │  colors.ts     │  │  (Zustand)     │  │  typography.ts     │  │
│  │  spacing.ts    │  │  timeOfDay →   │  │  + display font    │  │
│  │  animations.ts │  │  colors object │  │                    │  │
│  └────────────────┘  └────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Theme System (`src/theme/`) | Static design tokens — color scales, spacing, animation constants, typography scale | ThemeStore, all UI components |
| ThemeStore (`useThemeStore`) | Runtime theme state — current `timeOfDay`, resolved `colors` object, manual override | All components via `useThemeStore()` hook |
| Animation System | Shared values, drivers, spring configs — no layout side effects | Skia components (direct prop pass), Animated.View styles |
| GlassmorphicCard | Surface-level glass effect using `expo-blur` BlurView + inner glow overlay | ThemeStore (for `primary`, `surfaceGlow` colors) |
| GlowText | Animated text shadow pulsing via Reanimated `useSharedValue` | ThemeStore (for text color), typography scale |
| HapticButton | Press-scale animation + haptic feedback + gradient border (new) | ThemeStore (for colors), `expo-haptics`, spring configs |
| TimeShiftingBackground | Full-screen Skia canvas — gradient + ambient orbs + stars | ThemeStore (for `timeOfDay`) |
| MindiRenderer | Character body assembly (Skia canvas) + floating/scale animation driver | MindiStore (state machine), ThemeStore (mindi colors), audioLevel prop |
| MindiGlow | Skia canvas — multi-layer radial gradient glow, audio-reactive scale | audioLevel prop, animation constants |
| MindiEyes | Skia canvas — eyes, blink, pupil tracking | MindiStore state |
| NebulaRenderer | Skia canvas — audio-reactive cloud system with parallax | audioLevel prop, gyro state, ThemeStore (nebula colors by `timeOfDay`) |
| VoidContainer | Player orchestrator — audio playback, gyro, controls auto-hide | MindiStore, ThemeStore, all void sub-components |

---

## Recommended Project Structure

```
wavium/src/
├── theme/
│   ├── colors.ts           # Color scales per TimeOfDay — EXTEND with gold gradient tokens
│   ├── typography.ts        # Font scale — ADD display font family constant
│   ├── spacing.ts           # Spacing/radius — stable, minimal change needed
│   ├── animations.ts        # Spring configs, timing, cycle constants
│   └── index.ts             # Barrel export
│
├── stores/
│   ├── useThemeStore.ts     # TimeOfDay + resolved colors — stable
│   └── useMindiStore.ts     # MindiState + subliminals + streak — stable
│
├── components/
│   ├── ui/                  # Surface-level UI components (consume theme tokens)
│   │   ├── GlassmorphicCard.tsx     # REFACTOR: add layered depth, inner glow
│   │   ├── GlowText.tsx             # REFACTOR: add display font variant
│   │   ├── HapticButton.tsx         # REFACTOR: add gradient border, glow CTA
│   │   ├── TimeShiftingBackground.tsx  # REFACTOR: deepen purple spectrum
│   │   ├── StreakCard.tsx            # REFACTOR: glassmorphism treatment
│   │   ├── TabBar.tsx                # REFACTOR: floating glass pill style
│   │   └── ...
│   │
│   ├── mindi/               # Skia character (GPU-rendered, animation-driven)
│   │   ├── MindiRenderer.tsx        # REFACTOR: audio pulse sync to isPlaying
│   │   ├── MindiGlow.tsx            # REFACTOR: idle breathing animation
│   │   ├── MindiEyes.tsx            # REFACTOR: eye tracking + entrance animation
│   │   ├── MindiParticles.tsx       # stable — extend for entrance effects
│   │   ├── MindiSpeech.tsx          # stable
│   │   └── index.ts
│   │
│   └── void/                # THE VOID player (full-screen immersive layer)
│       ├── VoidContainer.tsx        # REFACTOR: audioLevel as SharedValue, not state
│       ├── NebulaRenderer.tsx       # stable structure — colors updated via theme
│       ├── StarField.tsx            # stable
│       ├── ParallaxLayer.tsx        # stable
│       ├── AffirmationSpirals.tsx   # REFACTOR: one-by-one ceremony reveal
│       ├── PlayerControls.tsx       # REFACTOR: elegant minimal progress bar
│       └── index.ts
```

### Structure Rationale

- **`theme/`:** Pure constants — no React, no imports from elsewhere. Anything here can be imported by any file without circular dependency risk.
- **`stores/`:** Runtime state bridges theme tokens to components. ThemeStore is the single source of truth for which `colors` object is active.
- **`components/ui/`:** Consume tokens from ThemeStore. Never reach into other stores directly.
- **`components/mindi/`:** Isolated Skia rendering domain. Takes audioLevel and MindiState as props, self-contained animation drivers.
- **`components/void/`:** Isolated immersive player domain. VoidContainer owns audio playback and passes audioLevel down.

---

## Architectural Patterns

### Pattern 1: Design Token Layering (Two-Tier Color System)

**What:** Separate raw palette constants from semantic theme tokens.

**When to use:** Whenever a color must adapt to `timeOfDay` context. Raw palette for fixed values (success green), semantic for variable values (primary, background).

**Current state:** The existing `colors.ts` is already one-tier (semantic only). The gap is that gradient stop values are hardcoded in individual components (`TimeShiftingBackground`, `NebulaRenderer`) rather than flowing from the token system.

**Target pattern:**

```typescript
// theme/colors.ts — ADD: gradient token groups per theme
export const goldScale = {
  50:  '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',  // ← warm gold base
  400: '#fbbf24',
  500: '#f59e0b',  // ← primary gold (replaces flat orange)
  600: '#d97706',
  700: '#b45309',
};

// Each TimeOfDay theme gets a gradient array in addition to flat colors
export interface ThemeColors {
  // existing flat colors...
  primaryGradient: [string, string, string];  // for LinearGradient stops
  glassOverlay: string;                        // rgba for glass surface tint
  glassBorder: string;                         // rgba for glass edge highlight
}

export const nightTheme: ThemeColors = {
  // ...existing
  primaryGradient: ['#6366f1', '#8b5cf6', '#a78bfa'],
  glassOverlay: 'rgba(99, 102, 241, 0.08)',
  glassBorder: 'rgba(167, 139, 250, 0.25)',
};
```

**Trade-offs:** More token keys to maintain across 4 themes. Worth it because components stop hardcoding color values — NebulaRenderer and TimeShiftingBackground can pull from `colors.primaryGradient` instead of inline hex strings.

---

### Pattern 2: Shared Value as Animation Driver (Skia Direct Integration)

**What:** Reanimated `useSharedValue` flows directly into Skia component props — no `createAnimatedComponent`, no `useAnimatedProps`, no bridge.

**When to use:** Any Skia component property that must animate (radius, opacity, color stops, cx/cy). This is the canonical pattern verified by Shopify's official Skia documentation.

**The critical insight:** The current codebase uses `audioLevel` as React state (`useState`), updated by a polling interval at 100ms. This forces JS thread → React re-render → Skia re-render. The correct architecture uses `audioLevel` as a `useSharedValue`, updated from a worklet, flowing directly into Skia props on the UI thread.

**Target pattern:**

```typescript
// In VoidContainer — replace useState audioLevel with SharedValue
const audioLevel = useSharedValue(0);  // ← shared value, not state

// Polling worklet updates it without re-renders
useEffect(() => {
  const interval = setInterval(() => {
    // This runs on JS thread — but Skia reads the SV on UI thread
    audioLevel.value = 0.3 + Math.random() * 0.4;
  }, 16); // 60fps
  return () => clearInterval(interval);
}, [isPlaying]);

// Pass as prop — Skia reads it directly, no bridge
<MindiGlow audioLevel={audioLevel} />  // ← SharedValue prop

// MindiGlow.tsx — accepts SharedValue, passes to Skia props
const glowRadius = useDerivedValue(() =>
  baseRadius * (1 + audioLevel.value * 0.15)
);

<Circle r={glowRadius} ... />  // ← direct Skia prop, UI thread only
```

**Color animation note:** Do NOT use Reanimated's `interpolateColor` for Skia. Use Skia's own `interpolateColors` which handles its internal color format. This is a verified gotcha in the official Skia documentation.

**Trade-offs:** Slight refactor of prop types (accept `SharedValue<number>` instead of `number` for audio-reactive props). The payoff is true GPU-thread animation with zero JS thread involvement — essential for 60fps during audio playback.

---

### Pattern 3: Glassmorphism Component Pattern (Layered Depth)

**What:** Three-layer glass stack: background blur (BlurView) + semi-transparent surface tint + edge highlight border.

**When to use:** All card surfaces, modal overlays, the tab bar.

**Platform reality (HIGH confidence — verified against Expo SDK 54 docs):** BlurView on Android remains experimental in Expo SDK 54. The `experimentalBlurMethod` prop must be set explicitly. Perceived blur intensity differs from iOS due to `blurReductionFactor` (default: 4). The `borderRadius` prop does not apply — must use `overflow: 'hidden'` on the container. iOS has stable production blur.

**Target pattern for GlassmorphicCard:**

```typescript
// GlassmorphicCard.tsx — three-layer approach
export default function GlassmorphicCard({ children, style, intensity = 25, variant = 'default' }) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.container, style]}>
      {/* Layer 1: Blur (iOS native, Android experimental) */}
      <BlurView
        intensity={intensity}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"  // Android
        style={StyleSheet.absoluteFill}
      />

      {/* Layer 2: Colored surface tint (theme-aware) */}
      <View style={[
        StyleSheet.absoluteFill,
        { backgroundColor: colors.glassOverlay }  // new token
      ]} />

      {/* Layer 3: Inner glow highlight at top edge */}
      <LinearGradient
        colors={[colors.glassBorder, 'transparent']}
        style={[styles.topHighlight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Border via container shadow + explicit border */}
      <View style={[styles.content, { borderColor: colors.glassBorder }]}>
        {children}
      </View>
    </View>
  );
}
```

**Trade-offs:** Android blur requires testing with `experimentalBlurMethod`. Falls back gracefully to semi-transparent tint where blur unavailable — still looks premium because the tint + border layers carry the glass aesthetic without blur.

---

### Pattern 4: Mindi Audio Pulse Sync Pattern

**What:** Mindi's glow intensity and scale respond to audio playback — but only when `isPlaying` is true. The pulse uses its own idle breathing animation that audio reactivity modulates rather than replaces.

**When to use:** MindiGlow and MindiRenderer during VoidContainer active playback.

**Current problem:** `audioLevel` is simulated (`Math.random()`) as React state, updated every 100ms by `setInterval`. This causes 10 React re-renders per second just for the player screen — unnecessary and expensive.

**Target pattern:**

```typescript
// MindiGlow.tsx — idle breath + audio modulation combined
const breathPhase = useSharedValue(0);  // ← autonomous idle breath
const audioBoost = useSharedValue(0);   // ← injected from parent

// Idle breath runs forever, audio boost modulates on top
useEffect(() => {
  breathPhase.value = withRepeat(
    withTiming(1, { duration: glowPulseDuration, easing: Easing.inOut(Easing.sin) }),
    -1, true
  );
}, []);

// Derived: combine breath + audio boost
const glowScale = useDerivedValue(() =>
  1 + breathPhase.value * 0.08 + audioBoost.value * 0.15
);

<Canvas>
  <Circle r={useDerivedValue(() => baseRadius * glowScale.value)} ... />
</Canvas>
```

**Trade-offs:** VoidContainer must pass `audioLevel` as `SharedValue<number>` prop. All Mindi sub-components that accept audio reactivity need their prop types updated. One-time refactor, large ongoing performance gain.

---

### Pattern 5: Typography Display Font Pattern

**What:** A separate display font family (loaded via expo-font config plugin) for h1/h2/dramatic headings. Body text uses system font or a clean geometric sans. The two-font system creates hierarchy that makes screens feel editorial rather than functional.

**When to use:** Page titles, section headers in THE VOID, affirmation text, Mindi name displays.

**Implementation pattern:**

```typescript
// theme/typography.ts — ADD display font family
export const fontFamilies = {
  display: 'CormorantGaramond-Light',  // or Playfair Display — loads via expo-font
  body: undefined,    // system default (San Francisco on iOS, Roboto on Android)
};

// Display variants use fontFamily — body variants do not
export const textStyles = {
  displayHero: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['5xl'],   // 40px
    fontWeight: fontWeights.regular,  // serifs look better at light weight
    lineHeight: fontSizes['5xl'] * lineHeights.tight,
    letterSpacing: 2,
  },
  displayLarge: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.regular,
    letterSpacing: 1,
  },
  // existing h1, h2, h3 remain as system-font fallbacks for dense UI
};
```

**Font loading:** Use expo-font config plugin (not `useFonts()` at runtime) so the font is embedded at build time and available frame 0 with no loading flash.

**Trade-offs:** Adds 1-2 font files to the bundle (~100-200KB per variant). Limit to 1-2 display font variants (Light and Regular). The visual impact — screens reading as premium vs. utility — is the single highest ROI change in the entire overhaul.

---

## Data Flow

### Theme Token Flow (static → runtime → component)

```
theme/colors.ts (constants)
    ↓ imported at startup
useThemeStore (Zustand)
    timeOfDay → colors object (resolved ThemeColors)
    ↓ useThemeStore() hook in each component
Component reads colors.primary, colors.glassOverlay, etc.
    ↓ passes to StyleSheet or Skia props
Native rendering (UI thread)
```

**Key rule:** Theme tokens flow DOWN only. Components never write to the theme store. Only `updateTimeOfDay()` (called by app-level timer) or `setManualTheme()` (user override) mutate the store.

---

### Audio State → Visual Reaction Flow

```
VoidContainer
    isPlaying (React state — boolean, triggers re-render OK)
    audioLevel = useSharedValue(0)   ← SharedValue, no re-renders
         |
         ├──→ MindiRenderer
         │       audioLevel (SharedValue prop)
         │           ↓ useDerivedValue in MindiGlow
         │       Skia Circle radius/opacity (UI thread, GPU)
         │
         ├──→ NebulaRenderer
         │       audioLevel (SharedValue prop)
         │           ↓ useDerivedValue for cloud scale
         │       Skia Circle radius (UI thread, GPU)
         │
         └──→ AffirmationSpirals
                 audioLevel (SharedValue prop)
                 currentIndex (React state — triggers re-render for ceremony reveal)
```

**Key rule:** `audioLevel` as SharedValue never causes React re-renders. `isPlaying` and `currentAffirmationIndex` remain React state because they do need to trigger UI changes (show/hide controls, advance affirmation text).

---

### MindiState → Animation Branch Flow

```
MindiStore.currentState ('idle' | 'peaceful' | 'happy' | 'excited' | 'listening' | 'generating')
    ↓ useEffect watching state in MindiRenderer
Branch to spring animation:
    idle → float y + breath glow (autonomous loops)
    peaceful → slower float, half-closed eyes, softer glow
    happy → bounce scale, wide eyes, sparkle
    excited → rapid scale pulse, wide eyes
    listening → head tilt, pupil shift
    generating → slow scale pulse
```

**Build order implication:** MindiState machine is already correct. Animation branches need the audio sync added to `peaceful` state (glow scales with audioLevel when in THE VOID).

---

### Screen-to-Component Visual Stack (THE VOID)

```
VoidContainer (full screen, backgroundColor = colors.background)
    ├── ParallaxLayer (gyro driver)
    │   ├── StarField layer="deep" (Skia, slowest parallax)
    │   ├── NebulaRenderer (Skia, audio-reactive clouds)
    │   ├── StarField layer="medium"
    │   ├── AffirmationSpirals (React Native Text, ceremony reveal)
    │   ├── MindiRenderer (Skia body + glow + particles)
    │   │   └── ProgressRing (Skia, replaces current CSS hack)
    │   └── StarField layer="near" (fastest parallax)
    ├── tap gesture handler (toggles controls)
    └── PlayerControls (Reanimated opacity fade, auto-hide)
```

---

## Refactor vs. Replace Assessment

### Refactor (keep structure, enhance implementation)

**GlassmorphicCard** — Solid pattern, wrong depth. Add the inner glow LinearGradient layer. Add `glassOverlay` and `glassBorder` tokens from ThemeStore. Add `experimentalBlurMethod` for Android. Current `borderGlow` shadow approach is good but needs to use the gradient border token instead of a fixed `colors.primary`.

**GlowText** — Refactor to add `displayFont` variant using the new fontFamily token. Current animated `textShadowRadius` approach works. Add `letterSpacing` for display variants.

**HapticButton** — Primary variant needs gradient border treatment (animated on press, using `LinearGradient` from `expo-linear-gradient` already in dependencies). The scale spring on press is correct. Add a breathing glow animation for CTA variants.

**TimeShiftingBackground** — Move hardcoded gradient hex strings into `ThemeColors.primaryGradient` token. Add deeper purple spectrum tokens to night theme. Logic is sound.

**MindiGlow** — The layered radial gradient approach is architecturally correct. Main changes: (a) accept `audioLevel` as `SharedValue<number>` not raw number, (b) use `useDerivedValue` to combine breath animation + audio boost into final radius, (c) pass derived value directly to Skia `<Circle r={}>`.

**MindiEyes** — Solid. Add eye tracking that reacts to touch position on screen (requires touch coords piped from parent). Add entrance animation per-screen.

**AffirmationSpirals** — Replace the "all affirmations floating simultaneously" approach with sequential ceremony reveal: fade in one at a time, hold, fade out. The `currentIndex` state from VoidContainer already drives this — just needs the staggered reveal animation added.

### Keep As-Is (stable, correct)

- `MindiParticles` — particle system is correct, aesthetics already decent
- `NebulaRenderer` — structure is correct, only color tokens need updating
- `StarField` — works, no changes needed
- `ParallaxLayer` — correct, stable
- `PlayerControls` — needs UI polish (minimal progress bar) but architecture is correct
- All stores (ThemeStore, MindiStore) — stable, no structural changes
- All theme constants (spacing, animations) — stable

### Replace (wrong pattern, not worth patching)

**ProgressRing in VoidContainer** — Current implementation uses two CSS `borderColor` rings with `transform: rotate`. Replace with a proper Skia arc/path that renders on the GPU thread. The existing borders approach creates layout artifacts at certain progress values and cannot animate smoothly as a SharedValue-driven Skia path would.

**HapticButton primary gradient** — Currently uses `backgroundColor: colors.primary` (flat color). Replace with `expo-linear-gradient` LinearGradient wrapping. The gradient border (`borderColor`) remains but the fill surface needs the gradient.

---

## Build Order

The aesthetic overhaul has hard dependencies. This is the correct sequence:

**Phase 1: Foundation (must exist before anything else)**
1. Extend `ThemeColors` interface with `primaryGradient`, `glassOverlay`, `glassBorder` tokens
2. Add gradient token values to all 4 themes (morning/afternoon/evening/night)
3. Add `fontFamilies.display` constant to `typography.ts`
4. Load display font via expo-font config plugin
5. Add `displayHero` and `displayLarge` text styles to `typography.ts`

*Why first:* Every component in Phase 2 pulls from these tokens. If tokens don't exist, all glass components use hardcoded values and the system isn't coherent.

**Phase 2: Core UI Components (can parallelize after Phase 1)**
1. Refactor `GlassmorphicCard` with three-layer depth
2. Refactor `GlowText` with display font variant
3. Refactor `HapticButton` with gradient CTA treatment
4. Refactor `TimeShiftingBackground` to use `primaryGradient` token

*Why second:* These are used across all screens. Getting them right first means screen-level work in Phase 3 gets the full aesthetic effect automatically.

**Phase 3: Mindi Animation System (requires Phase 1 + working Skia baseline)**
1. Change `VoidContainer.audioLevel` from `useState` to `useSharedValue`
2. Update `MindiGlow` to accept `SharedValue<number>` prop + use `useDerivedValue`
3. Update `MindiRenderer` audio scaling to use `useDerivedValue`
4. Update `NebulaRenderer` audio scaling to use `useDerivedValue`
5. Add Mindi idle breathing animation (distinct from glow pulse)
6. Add Mindi eye tracking (requires touch position SharedValue from parent)
7. Add Mindi entrance animations (per-screen variants)

*Why third:* Skia + SharedValue refactor must happen as a unit. Doing MindiGlow without fixing the audioLevel source creates a broken intermediate state.

**Phase 4: THE VOID Polish (requires Phase 2 + Phase 3)**
1. Replace ProgressRing with Skia arc path
2. Refactor `AffirmationSpirals` to one-by-one ceremony reveal
3. Add current affirmation highlight (glow pulse during playback)
4. Polish PlayerControls minimal progress bar design
5. Verify auto-hide controls flow (already implemented, needs timing tuning)

**Phase 5: Screen-Level Aesthetic (requires Phase 2 as baseline)**
1. Apply updated components to Home screen (spacing, typography hierarchy)
2. Sound Picker mood preview (background color shifts per selected track)
3. Affirmations screen ceremony layout
4. Tab bar floating glass pill treatment

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single user, single device) | All Skia on GPU — no server-side rendering concerns. 60fps target = 16.7ms budget per frame. |
| Performance bottleneck | `audioLevel` as React state (10 setState calls/sec in player). Fix: SharedValue approach in Phase 3. |
| Next bottleneck | Multiple simultaneous Skia canvases (MindiRenderer, NebulaRenderer, StarField x3, AffirmationSpirals). Each canvas has overhead. Group into fewer canvases where layers can share a coordinate space. |
| Mid-range Android | BlurView with `experimentalBlurMethod` has known performance issues. Reduce `intensity` on Android (target 15-20 instead of 25-40). Use `blurReductionFactor` prop. Keep glass layer count low (max 3 stacked BlurViews on screen at once). |

---

## Anti-Patterns

### Anti-Pattern 1: audioLevel as React State in Animation-Heavy Screens

**What people do:** `const [audioLevel, setAudioLevel] = useState(0)` updated by `setInterval` at 10-60Hz.

**Why it's wrong:** Every `setAudioLevel` call triggers a React reconciliation cycle. In THE VOID, this means the entire component tree (StarField, NebulaRenderer, MindiGlow) checks for re-renders at 10fps. Causes jank on mid-range devices. The current codebase does exactly this.

**Do this instead:** `const audioLevel = useSharedValue(0)`. Update from interval (JS thread update is fine — Skia reads the value on the UI thread without a React cycle). Pass as prop. Skia reads it directly.

---

### Anti-Pattern 2: Hardcoded Color Hex Strings in Skia Components

**What people do:** `colors={['#ff9f43', '#ff6b6b', '#ffeaa7']}` inside `NebulaRenderer`.

**Why it's wrong:** When theme tokens change (e.g., replacing flat orange with gold gradient), you must hunt down every Skia component that has hardcoded values. The current codebase has this problem in `NebulaRenderer` and `TimeShiftingBackground`.

**Do this instead:** Add `primaryGradient: [string, string, string]` to `ThemeColors`. Pull from `colors.primaryGradient` in all Skia gradient arrays. One token change updates all renderers.

---

### Anti-Pattern 3: Reanimated's interpolateColor with Skia Properties

**What people do:** Use `interpolateColor` from `react-native-reanimated` to animate color values passed to Skia components.

**Why it's wrong:** Reanimated and Skia use different internal color storage formats. `interpolateColor` produces values Skia cannot parse — the animation silently breaks or produces incorrect colors.

**Do this instead:** Use `interpolateColors` from `@shopify/react-native-skia`. Same API, compatible format.

---

### Anti-Pattern 4: Multiple Independent Skia Canvases for the Same Coordinate Space

**What people do:** MindiRenderer, MindiGlow, MindiParticles each have their own `<Canvas>` — three separate GPU contexts all centered on the same screen location.

**Why it's wrong:** Each Canvas is a separate GPU surface. Three small overlapping canvases has more overhead than one large canvas with grouped elements. The current MindiRenderer does this: MindiGlow is a separate Canvas below the body Canvas, MindiEyes is a separate Canvas above.

**Do this instead:** Merge MindiGlow + MindiRenderer body + MindiEyes into a single Canvas using Skia's `<Group>` for layering. This reduces GPU surface count from 3 to 1 for Mindi. MindiParticles can remain separate because it intentionally renders behind Mindi at a different z-index.

---

### Anti-Pattern 5: BorderRadius on BlurView

**What people do:** Apply `borderRadius` directly to `<BlurView style={{ borderRadius: 16 }}>`.

**Why it's wrong:** expo-blur's BlurView ignores `borderRadius` on both iOS and Android — this is documented in the official Expo SDK 54 docs as a known limitation.

**Do this instead:** Wrap BlurView in a `<View style={{ borderRadius: 16, overflow: 'hidden' }}>`. The overflow clip on the parent creates the rounded blur effect.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| ThemeStore ↔ all UI components | Zustand hook (`useThemeStore()`) | One-way: components read, never write |
| MindiStore ↔ MindiRenderer | Zustand hook (`useMindiStore()`) | MindiState read for animation branching |
| VoidContainer ↔ Mindi sub-components | Props (audioLevel as SharedValue) | After refactor: SharedValue passed as prop, not React state |
| VoidContainer ↔ PlayerControls | Props + callbacks | Controls write back via `onPlayPause`, `onSeek` callbacks |
| screens ↔ components | Props only | Screens orchestrate, components are dumb renderers |
| theme constants ↔ stores | Direct import | theme/colors.ts imported by useThemeStore — no circular deps |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| expo-blur BlurView | Wrap in overflow container, set experimentalBlurMethod on Android | Test Android blur quality early — fallback to tint-only if performance regresses |
| expo-linear-gradient | LinearGradient wrapping HapticButton, top highlight in GlassmorphicCard | Already in dependencies — no new install needed |
| expo-font (config plugin) | Add display font to `app.json` plugins config, embed at build time | Do NOT use `useFonts()` — config plugin is faster, no FOUT |
| expo-haptics | Called directly in HapticButton — no architectural change needed | Stable |
| @shopify/react-native-skia 2.2.12 | Direct SharedValue props on Skia components. Use `interpolateColors` from Skia (not Reanimated) for color interpolation | Skia 2.x + Reanimated 4 are compatible per official docs |
| react-native-reanimated 4.1.1 | useSharedValue, useDerivedValue, useAnimatedStyle — all stable. No createAnimatedComponent needed for Skia | Reanimated 4 maintains full backward compat with 3.x patterns |

---

## Sources

- [React Native Skia — Animations documentation](https://shopify.github.io/react-native-skia/docs/animations/animations/) — HIGH confidence (official Shopify docs)
- [React Native Skia — Hooks documentation](https://shopify.github.io/react-native-skia/docs/animations/hooks/) — HIGH confidence (official Shopify docs)
- [Expo BlurView — SDK 54 documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/) — HIGH confidence (official Expo docs, current SDK)
- [React Native Reanimated — useSharedValue](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/) — HIGH confidence (official Software Mansion docs)
- [Reanimated 4 Migration Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/) — HIGH confidence (official docs confirming Skia + Gesture Handler compat unchanged)
- [Expo Fonts — Config Plugin](https://docs.expo.dev/develop/user-interface/fonts/) — HIGH confidence (official Expo docs)
- Codebase analysis — all component files read directly from `/Users/joshuabellhome/wavium/wavium/src/` — HIGH confidence (ground truth)

---

*Architecture research for: Wavium aesthetic overhaul — React Native premium visual system*
*Researched: 2026-02-24*
