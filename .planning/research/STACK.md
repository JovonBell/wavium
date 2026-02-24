# Stack Research

**Domain:** React Native Expo premium UI/UX — mindfulness/subliminal audio app aesthetic overhaul
**Researched:** 2026-02-24
**Confidence:** HIGH (all core libraries verified against installed package.json and official docs)

---

## Context: What's Already Installed

This is a subsequent milestone. The existing `wavium/package.json` already contains:

| Package | Installed Version |
|---------|------------------|
| expo | ~54.0.33 |
| react-native | 0.81.5 |
| @shopify/react-native-skia | 2.2.12 |
| react-native-reanimated | ~4.1.1 |
| react-native-gesture-handler | ~2.28.0 |
| expo-blur | ^15.0.8 |
| expo-linear-gradient | ^15.0.8 |
| expo-haptics | ^15.0.8 |
| react-native-worklets | 0.5.1 |

**Critical implication:** Every UI technique in this stack must work within these existing dependencies. No new heavy native libraries. Typography (expo-font) and Google Fonts packages are the only new installs needed.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @shopify/react-native-skia | 2.2.12 (installed) | Animated gradients, glow effects, custom blur effects within Canvas | GPU-rendering on UI thread. Supports Reanimated shared values directly as props — no createAnimatedComponent needed. `interpolateColors` function handles gradient color animation natively. Already powers Mindi. Skia moved to Fabric reconciler in recent versions: ~50% faster iOS, ~200% faster Android vs Paper. |
| react-native-reanimated | ~4.1.1 (installed) | All animations — breathing buttons, glow pulses, affirmation reveals, control auto-hide | Reanimated 4 ships with Expo SDK 54. Worklets run on UI thread, eliminating JS bridge overhead. Up to 120fps capable. Powers withSpring, withTiming, withRepeat for every animation pattern this overhaul needs. |
| expo-blur | ^15.0.8 (installed) | Glassmorphism on cards, modals, tab bar | Native iOS implementation is solid. Android experimental (`experimentalBlurMethod` prop required). Version 15.0.0 fixed react-native-screens transition issues. Sufficient for Wavium's card-level blur. |
| expo-linear-gradient | ^15.0.8 (installed) | Static gradients — backgrounds, gold palette overlays, button fills | Works on iOS, Android, web. Static use is fully reliable. Version 15.x confirmed for SDK 54. For animated gradient colors use Skia instead (see below). |
| expo-font | ~13.x (SDK 54 SDK version, already available via expo) | Custom display typography | Config plugin approach embeds fonts at build time — available instantly on launch, no async loading code needed. OTF preferred over TTF for smaller size and better hinting. |

### Supporting Libraries (New Installs)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @expo-google-fonts/cinzel | latest | Display font — headings, hero text, THE VOID title | Cinzel is derived from Roman inscriptions. Dramatic, ceremonial, all-caps elegance. Ideal for sacred/premium contexts. Use for H1-level display text only (1-3 words). Confirmed available in expo/google-fonts. |
| @expo-google-fonts/cormorant-garamond | latest | Secondary display — affirmation text, screen subtitles | High-end editorial serif with luxury feel. Literary and upscale without being heavy. The standard choice for wellness/premium brands. Best at larger sizes (20px+). Confirmed available. |
| @expo-google-fonts/raleway | latest | Body text, UI labels, navigation | Clean geometric sans-serif. Pairs perfectly with Cormorant Garamond. Readable at small sizes. Confirmed available. |

**Installation:**
```bash
npx expo install expo-font @expo-google-fonts/cinzel @expo-google-fonts/cormorant-garamond @expo-google-fonts/raleway
```

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| React Native Performance Monitor | Validate 60fps on mid-range Android | Enable via shake menu → Show Perf Monitor. Check UI thread FPS, not just JS thread. |
| Hermes JS engine | Required for Reanimated 4 debugger support | Reanimated is incompatible with Remote JS Debugging on JSC. Already default in Expo 54. |
| Flipper (optional) | Frame-level performance debugging | Use if perf monitor reveals Android-specific drops under blur. |

---

## Installation

```bash
# Typography only — everything else already installed
npx expo install expo-font @expo-google-fonts/cinzel @expo-google-fonts/cormorant-garamond @expo-google-fonts/raleway
```

**app.json config plugin setup for fonts:**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/Cinzel-Regular.otf",
            "./assets/fonts/Cinzel-Bold.otf",
            "./assets/fonts/CormorantGaramond-Regular.otf",
            "./assets/fonts/CormorantGaramond-Italic.otf",
            "./assets/fonts/Raleway-Regular.otf",
            "./assets/fonts/Raleway-Medium.otf"
          ]
        }
      ]
    ]
  }
}
```

Alternatively, use `@expo-google-fonts` packages directly (no manual font file management):
```typescript
import { useFonts, Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { CormorantGaramond_400Regular, CormorantGaramond_400Regular_Italic } from '@expo-google-fonts/cormorant-garamond';
import { Raleway_400Regular, Raleway_500Medium } from '@expo-google-fonts/raleway';
```

---

## Implementation Patterns by Domain

### 1. Glassmorphism / Blur Effects

**The layered approach (recommended):**

```typescript
// Pattern: expo-blur for native blur + Skia for decorative glow layers
import { BlurView } from 'expo-blur';

// Glassmorphic card
<BlurView
  intensity={40}          // 20-50 range: subtle enough for legibility
  tint="dark"             // "dark" for purple/cosmic palette
  experimentalBlurMethod="dimezisBlurView"  // Android: required for actual blur
  style={{
    overflow: 'hidden',   // Required — borderRadius clips via overflow
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',  // subtle border for glass edge
  }}
>
  {/* card content */}
</BlurView>
```

**Android reality check:** `expo-blur` on Android requires `experimentalBlurMethod="dimezisBlurView"` prop and may still have visual inconsistencies on older devices (pre-Android 12). The visual effect is less crisp than iOS. Mitigation: use `rgba(20, 15, 40, 0.6)` semi-transparent background as fallback for Android devices where blur isn't rendering cleanly.

**When to use Skia blur instead:** Skia's `BackdropBlur` only works within a Canvas and cannot blur native views underneath it. Use expo-blur for native-view glassmorphism. Use Skia blur for in-canvas effects (e.g., blurring Mindi's glow halo, nebula effects).

### 2. Gradient System

**Static gradients (expo-linear-gradient):**
```typescript
import { LinearGradient } from 'expo-linear-gradient';

// Gold palette gradient (replacing flat orange)
<LinearGradient
  colors={['#F7C873', '#D4A017', '#A0720C']}  // warm gold → deep amber
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.buttonBackground}
/>

// Purple depth gradient (background layers)
<LinearGradient
  colors={['#0D0820', '#1A1040', '#2D1B69']}  // near-black → rich violet
  locations={[0, 0.5, 1]}
  style={StyleSheet.absoluteFill}
/>
```

**Animated gradients (Skia — required for breathing/pulsing effects):**
```typescript
import { Canvas, LinearGradient, Rect, interpolateColors, vec } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, withRepeat, withTiming } from 'react-native-reanimated';

function BreathingGradient({ width, height }) {
  const progress = useSharedValue(0);

  // Skia uses interpolateColors from @shopify/react-native-skia, NOT Reanimated's
  const colors = useDerivedValue(() => [
    interpolateColors(progress.value, [0, 1], ['#F7C873', '#D4A017']),
    interpolateColors(progress.value, [0, 1], ['#A0720C', '#F7C873']),
  ]);

  React.useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true);
  }, []);

  return (
    <Canvas style={{ width, height }}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width, height)}
          colors={colors}  // Reanimated shared value passed directly — no createAnimatedComponent
        />
      </Rect>
    </Canvas>
  );
}
```

**Key distinction:** `interpolateColors` must be imported from `@shopify/react-native-skia`, not from Reanimated. They use different color storage formats and are not interchangeable.

**Animated expo-linear-gradient colors (use with caution):** Animating the `colors` prop of expo-linear-gradient via `useAnimatedProps` is technically possible but has known Android issues — color changes fail or produce unexpected values. For anything that needs animated gradient color transitions, use Skia. For static or JS-state-driven color changes (not frame-by-frame), expo-linear-gradient is fine.

### 3. Animated Buttons (Breathing/Glowing CTAs)

**Pattern: Reanimated for scale/opacity + Skia for glow border:**

```typescript
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

function GlowButton({ onPress, children }) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);

  // Breathing scale animation
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Glow pulse animation
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1500 }),
        withTiming(1.0, { duration: 1500 })
      ),
      -1,
      false
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  return (
    <Animated.View style={animatedStyle}>
      {/* Glow layer — Animated.View with shadow/borderRadius glow */}
      <Animated.View style={[styles.glowLayer, glowStyle]} />
      {/* Gradient border + content */}
      <LinearGradient
        colors={['#F7C873', '#D4A017', '#A0720C']}
        style={styles.gradientBorder}
      >
        <TouchableOpacity onPress={onPress} style={styles.buttonInner}>
          {children}
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}
```

For a Skia-rendered glow border (more GPU-efficient, cleaner at any radius):

```typescript
// Skia canvas overlay for the glowing border ring
import { Canvas, RoundedRect, Paint, BlurMask } from '@shopify/react-native-skia';

<Canvas style={StyleSheet.absoluteFill}>
  <RoundedRect x={2} y={2} width={width-4} height={height-4} r={16}>
    <Paint color="rgba(247, 200, 115, 0.8)" style="stroke" strokeWidth={2}>
      <BlurMask blur={8} style="solid" />
    </Paint>
  </RoundedRect>
</Canvas>
```

### 4. Typography System

**Font hierarchy for Wavium:**

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display (hero) | Cinzel | 700 Bold | Screen titles, "THE VOID", 1-3 word dramatic statements |
| Editorial | Cormorant Garamond | 400 Regular / 400 Italic | Affirmation text, longer phrases, subtitles at 20px+ |
| Body / UI | Raleway | 400 Regular / 500 Medium | Labels, descriptions, navigation tabs, form inputs |

**Why Cinzel for display:** Roman inscription origins give it inherent gravitas. All-caps elegance reads as ceremonial rather than corporate. Perfect for THE VOID player title. Do not use for body text — readability drops below 18px.

**Why Cormorant Garamond for affirmations:** The serif creates a sense of being "written" rather than displayed. Literary affect reinforces the ritualistic, intentional feel the app is going for. The Italic variant adds emotional intimacy to affirmation cards.

**Why Raleway for body:** Clean geometric sans-serif pairs naturally with both display fonts. Reads well at 12-16px. The "W" letterform creates a subtle thematic resonance with "Wavium."

**Font size scale (recommended):**
```typescript
const typography = {
  display: { fontFamily: 'Cinzel_700Bold', fontSize: 32, letterSpacing: 4, textTransform: 'uppercase' },
  heading: { fontFamily: 'Cinzel_400Regular', fontSize: 22, letterSpacing: 2 },
  affirmation: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 24, lineHeight: 36 },
  affirmationItalic: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 22, lineHeight: 34 },
  body: { fontFamily: 'Raleway_400Regular', fontSize: 15, lineHeight: 22 },
  label: { fontFamily: 'Raleway_500Medium', fontSize: 12, letterSpacing: 0.5 },
};
```

### 5. Performance-Optimized Animation Architecture

**Thread allocation:**
- All Reanimated animations → UI thread via worklets (default behavior in Reanimated 4)
- Skia canvas drawing → GPU thread, independent of JS and UI threads
- expo-blur → native platform implementation, no JS involvement

**Rules to maintain 60fps on mid-range Android:**

1. **Limit simultaneous BlurViews to 2-3 per screen.** Blur is GPU-intensive. More than 3 overlapping blur regions on Android can cause frame drops. On THE VOID screen, use 1 BlurView max (the player controls overlay).

2. **Never animate expo-blur `intensity` continuously.** Animating blur intensity triggers GPU recalculation every frame. Acceptable for one-shot transitions (fade-in); unacceptable for looping animations.

3. **Use `useAnimatedStyle` not `useState` for any animation value.** `useState` triggers React re-renders; `useAnimatedStyle` mutates native props directly on the UI thread.

4. **Skia Canvas isolation.** Each `<Canvas>` is a GPU surface. Avoid nesting Canvas components or placing Canvas inside FlatList items. For Mindi's glow sync to audio — update via Reanimated shared value, not re-renders.

5. **`interpolateColors` in Skia derivations.** Run color interpolation inside `useDerivedValue` so it executes on the UI thread, never in a render function.

6. **Test on Android API 29+ (Android 10).** `experimentalBlurMethod="dimezisBlurView"` on expo-blur requires Android API 31 (Android 12) for native RenderEffect-based blur. On API 29-30, it falls back to a software blur that is visually acceptable but heavier. Have a fallback strategy (semi-transparent solid background) for API < 31.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Skia for animated gradients | expo-linear-gradient with useAnimatedProps | Documented Android bug: color animation fails on Android (expo/expo #29408). Skia is more reliable and GPU-accelerated. |
| expo-blur for glassmorphism | @react-native-community/blur | Would be a new native dependency requiring native rebuild. expo-blur already installed and SDK-compatible. Community blur has better Android support but is not worth the dependency addition when expo-blur is already present. |
| Cinzel + Cormorant Garamond | System fonts | System fonts lack drama. San Francisco / Roboto reads as utility app, not sacred portal. The project brief explicitly calls out typography as a requirement. |
| Cinzel + Cormorant Garamond | Playfair Display | Playfair Display is the standard "premium" choice — overused in wellness apps. Cinzel has more ceremonial weight and less generic brand recognition. |
| Reanimated 4 worklets | react-native-animated (built-in) | Built-in Animated runs on JS thread; blocks on JS thread congestion. Reanimated 4 worklets are independent. For a visuals-first app with simultaneous blur + animation, Reanimated is non-negotiable. |
| BlurMask (Skia) for in-canvas glows | box-shadow | React Native's shadow is platform-inconsistent and can't achieve soft, multi-layer glow. Skia BlurMask renders identically on iOS and Android. |
| expo-font config plugin | useFonts hook | Config plugin embeds fonts at build time — zero loading delay, no splash screen flash. useFonts is async and requires loading state management. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Animating expo-linear-gradient colors via useAnimatedProps | Known Android bug (expo/expo #29408): colors fail to animate or produce wrong values on Android. iOS-only at best. | Skia LinearGradient with useDerivedValue + interpolateColors |
| Skia BackdropBlur over native views | BackdropBlur only blurs content declared within the same Canvas. Cannot blur native React Native views underneath it. | expo-blur BlurView for native view glassmorphism |
| More than 3 BlurViews per screen on Android | Performance degradation. Dimezis BlurView V3 is better but still GPU-intensive. Stacked blurs compound the cost. | Limit to 1-2 BlurViews; use semi-transparent backgrounds elsewhere |
| useState for animation-driven values | Triggers React re-render on every frame → JS thread load → jank | useSharedValue + useAnimatedStyle |
| Variable fonts | Incomplete support across Android versions. Can cause rendering inconsistencies. | Static font files (Regular, Bold, Italic as separate files) |
| react-native-linear-gradient (community) | Not needed — expo-linear-gradient already installed and SDK-aligned. Using both creates confusion. | expo-linear-gradient (already installed) |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| expo-blur@15.0.8 | SDK 54 / RN 0.81 | expo-blur 15.x is the SDK 54 release | Android requires experimentalBlurMethod prop |
| expo-linear-gradient@15.0.8 | SDK 54 / RN 0.81 | Confirmed compatible | Static use reliable; animated colors → use Skia |
| react-native-reanimated@4.1.1 | Expo SDK 54 | Requires New Architecture (default in SDK 54) | Do NOT add to babel.config.js in Expo projects — babel-preset-expo handles this |
| @shopify/react-native-skia@2.2.12 | Reanimated 3+ / Fabric | Works with Reanimated 4.x shared values directly | Pass shared values as direct props, no createAnimatedComponent |
| @expo-google-fonts/* | expo-font any SDK 54 version | expo-font ships with SDK; google-fonts packages are standalone | Use npx expo install to get SDK-aligned expo-font version |

---

## Stack Patterns by Variant

**If implementing glassmorphism on a screen with scrolling content:**
- Do NOT wrap the BlurView around the scroll container
- Use BlurView only for fixed-position overlays (headers, player controls, modals)
- Because BlurView does not update when content beneath it changes during scroll

**If implementing glassmorphism on Android API < 31:**
- Use `backgroundColor: 'rgba(20, 10, 50, 0.65)'` as BlurView replacement
- Add `borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'` for glass edge illusion
- Because Dimezis BlurView only has native RenderEffect on API 31+; older fallback is visually acceptable but heavier

**If implementing the Mindi glow pulse synced to audio:**
- Store playback amplitude as a Reanimated shared value
- Drive Skia BlurMask blur radius and Canvas opacity via useDerivedValue
- Never setState from audio callback → no re-renders

**If implementing the affirmation ceremony (one-by-one reveal):**
- Use Reanimated FadeIn layout animation + staggered withDelay
- Cormorant Garamond Italic for each affirmation line
- opacity: 0 → 1 with withTiming(1, { duration: 800 }) and withDelay(index * 300)

---

## Sources

- `wavium/package.json` — exact installed versions (verified 2026-02-24)
- [expo-blur changelog (unpkg)](https://app.unpkg.com/expo-blur@15.0.6/files/CHANGELOG.md) — version 15.0.8 current, 15.0.0 Android fix verified — HIGH confidence
- [Expo BlurView docs](https://docs.expo.dev/versions/latest/sdk/blur-view/) — experimentalBlurMethod, intensity animation, borderRadius workaround — HIGH confidence
- [Expo Fonts docs](https://docs.expo.dev/develop/user-interface/fonts/) — config plugin approach, OTF preference — HIGH confidence
- [expo/google-fonts GALLERY.md](https://github.com/expo/google-fonts/blob/main/GALLERY.md) — Cinzel, Cormorant Garamond, Raleway confirmed available — HIGH confidence
- [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54) — Reanimated 4.x ships with SDK 54; New Architecture required — HIGH confidence
- [React Native Skia animations docs](https://shopify.github.io/react-native-skia/docs/animations/animations/) — Reanimated v3+ required, shared values as direct props, interpolateColors from Skia — HIGH confidence
- [Skia gradients docs](https://shopify.github.io/react-native-skia/docs/shaders/gradients/) — LinearGradient, vec, color handling — HIGH confidence
- [expo/expo #29408](https://github.com/expo/expo/issues/29408) — Android animated gradient colors bug confirmed — HIGH confidence (official issue tracker)
- [WebSearch: Skia 2.4.21 latest, Fabric reconciler 50%/200% perf gains](https://www.npmjs.com/package/@shopify/react-native-skia) — MEDIUM confidence (WebSearch + official Shopify engineering posts)
- [Cinzel + Cormorant Garamond pairing](https://daveyandkrista.com/font-pairings-cormorant-garamond-raleway/) — MEDIUM confidence (design community consensus, not engineering docs)
- [React Native Reanimated 3/4 performance guide](https://dev.to/eragelagz/react-native-reanimated-3-the-ultimate-guide-to-high-performance-animations-in-2025-4ae4) — MEDIUM confidence (verified by official Reanimated architecture docs)

---

*Stack research for: Wavium premium UI/UX aesthetic overhaul (React Native Expo 54)*
*Researched: 2026-02-24*
