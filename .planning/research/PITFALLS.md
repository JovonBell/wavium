# Pitfalls Research

**Domain:** React Native / Expo premium visual effects (glassmorphism, blur, custom fonts, Skia animations)
**Researched:** 2026-02-24
**Confidence:** HIGH (most pitfalls verified via official docs, GitHub issues, and multiple corroborating sources)

---

## Critical Pitfalls

### Pitfall 1: Android Blur Is Not Native — It Emulates, and Emulation Is Expensive

**What goes wrong:**
Developers apply `expo-blur` `BlurView` components expecting the same performance on Android as iOS. On iOS, blur uses UIVisualEffectView — a first-class native compositing operation. On Android below API 31 (Android 12), expo-blur uses RenderScript or the dimezisBlurView library to emulate the effect. The result: 3–5x higher GPU load per BlurView on older Android devices, visible frame drops, and in some cases the blur not rendering at all or rendering with wrong colors after navigation transitions.

**Why it happens:**
Android has no native "blur the content behind this view" API before API 31. Until Expo SDK 55, expo-blur's Android implementation was always the expensive emulated path. Starting SDK 55, Expo uses the RenderNode API for Android 12+ — but devices running Android 11 or below still fall back to the slow path. The project targets both platforms and mid-range devices, so this split matters.

**How to avoid:**
- Test blur-heavy screens on a real mid-range Android device (not an emulator) as the primary performance benchmark, not iOS Simulator.
- Limit concurrent BlurView instances to 2–3 maximum on any single screen. The Expo docs explicitly warn: "Do not render more than a few BlurView components at once."
- For Android fallback on pre-API-31 devices, use a semi-transparent overlay with a matching background color instead of a blur (design degrades gracefully, not catastrophically).
- When `experimentalBlurMethod="blur"` is set for Android, test that it actually renders — this prop is still experimental as of SDK 54.
- Never animate the `intensity` prop of BlurView on Android. This triggers continuous re-blur on each frame — instant frame drops. Animate opacity of the BlurView container instead.

**Warning signs:**
- Android device drops below 30fps on screens with glassmorphic cards
- BlurView renders as a solid tinted rectangle (not blurred) on certain Android versions
- After navigating away and back, blur colors appear wrong or washed out (documented regression with react-native-screens transitions)

**Phase to address:** Phase covering glassmorphism implementation (GlassmorphicCard refinement). Establish the Android blur strategy before building any component that relies on it.

---

### Pitfall 2: Animating the Blur Radius Directly Destroys Performance

**What goes wrong:**
Teams build "breathing" blur effects — blur intensity pulsing in and out — by animating the `intensity` or `blurRadius` prop directly. This causes the blur kernel to be recalculated on every frame. On iOS this hits ~40fps for a single BlurView. On Android it causes near-immediate frame collapse. Similarly, `Animated.Image`'s `blurRadius` prop does not animate correctly — it stays stuck at the initial value.

**Why it happens:**
Blur is not a cheap transform. Unlike opacity or translate (which the GPU handles in compositing without re-drawing), blur requires the GPU to sample surrounding pixels — the cost scales with blur radius and the area being blurred. Animating blur radius is equivalent to re-blurring on every frame.

**How to avoid:**
- Never animate `intensity` or `blurRadius` directly. Animate **opacity** of the BlurView container instead. A BlurView at full intensity cross-fading in via opacity is indistinguishable from an animated blur to users and is 10x cheaper.
- For the Mindi glow pulse synced to audio: animate `opacity` and `scale` of the glow layer, not blur radius.
- For breathing CTA buttons: animate `opacity` of a gradient border overlay, not a BlurView.
- If you need a "reveal" effect (controls appearing in THE VOID player), fade in the entire pre-blurred card rather than growing the blur.

**Warning signs:**
- Animation frame rate charts show steady 60fps until a blur component appears, then drops to 30–40fps
- Perf monitor on Android shows GPU thread consistently over budget on blur screens

**Phase to address:** Phase covering THE VOID player controls (auto-hide reveal animation) and Mindi glow pulse.

---

### Pitfall 3: Stacked Transparent Layers Cause GPU Overdraw

**What goes wrong:**
Glassmorphism aesthetics require: a nebula background, a star field, parallax layers, a gradient overlay, and then cards with their own blur + inner glow + shadow. Each layer that is transparent or semi-transparent forces the GPU to composite everything beneath it again. With 5–7 stacked semi-transparent layers, you can easily hit 3–5x overdraw — meaning the GPU renders each pixel 3–5 times per frame. This is invisible in Expo Go on a modern iPhone but collapses on mid-range Android.

**Why it happens:**
React Native's compositing model is flat — it doesn't cull overdraw automatically. Every `backgroundColor: 'transparent'` or partial opacity triggers full compositing of layers beneath. The star field + parallax + gradient + blur cards is a recipe for exactly this problem if not architected deliberately.

**How to avoid:**
- Audit the z-axis stack for every major screen. Count layers. More than 4 semi-transparent layers on a single screen is a red flag.
- Replace `backgroundColor: 'transparent'` + shadow with a single pre-composited gradient image where possible.
- Use `shouldRasterizeIOS: true` on stable intermediate layers that don't change frame-to-frame. This caches the composited result.
- Use `renderToHardwareTextureAndroid: true` for stable animated views — promotes the view to its own GPU layer, eliminating re-compositing cost.
- Move particle effects and star fields into Skia Canvases — Skia batches all drawing ops into a single GPU call, dramatically reducing overdraw.

**Warning signs:**
- Android GPU profiler shows "overdraw" heat map with red areas over card regions
- Frame time consistently 20–25ms (below 60fps) on screens with multiple overlapping effects
- Profiling shows "Compositing" taking more time than "Draw"

**Phase to address:** Phase establishing the base theme system and background layers. Design the layer budget before building individual components.

---

### Pitfall 4: expo-font Flash of Invisible Text on Startup

**What goes wrong:**
A custom display font is added for dramatic heading typography. On first launch (cold start), `useFonts` loads asynchronously. If the splash screen is hidden before fonts are loaded, React Native renders text with the system fallback font for ~100–300ms, then snaps to the display font. On first launch this looks like a glitch. More critically: if `SplashScreen.preventAutoHideAsync()` is not called at the very top of the root layout, the splash screen can auto-hide before fonts are ready, causing a blank white screen flash.

**Why it happens:**
`useFonts` returns `[false, null]` on the first render. If the app renders at this point without guarding, text is drawn with the fallback font. The `useFonts` hook has also been documented to randomly fail on initial load (requiring a hot reload) in some SDK versions — an intermittent issue that fails silently.

**How to avoid:**
- Always call `SplashScreen.preventAutoHideAsync()` before any component renders (at module level in the root layout, outside the component function).
- Return `null` from the root layout while `!loaded && !error` — do not render the app skeleton at all.
- Only call `SplashScreen.hideAsync()` in a `useEffect` when `loaded || error` — the `error` branch is critical: if font loading fails silently, the app should still unhide rather than hang on a splash screen forever.
- Keep font files in `assets/fonts/` and verify paths are correct — a wrong path fails silently with `useFonts` returning `[false, null]` indefinitely.
- Use `expo-font` with the config plugin for SDK 54+, not just the runtime `useFonts` hook — fonts listed in the config plugin are bundled and loaded before JS starts, eliminating the async race entirely.

**Warning signs:**
- App hangs on splash screen after fresh install (fonts failed to load, error branch not handled)
- Typography "snaps" on first render in development builds
- `useFonts` returns `[false, null]` indefinitely (wrong font path or missing config plugin)

**Phase to address:** Typography system implementation. Get font loading right before building any typographic hierarchy.

---

### Pitfall 5: Reanimated Infinite Animations Not Cancelled on Unmount (Memory Leak)

**What goes wrong:**
`withRepeat` animations with `-1` iterations (infinite loops) continue running after the component unmounts. This is documented behavior — Reanimated does not auto-cancel animations when a shared value goes out of scope. On screens that animate Mindi breathing, star glow pulses, and particle loops simultaneously, unmounting without cleanup leaves 5–10 animation loops running invisibly on the UI thread, increasing CPU/GPU load on the next screen.

The documented `useSharedValue` memory leak (GitHub issues #5800, #5614) shows that memory allocated for shared values with array data is not released on unmount in some Reanimated versions.

**Why it happens:**
Reanimated runs animations on the UI thread via worklets. When the component unmounts, the React tree node is gone, but the worklet and its associated shared value can persist if not explicitly cancelled. This is a design choice (it prevents abrupt visual cuts) but requires explicit developer cleanup.

**How to avoid:**
- Every `withRepeat(..., -1, ...)` animation must have a `useEffect` cleanup that calls `cancelAnimation(sharedValue)` on the same shared value.
- Write a custom `useLoop` hook that encapsulates `withRepeat` + `withTiming` + cleanup so this pattern is reused consistently rather than repeated ad-hoc.
- Avoid storing large arrays inside shared values (known memory leak with array-typed shared values). Use separate scalar shared values instead.
- In THE VOID player (which has: Mindi glow pulse, affirmation reveal, progress bar animation, particle animations, nebula animations) — all of these need cleanup hooks. Audit each animated component for missing cleanup.

**Warning signs:**
- Memory usage climbs steadily after navigating between screens (Flipper memory profiler)
- CPU usage doesn't drop when leaving animation-heavy screens
- Animations "bleed through" to the next screen (stale worklet still running)

**Phase to address:** Every phase that introduces `withRepeat` animations — establish the `useLoop` pattern in the first animation phase and enforce it throughout.

---

### Pitfall 6: JS Thread Blocking Kills Animations That Seem Reanimated-Safe

**What goes wrong:**
A developer uses Reanimated correctly (worklets, UI thread animations) but still sees jank. Investigation reveals that `useAnimatedStyle` callbacks are being called on the JS thread for the first render, and a blocking state update (Zustand store update, audio status polling, heavy computation) happens simultaneously. The 16.67ms frame budget is blown by JS work before animations even start.

Concretely: Wavium polls audio playback status (`expo-av` `onPlaybackStatusUpdate`), updates Zustand store, and derives animation state from that. If the playback status update triggers a cascade of re-renders, every Reanimated component re-evaluates its `useAnimatedStyle` on the JS thread, eating the frame budget.

**Why it happens:**
Reanimated 3 worklets run on the UI thread — but only after the initial render. The first call to `useAnimatedStyle` runs on JS. Additionally, reading a shared value inside a non-worklet function runs on the JS thread, not the UI thread. Mixing Reanimated values with React state in the same component creates JS-thread dependency chains.

**How to avoid:**
- Never derive animation values from React state that updates at high frequency (audio position ticks, timer values). Instead, use `useSharedValue` directly and update it from within a worklet or via `runOnUI`.
- Debounce or throttle `onPlaybackStatusUpdate` — poll at 500ms intervals for UI-driven updates rather than every 100ms.
- Keep Mindi animation components isolated: no Zustand selectors, no React state. Drive their behavior from shared values passed as props.
- Use `useDerivedValue` for computed animation state rather than deriving inside `useAnimatedStyle`.

**Warning signs:**
- Perf monitor shows "JS Thread" consistently at 80–100% during audio playback
- Animations stutter in sync with audio status update ticks
- React DevTools shows frequent re-renders on animated components

**Phase to address:** THE VOID player (audio-synced animations) and Mindi glow pulse sync. Design the data flow architecture before implementing audio-reactive animations.

---

### Pitfall 7: Skia Backdrop Blur Cannot Blur Native Views Outside the Canvas

**What goes wrong:**
The existing codebase uses Skia for Mindi rendering. A developer decides to use Skia's `BackdropBlur` to implement glassmorphism on cards, expecting it to blur whatever native views lie behind the canvas. It does not work. Skia's `BackdropBlur` only blurs content declared **inside the same Skia Canvas** — it cannot sample or blur native React Native views rendered outside the canvas. Attempts to snapshot the native view and blur the snapshot fail for scrollable content (the snapshot doesn't update as content scrolls).

**Why it happens:**
Skia operates in its own rendering context. It has no access to the native compositing tree's framebuffer of surrounding views. This is a fundamental architecture boundary, not a bug. Official documentation states: "Backdrop blur won't work with scrollable content outside the Skia canvas."

**How to avoid:**
- Use `expo-blur` (`BlurView`) for glassmorphism on cards that overlay native views — this IS the right tool.
- Reserve Skia for: Mindi rendering, particle effects, star fields, nebula backgrounds, gradient animations, glow effects — all things rendered inside a Skia canvas.
- Do not attempt to replace `expo-blur` with Skia `BackdropBlur` on cards. The two tools have different jobs and different access to the view hierarchy.
- The `GlassmorphicCard` component should use `BlurView` for backdrop blur + a Skia canvas layer on top for inner glow/gradient decoration if needed.

**Warning signs:**
- Skia BackdropBlur renders as transparent or only blurs other Skia-drawn content
- Discussion threads showing "BackdropBlur not working on Android" — confirm which issue applies

**Phase to address:** GlassmorphicCard refinement phase. Establish the Skia-vs-BlurView boundary explicitly before implementing cards.

---

### Pitfall 8: Reanimated + Skia Color Interpolation Incompatibility

**What goes wrong:**
A developer uses Reanimated's `interpolateColor` to drive a color transition inside a Skia canvas (e.g., animating the nebula or Mindi glow from one color to another based on time-of-day). The interpolated color value is incorrect or renders as black/wrong hue. This is because Reanimated and Skia use different internal color representations — Skia stores colors in a non-standard format that Reanimated's `interpolateColor` does not produce.

**Why it happens:**
React Native Skia internally encodes colors differently from Reanimated. When you pass the output of `interpolateColor` (which produces RGBA as a 32-bit integer in ARGB order) to a Skia property expecting its format, the channels are misinterpreted. The Skia docs explicitly note this incompatibility.

**How to avoid:**
- Use `interpolateColors` from `@shopify/react-native-skia` instead of `interpolateColor` from `react-native-reanimated` when the output goes to a Skia property.
- For Reanimated shared values that drive both Skia and native React Native properties, apply the appropriate interpolation function for each target.
- The Wavium time-of-day theme system drives both native background views AND the Skia nebula renderer — ensure these two paths use compatible color representations.

**Warning signs:**
- Colors appear as wrong hues (typically wrong channel order — blue appears where red should be)
- Color transitions snap rather than interpolate smoothly
- Skia renders black where a colored gradient is expected

**Phase to address:** Theme system color implementation. Verify color interpolation paths before building time-of-day transitions.

---

### Pitfall 9: Reanimated `transform` Not Animatable via Reanimated 3 on Skia (Use `matrix` Instead)

**What goes wrong:**
The `transform` prop on Skia components is not animatable by Reanimated 3 when using standard `useAnimatedStyle` patterns. Animation appears to work in development but the transform has no effect, or Reanimated warns about the property. For Mindi's entrance animations (translate + scale on entry to each screen), using `transform` on a Skia Group will silently fail.

**Why it happens:**
Skia components have their own prop system that doesn't map directly to React Native's style system. The `transform` array is a React Native style concept; Skia uses `matrix` for transformations. Reanimated's `createAnimatedComponent` and `useAnimatedProps` integration with Skia requires using `matrix` as the animatable property instead.

**How to avoid:**
- For Skia components, animate the `matrix` property using Reanimated shared values — do not use the `transform` array.
- Skia supports direct usage of Reanimated shared and derived values as properties — pass shared values directly to Skia props, no need for `createAnimatedComponent` or `useAnimatedProps`.
- For Mindi entrance animations: compute a transformation matrix from shared position/scale values and pass it to the Skia canvas's Group `matrix` prop.

**Warning signs:**
- Mindi entrance animation defined but Mindi doesn't move
- Console warning about `transform` prop in Reanimated context with Skia component
- Animation frame rate is correct (worklet running) but visual output doesn't change

**Phase to address:** Mindi entrance animations and idle breathing animation phases.

---

### Pitfall 10: Font Variants Missing — Bold/Italic Fallback to System Font Mid-Sentence

**What goes wrong:**
A display font is loaded for headings. The body copy uses `fontWeight: '700'` expecting to get the bold variant. On iOS, `fontWeight` causes the OS to synthetically bold the regular variant (ugly). On Android, `fontWeight: '700'` does nothing if the 700-weight font file isn't loaded separately — it falls back to the system font mid-render, producing mixed typography: part display font, part system font on the same screen.

**Why it happens:**
React Native does not auto-load font variants. Each weight and style (Regular, Bold, Italic, SemiBold) must be loaded as a separate named font entry in `useFonts`. A developer loads "DisplayFont-Regular" and then tries `fontWeight: 'bold'` expecting the OS to figure it out.

**How to avoid:**
- Load every weight variant you intend to use explicitly in the `useFonts` map:
  ```
  'DisplayFont-Regular': require('./assets/fonts/DisplayFont-Regular.otf'),
  'DisplayFont-SemiBold': require('./assets/fonts/DisplayFont-SemiBold.otf'),
  ```
- Reference fonts by their loaded name, not by `fontFamily` + `fontWeight`. Use `fontFamily: 'DisplayFont-SemiBold'` rather than `fontFamily: 'DisplayFont-Regular'` + `fontWeight: '600'`.
- For the Wavium typography system: identify up front which weights are needed across all screens (Regular for body, SemiBold for UI labels, something heavier for display headings) and load only those — each font file adds to bundle size and startup load time.

**Warning signs:**
- Typography looks correct on iOS but falls back to system font on Android for bold text
- Synthetic bold (ugly, low-quality letterforms) appearing on certain weights on iOS
- Font bundle size unexpectedly large because all 9 weights of a family were loaded

**Phase to address:** Typography system implementation phase (load fonts correctly the first time).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Use `BlurView` with `intensity={80}` everywhere without Android testing | Fast development | Slow Android on all blur screens, no easy retrofit | Never — test on Android before committing |
| Animate blur `intensity` instead of container `opacity` | One less layer | ~40fps on iOS, near 0fps on Android | Never |
| Use `interpolateColor` from Reanimated on Skia props | Familiar API | Wrong colors rendered, hard to debug | Never — use `interpolateColors` from Skia |
| Skip `cancelAnimation` cleanup in `useEffect` | Less boilerplate | Memory leaks, ghost animations, increasing CPU on navigation | Only acceptable for one-shot animations (not `withRepeat`) |
| Load all font weights for a typeface | Covers all cases | 500KB–2MB added to bundle, longer cold start | Never — load only weights in use |
| Derive animation values from React state via `useAnimatedStyle` | Simpler data flow | JS thread blocking on high-frequency updates (audio playback) | Only for low-frequency state changes |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `expo-blur` + `expo-router` navigation | BlurView color changes on back-navigation | Wrap BlurView in a container with fixed background color; test nav transitions explicitly |
| `expo-blur` + Android | Using `BlurView` without `experimentalBlurMethod` | Set `experimentalBlurMethod="blur"` on Android + have a fallback for pre-API-31 |
| `expo-blur` + `borderRadius` | Applying `borderRadius` directly to BlurView | Apply `overflow: 'hidden'` + `borderRadius` to a wrapper View instead |
| Skia + Reanimated | Passing `useAnimatedStyle` result to a Skia component | Pass Reanimated shared values directly to Skia props (no `createAnimatedComponent` needed) |
| Skia `BackdropBlur` + native views | Expecting to blur content beneath the canvas | Use `expo-blur` for blurring native view content; Skia BackdropBlur only blurs intra-canvas content |
| `expo-av` playback status + Reanimated | Updating shared values from `onPlaybackStatusUpdate` on JS thread | Use `runOnUI` to transfer playback values to UI thread, or throttle update frequency |
| Time-of-day theme + Zustand interval | `setInterval` driving store updates causing cascade re-renders | Update theme store at most every 60 seconds; use `useMemo` to derive animation values |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Multiple concurrent BlurViews | FPS drops to 20–30fps on Android | Max 2–3 BlurViews per screen; test on real device | From first BlurView on Android <API 31; degrades linearly |
| Animating blur `intensity` | Android <15fps, iOS ~40fps | Animate container opacity instead | Immediately on any animated blur |
| >5 semi-transparent overlay layers | GPU overdraw, consistent 20ms+ frame time | Budget layers, use `shouldRasterizeIOS` / `renderToHardwareTextureAndroid` on stable layers | Mid-range Android, any screen with glassmorphism stack |
| `withRepeat` without cleanup | Rising CPU/memory over session; ghost animations | `useLoop` hook pattern with `cancelAnimation` cleanup | After navigating away from animated screen 3+ times |
| JS-thread state driving animation | Jank in sync with state update frequency | Drive animations with shared values; keep animated components free of React state dependencies | When audio playback polling is <500ms interval |
| Large shared value arrays | Memory grows without release | Use scalar shared values; avoid arrays in shared values | After 5–10 component mount/unmount cycles |
| Skia path accumulation | Canvas slows after many draw calls | Clear and redraw on each frame; don't accumulate paths | After ~50 paths added to a canvas |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Blur radius too high (>50) | Background content unrecognizable; card reads as opaque solid | Keep blur intensity 20–40; the blur effect works best at subtle levels where the background color bleeds through |
| Too many glassmorphic cards on one screen | Premium effect becomes wallpaper; nothing stands out | Limit to 1–2 featured glass cards per screen; use flat dark surfaces for secondary content |
| Affirmation ceremony too long | Users feel trapped, skip it; defeats the ceremony intent | Cap reveal timing — each affirmation should feel intentional but not slow; aim for <800ms per reveal |
| Auto-hide controls hiding too fast in THE VOID | Users can't find controls; frustration | 3+ second timeout before controls fade; re-reveal on any tap |
| Mindi animations blocking the main interaction | Mindi distracts from the content | Mindi should be ambient and reactive, not competing for attention; keep glow pulses subtle |
| Font display size too large on smaller phones | Text wraps unexpectedly; layout breaks | Test all display font sizes on smallest supported screen size before finalizing |
| Glassmorphism with very light backgrounds | Glass effect invisible; looks like a plain card | Glass requires a colorful, dynamic background to be visible — the nebula/gradient background is essential, not decorative |

---

## "Looks Done But Isn't" Checklist

- [ ] **Android blur:** Blur looks correct in iOS Simulator — verify on physical Android device (not emulator) before considering done
- [ ] **Font loading:** Typography looks correct on hot reload — verify cold start (fresh install) for font flash behavior
- [ ] **Animation cleanup:** Animations play correctly on the screen — verify memory/CPU doesn't grow after navigating away and back 5 times
- [ ] **Time-of-day theme:** Colors look right at current time — verify the three time periods (morning/day/night) by spoofing time, not waiting
- [ ] **THE VOID auto-hide controls:** Controls hide correctly — verify they re-appear on tap and the timeout feels right on device (not simulator with perfect touch)
- [ ] **Mindi glow pulse:** Glow pulses in sync in development — verify sync holds after 60+ seconds of playback (no drift from audio/animation timer divergence)
- [ ] **Affirmation reveal:** Animation plays on first view — verify it resets correctly when affirmations change or audio restarts
- [ ] **Color interpolation:** Colors look right on iOS — verify on Android (Skia color encoding differences)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Android blur too slow (already shipped to multiple screens) | HIGH | Audit all BlurView usage; replace non-essential blurs with semi-transparent overlays on Android via `Platform.OS === 'android'` conditional; add Android-specific styling pass |
| Font loading glitch visible on release build | LOW | Add config plugin registration for fonts (pre-bundles fonts, eliminates async load race) |
| Ghost animations causing memory leak | MEDIUM | Add `cancelAnimation` calls in `useEffect` cleanup for all `withRepeat` animations; no component changes needed |
| Wrong colors in Skia (Reanimated interpolation incompatibility) | LOW | Swap `interpolateColor` for `interpolateColors` at call sites feeding Skia props |
| `transform` not working on Skia components | LOW | Replace `transform` array with `matrix` computed from shared values |
| Overdraw causing consistent 20ms frame time | HIGH | Profile with Android GPU overdraw tool; add `shouldRasterizeIOS`/`renderToHardwareTextureAndroid` to stable layer components; may require design changes to reduce layer count |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Android blur performance | Glassmorphism / GlassmorphicCard phase | Run on physical Android mid-range device; FPS > 55 on blur screens |
| Animating blur intensity | Any animation phase that touches blur | Code review: no direct animation of `intensity` or `blurRadius` props |
| Stacked layer overdraw | Base theme / background layer phase | GPU profiler shows <3x overdraw on any screen |
| Font flash on startup | Typography system phase | Cold-start test on device: no typography snap between splash and first screen |
| Animation memory leaks | First Reanimated animation phase | Establish `useLoop` hook; navigate away/back 10x; Flipper memory stable |
| JS thread blocking audio animations | THE VOID player phase | Audio playing + animations: JS thread <50% utilization in Perf Monitor |
| Skia backdrop blur misuse | GlassmorphicCard phase | Architecture decision documented: BlurView for glass, Skia for decorative layers |
| Color interpolation incompatibility | Theme color implementation phase | Test color transitions on both platforms; no hue shifting |
| Skia `transform` vs `matrix` | Mindi animation phases | Mindi entrance/exit animations tested on both platforms |
| Font weight fallback | Typography system phase | Test all text styles on Android device; no system font bleed-through |

---

## Sources

- [expo/expo GitHub Issue #23239 — BlurView performance decreased on Android SDK 49 beta](https://github.com/expo/expo/issues/23239)
- [expo/expo GitHub Discussion #37905 — expo-blur Android BlurView V3 upgrade](https://github.com/expo/expo/discussions/37905)
- [expo/expo GitHub Issue #21289 — Adding Android 12+ native blur support via RenderNode](https://github.com/expo/expo/issues/21289)
- [Expo SDK 55 Beta Changelog — RenderNode blur API for Android 12+](https://expo.dev/changelog/sdk-55-beta)
- [BlurView — Expo Documentation (official)](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [Fonts — Expo Documentation (official)](https://docs.expo.dev/develop/user-interface/fonts/)
- [React Native Skia Animations Documentation](https://shopify.github.io/react-native-skia/docs/animations/animations/)
- [React Native Skia Backdrop Filters Documentation](https://shopify.github.io/react-native-skia/docs/backdrops-filters/)
- [Shopify/react-native-skia Discussion #1825 — transform vs matrix with Reanimated 3](https://github.com/Shopify/react-native-skia/discussions/1825)
- [Shopify/react-native-skia Discussion #980 — Backdrop blur on elements under Canvas](https://shopify.github.io/react-native-skia/docs/backdrops-filters/)
- [software-mansion/react-native-reanimated GitHub Issue #5800 — Memory leak in useSharedValue](https://github.com/software-mansion/react-native-reanimated/issues/5800)
- [software-mansion/react-native-reanimated GitHub Issue #3304 — Massive memory leak with array values](https://github.com/software-mansion/react-native-reanimated/issues/3304)
- [cancelAnimation — React Native Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/docs/core/cancelAnimation/)
- [Performance — React Native Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- [Expo SDK 54 Changelog — Known issues with Reanimated 4.x and new arch](https://expo.dev/changelog/sdk-54)
- [expo/expo GitHub Issue #23539 — BlurView + Reanimated rendering issue](https://github.com/expo/expo/issues/23539)
- [Islam Rustamov — React Native performance stress testing 2023 vs 2025](https://medium.com/@islamrustamov/how-react-native-improved-from-2023-to-2025-animation-stress-testing-and-a-little-bit-of-flutter-edd44297b815)
- [Mikael Ainalem — Glassmorphism over scrollable content in React Native](https://mikael-ainalem.medium.com/mastering-glassmorphism-over-scrollable-content-in-react-native-971104dd707b)
- [Callstack — 60fps animations in React Native](https://www.callstack.com/blog/60fps-animations-in-react-native)

---
*Pitfalls research for: React Native / Expo premium visual effects overhaul (Wavium)*
*Researched: 2026-02-24*
