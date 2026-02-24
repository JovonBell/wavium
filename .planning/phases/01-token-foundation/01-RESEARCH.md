# Phase 1: Token Foundation - Research

**Researched:** 2026-02-24
**Domain:** React Native Expo 54 — design token system extension, typography with expo-font config plugin, and Skia-consuming theme architecture
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TYPO-01 | App uses Cinzel display font for screen titles and hero text | expo-font config plugin bundles Cinzel at build time; @expo-google-fonts/cinzel provides `Cinzel_400Regular` and `Cinzel_700Bold` named exports |
| TYPO-02 | App uses Cormorant Garamond for affirmation text and editorial content (20px+) | @expo-google-fonts/cormorant-garamond provides `CormorantGaramond_400Regular`, `CormorantGaramond_400Regular_Italic`; add to typography.ts as `affirmation` variant |
| TYPO-03 | App uses Raleway for body text, UI labels, and navigation elements | @expo-google-fonts/raleway provides `Raleway_400Regular`, `Raleway_500Medium`; replace default fontWeight patterns in component textStyles |
| TYPO-04 | Typographic scale systemized with 4 sizes: display (~32px), heading (~22px), body (~15px), label (~12px) | Existing `fontSizes` object extended; `textStyles` map updated to reference named font families instead of fontWeight strings |
| TYPO-05 | Off-white text hierarchy applied globally — body rgba(255,255,255,0.82), captions 0.55, hero #FFFFFF | ThemeColors already has `textPrimary`/`textSecondary`/`textMuted` — update values across all 4 themes to the rgba hierarchy |
| TYPO-06 | Font loading uses expo-font config plugin (build-time embedding, zero font flash on cold start) | app.json `plugins` array extended with expo-font config; `_layout.tsx` already has `SplashScreen.preventAutoHideAsync()` at module level — requires font-ready guard before `SplashScreen.hideAsync()` |
| COLR-01 | Gold gradient palette (#F7C873 → #D4A017 → #A0720C) replaces flat orange on all primary accents | New `goldScale` constant added to colors.ts; `primaryGradient` token in `ThemeColors` interface carries the 3-stop tuple |
| COLR-02 | Near-black background with purple tint (#0A0A12 range) replaces current background | Update all 4 theme `background` values; night theme currently `#050510` (too dark, no purple tint); morning `#1a1520` closer but needs darkening |
| COLR-03 | Purple depth spectrum refined with richer gradient stops across all 4 time-of-day themes | Update `primaryGradient` values per theme — each theme gets distinct purple-spectrum stops reflecting its time character |
| COLR-04 | ThemeColors interface extended with `primaryGradient`, `glassOverlay`, `glassBorder` tokens | Add 3 new keys to `ThemeColors` interface in colors.ts; add values to all 4 theme objects |
| COLR-05 | All 4 time-of-day themes updated with gradient token values | All 4 theme constant objects (morningTheme, afternoonTheme, eveningTheme, nightTheme) updated |
| COLR-06 | Hardcoded hex colors in Skia components (NebulaRenderer, TimeShiftingBackground) replaced with theme tokens | NebulaRenderer has `nebulaColors` useMemo with hardcoded hex; TimeShiftingBackground has hardcoded `GRADIENTS` constant — both must pull from `colors.primaryGradient` and new theme tokens |
</phase_requirements>

---

## Summary

Phase 1 is an extension and correction of an already-well-structured system. The `src/theme/` directory contains `colors.ts`, `typography.ts`, `spacing.ts`, and `animations.ts` with a Zustand store (`useThemeStore`) consuming them. The architecture is correct. The gap is that the token set is incomplete for the premium aesthetic overhaul: `ThemeColors` lacks gradient tokens, background values are not dark/purple enough, and typography references no custom font families — it is entirely system-font-driven.

The expo-font config plugin is available (v14.0.11, already present in node_modules via Expo SDK 54) but not yet registered in `app.json`. The three Google Fonts packages (`@expo-google-fonts/cinzel`, `@expo-google-fonts/cormorant-garamond`, `@expo-google-fonts/raleway`) are not yet installed. The `_layout.tsx` root file already has `SplashScreen.preventAutoHideAsync()` called at module level — the correct pattern — but it does not guard on font loading because no fonts are currently loaded. Adding the expo-font config plugin instead of `useFonts()` means fonts embed at build time and require no runtime guard changes.

The two Skia components that consume hardcoded hex values — `NebulaRenderer` and `TimeShiftingBackground` — both read from `useThemeStore` already, making the COLR-06 refactor straightforward: delete the local hardcoded color constants and pull the equivalent values from `colors.primaryGradient` (new token) via the store. The `ThemeColors` interface extension and theme object updates are the prerequisite that makes this possible.

**Primary recommendation:** Extend `ThemeColors` interface first, fill in all 4 theme objects with new tokens, then update `typography.ts` with font families and text styles, then register the config plugin and install font packages, then do the COLR-06 Skia component token cleanup as the final verification step.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-font | 14.0.11 (in node_modules via SDK 54) | Build-time font embedding via config plugin | Config plugin approach embeds fonts before JS starts — architecturally eliminates font flash. Already in node_modules, just needs app.json registration. |
| @shopify/react-native-skia | 2.2.12 (installed) | Skia components consume color tokens as string props | `NebulaRenderer` and `TimeShiftingBackground` already import from `useThemeStore` — token strings flow directly to Skia color props |
| zustand | ^5.0.9 (installed) | `useThemeStore` distributes resolved theme to all components | Stable, no changes needed to store structure — only token values change |

### Supporting (new installs required)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @expo-google-fonts/cinzel | latest | Cinzel_400Regular, Cinzel_700Bold for display/hero text | Screen titles, "THE VOID" hero label, section headers — 22px+ only |
| @expo-google-fonts/cormorant-garamond | latest | CormorantGaramond_400Regular, CormorantGaramond_400Regular_Italic for affirmations | Affirmation text, editorial subtitles — 20px+ only, not for UI labels |
| @expo-google-fonts/raleway | latest | Raleway_400Regular, Raleway_500Medium for body/UI | Labels, nav items, body text, buttons — replaces fontWeight-only references |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-font config plugin | useFonts() runtime hook | useFonts is async: requires loading state, can flash system font on cold start. Config plugin has zero runtime cost. Use config plugin. |
| @expo-google-fonts packages | Manual .otf files in assets/fonts/ | Manual approach requires maintaining font files in repo. @expo-google-fonts packages are cleaner for development. Config plugin can use either. |
| Cinzel (display) | Playfair Display | Playfair is overused in wellness apps. Cinzel has Roman-inscription gravitas that reads as ceremonial rather than generic premium. |

**Installation:**
```bash
npx expo install @expo-google-fonts/cinzel @expo-google-fonts/cormorant-garamond @expo-google-fonts/raleway
```

Note: `expo-font` is already in node_modules (14.0.11) — `npx expo install` resolves the SDK-aligned version automatically.

---

## Architecture Patterns

### Recommended Project Structure

No structural changes needed. Phase 1 modifies existing files only:

```
wavium/
├── app.json                          # ADD: expo-font config plugin registration
├── app/_layout.tsx                   # VERIFY: SplashScreen guard remains correct
└── src/
    └── theme/
        ├── colors.ts                 # EXTEND: ThemeColors interface + 4 theme objects
        ├── typography.ts             # EXTEND: fontFamilies constant + new textStyles
        └── index.ts                  # ADD: export fontFamilies
```

And two component files for COLR-06:
```
src/components/
├── ui/TimeShiftingBackground.tsx     # REFACTOR: hardcoded GRADIENTS → colors.primaryGradient
└── void/NebulaRenderer.tsx           # REFACTOR: hardcoded nebulaColors → theme tokens
```

### Pattern 1: ThemeColors Interface Extension

**What:** Add three new required keys to `ThemeColors` and populate them in all 4 theme objects.

**When to use:** When any component needs gradient stops, glass overlay tint, or glass border — they pull from the resolved `colors` object, not from hardcoded hex.

**Example:**
```typescript
// src/theme/colors.ts — extend the interface
export interface ThemeColors {
  // ... existing keys ...

  // NEW: Gradient tokens (COLR-01, COLR-04)
  primaryGradient: [string, string, string];  // 3-stop tuple for LinearGradient + Skia
  glassOverlay: string;                        // rgba — colored surface tint for glass cards
  glassBorder: string;                         // rgba — glass edge highlight

  // Text hierarchy update (TYPO-05) is handled by updating existing textPrimary/textSecondary/textMuted values
}

// Gold scale constant (COLR-01)
export const goldScale = {
  light: '#F7C873',   // warm gold — gradient start
  mid:   '#D4A017',   // primary gold — gradient middle
  deep:  '#A0720C',   // deep amber — gradient end
} as const;
```

**Theme object values for all 4 themes:**
```typescript
// Night theme (9pm-5am) — deepest purple, cosmic
export const nightTheme: ThemeColors = {
  background: '#0A0A12',          // COLR-02: near-black with purple tint
  backgroundAlt: '#0D0D18',
  surface: '#12121F',
  // ... existing keys ...

  // NEW tokens (COLR-04, COLR-05)
  primaryGradient: ['#6366f1', '#8b5cf6', '#a78bfa'],  // indigo → violet → lavender
  glassOverlay: 'rgba(99, 102, 241, 0.08)',             // indigo tint
  glassBorder: 'rgba(167, 139, 250, 0.20)',             // lavender edge

  // Text hierarchy (TYPO-05)
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.82)',
  textMuted: 'rgba(255, 255, 255, 0.55)',
};

// Morning theme (5am-12pm) — warm awakening, gold primary
export const morningTheme: ThemeColors = {
  background: '#0A0A0F',          // COLR-02: near-black, warm undertone
  // ...
  primaryGradient: ['#F7C873', '#D4A017', '#A0720C'],  // gold spectrum (COLR-01)
  glassOverlay: 'rgba(247, 200, 115, 0.08)',
  glassBorder: 'rgba(212, 160, 23, 0.20)',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.82)',
  textMuted: 'rgba(255, 255, 255, 0.55)',
};

// Afternoon theme (12pm-5pm) — violet clarity
export const afternoonTheme: ThemeColors = {
  background: '#0A0A12',
  // ...
  primaryGradient: ['#a78bfa', '#8b5cf6', '#7c3aed'],  // violet gradient
  glassOverlay: 'rgba(167, 139, 250, 0.08)',
  glassBorder: 'rgba(139, 92, 246, 0.20)',
  // ...
};

// Evening theme (5pm-9pm) — gold hour, warm
export const eveningTheme: ThemeColors = {
  background: '#0A0A0E',
  // ...
  primaryGradient: ['#F7C873', '#D4A017', '#A0720C'],  // gold (same as morning)
  glassOverlay: 'rgba(245, 158, 11, 0.08)',
  glassBorder: 'rgba(251, 191, 36, 0.20)',
  // ...
};
```

### Pattern 2: Font Family Constants in typography.ts

**What:** Add a `fontFamilies` constant with the exact names of loaded font variants. Text styles reference these names — never use `fontWeight` to approximate a bold variant of a named font.

**When to use:** Any text that should render in a custom font. Body/UI text using Raleway, display text using Cinzel, affirmations using Cormorant Garamond.

**Example:**
```typescript
// src/theme/typography.ts — add at top of file

export const fontFamilies = {
  // Display — Roman inscription gravity (TYPO-01)
  displayRegular: 'Cinzel_400Regular',
  displayBold: 'Cinzel_700Bold',

  // Editorial serif — luxury affirmations (TYPO-02)
  editorialRegular: 'CormorantGaramond_400Regular',
  editorialItalic: 'CormorantGaramond_400Regular_Italic',

  // Geometric sans — body and UI (TYPO-03)
  bodyRegular: 'Raleway_400Regular',
  bodyMedium: 'Raleway_500Medium',
} as const;

// 4-size scale (TYPO-04)
// display ~32px, heading ~22px, body ~15px, label ~12px
export const textStyles: Record<string, TextStyle> = {
  // Display variants — Cinzel
  displayHero: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 32,
    letterSpacing: 4,
    lineHeight: 38,
    // Note: textTransform: 'uppercase' applied at component level for flexibility
  },
  displayHeading: {
    fontFamily: fontFamilies.displayRegular,
    fontSize: 22,
    letterSpacing: 2,
    lineHeight: 28,
  },

  // Affirmation variants — Cormorant Garamond
  affirmation: {
    fontFamily: fontFamilies.editorialRegular,
    fontSize: 24,
    lineHeight: 36,
  },
  affirmationItalic: {
    fontFamily: fontFamilies.editorialItalic,
    fontSize: 22,
    lineHeight: 34,
    fontStyle: 'italic',
  },

  // Body variants — Raleway (TYPO-03, TYPO-04)
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 12,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  button: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    letterSpacing: 0.5,
    lineHeight: 20,
  },

  // Keep system-font fallbacks for dense UI (h1/h2/h3) but add Raleway variants
  h1: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 28,
    lineHeight: 34,
  },
  h2: {
    fontFamily: fontFamilies.displayRegular,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 1,
  },
  // ... existing h3/bodyLarge/etc remain for backward compat
};
```

### Pattern 3: expo-font Config Plugin Registration

**What:** Register fonts in `app.json` so they bundle into the native binary and load before JavaScript starts.

**When to use:** All custom fonts in the app — set up once, fonts are available from frame 0.

**Example:**
```json
// app.json — add expo-font plugin alongside expo-router
{
  "expo": {
    "plugins": [
      "expo-router",
      [
        "expo-font",
        {
          "fonts": [
            "./node_modules/@expo-google-fonts/cinzel/Cinzel_400Regular.ttf",
            "./node_modules/@expo-google-fonts/cinzel/Cinzel_700Bold.ttf",
            "./node_modules/@expo-google-fonts/cormorant-garamond/CormorantGaramond_400Regular.ttf",
            "./node_modules/@expo-google-fonts/cormorant-garamond/CormorantGaramond_400Regular_Italic.ttf",
            "./node_modules/@expo-google-fonts/raleway/Raleway_400Regular.ttf",
            "./node_modules/@expo-google-fonts/raleway/Raleway_500Medium.ttf"
          ]
        }
      ]
    ]
  }
}
```

**Note on font file paths:** After running `npx expo install`, verify the exact `.ttf` filename format inside each package's directory. The `@expo-google-fonts` packages use consistent naming like `Cinzel_400Regular.ttf` — but confirm paths after install.

**Layout file:** `_layout.tsx` already calls `SplashScreen.preventAutoHideAsync()` at module level and calls `SplashScreen.hideAsync()` in a `try/finally` block. With the config plugin approach, no `useFonts` call is needed and no font-ready guard is required — fonts are available immediately. The existing initialization flow is already correct for the config plugin approach.

### Pattern 4: COLR-06 — Skia Token Consumption

**What:** Replace hardcoded color constants in `NebulaRenderer` and `TimeShiftingBackground` with values from `useThemeStore().colors`.

**When to use:** After ThemeColors interface is extended (Pattern 1 complete) and theme objects have `primaryGradient` values.

**NebulaRenderer — before/after:**
```typescript
// BEFORE: hardcoded switch statement
const nebulaColors = useMemo(() => {
  switch (timeOfDay) {
    case 'morning': return { primary: '#ff9f43', secondary: '#ff6b6b', tertiary: '#ffeaa7' };
    // ...
  }
}, [timeOfDay]);

// AFTER: pull from theme tokens
const { colors } = useThemeStore();
// Use colors.primaryGradient for the 3-stop array directly
// For NebulaCloud color props, use the 3 stops as primary/secondary/tertiary:
const [nebulaP, nebulaS, nebulaT] = colors.primaryGradient;
```

**TimeShiftingBackground — before/after:**
```typescript
// BEFORE: local hardcoded constant
const GRADIENTS: Record<TimeOfDay, [string, string, string]> = {
  morning: ['#1a1520', '#2d1f35', '#3d2845'],
  // ...
};
const gradient = GRADIENTS[timeOfDay];

// AFTER: pull from theme token
const { colors } = useThemeStore();
// Use colors.background + backgroundAlt for gradient stops,
// OR add a backgroundGradient token if 3-stop background gradient is needed
// Simpler: colors.primaryGradient controls the accent/orb colors
// Background gradient stops: [colors.background, colors.backgroundAlt, colors.surface]
```

### Anti-Patterns to Avoid

- **Adding fontWeight to named font textStyles:** React Native does not synthesize weights for named fonts. `fontFamily: 'Raleway_400Regular'` with `fontWeight: '700'` will not produce a bold Raleway — it will either fall back to system font (Android) or synthesize an ugly faux-bold (iOS). Use the correct named family constant (`Raleway_500Medium`) instead.
- **Using useFonts() hook alongside the config plugin:** The config plugin embeds fonts at build time making `useFonts` redundant. Using both creates confusion about where font loading happens. Use only the config plugin.
- **Putting `primaryGradient` only on morning/evening (gold themes) and skipping the violet themes:** COLR-01 says gold replaces flat orange on primary accents specifically. COLR-03 requires all 4 themes have richer purple depth. Each theme gets its own `primaryGradient` appropriate to its color character — morning/evening get gold, afternoon/night get violet gradients.
- **Changing `surfaceGlow` values without updating `glassOverlay`:** These serve different purposes. `surfaceGlow` is an existing token that may be used by Skia glow effects. `glassOverlay` is the new glass card tint. Keep both, give them distinct values. Do not conflate them.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Build-time font embedding | Custom Metro config or AsyncStorage font cache | expo-font config plugin | Config plugin hooks into native build; Metro config approaches are fragile and version-sensitive |
| Font file discovery after install | Manually copying .ttf files | Reference paths in `node_modules/@expo-google-fonts/...` directly in app.json | expo-font config plugin handles file resolution — point at node_modules paths, it handles the rest |
| Per-component color constants | Local `const COLORS = { ... }` at top of Skia component files | `useThemeStore().colors.primaryGradient` | Per-component constants break the single-source-of-truth and require hunting when token values change |

**Key insight:** Phase 1 is almost entirely TypeScript type and value work. The token system is already architected correctly. The work is adding missing keys to an existing interface, filling in values for 4 objects, adding constants to an existing file, and registering a config plugin. There is nothing complex enough to warrant custom infrastructure.

---

## Common Pitfalls

### Pitfall 1: Font Flash on Cold Start (TYPO-06)

**What goes wrong:** Fonts load after the splash screen hides, producing a visible snap from system font to display font on the first screen render.

**Why it happens:** `useFonts()` is async. If `SplashScreen.hideAsync()` is called before fonts are ready (or if the expo-font config plugin is not used), the initial render uses the system fallback.

**How to avoid:** Use the expo-font config plugin (not `useFonts()`). Fonts embedded at build time via the config plugin are available from frame 0 — the flash is architecturally impossible. The existing `_layout.tsx` already has `SplashScreen.preventAutoHideAsync()` at module level (correct). With the config plugin, no changes to `_layout.tsx` are needed.

**Warning signs:** Typography "snaps" in development builds after hot reload. On cold start (fresh install, not hot reload), check that the first frame shows the custom font.

### Pitfall 2: Font Variant Missing → Android System Font Bleed-Through

**What goes wrong:** `Raleway_400Regular` is loaded, but `button` text style uses `fontWeight: '600'` — Android renders that as system font (Roboto) because no `Raleway_600SemiBold` was loaded. iOS synthesizes a faux-bold that looks degraded.

**Why it happens:** React Native requires each weight/style variant to be registered separately as a distinct font name. The OS does not auto-map `fontWeight` to font file variants for custom fonts.

**How to avoid:** Load only the weights you will use. For this phase: `Cinzel_400Regular`, `Cinzel_700Bold`, `CormorantGaramond_400Regular`, `CormorantGaramond_400Regular_Italic`, `Raleway_400Regular`, `Raleway_500Medium`. Reference them by name in `fontFamilies` constants. Never combine a named `fontFamily` with a `fontWeight` that doesn't have a matching loaded file.

**Warning signs:** Text looks correct on iOS but renders in system font on Android for certain weights.

### Pitfall 3: Background Colors Too Dark — Purple Tint Lost on Dark Displays

**What goes wrong:** `#0A0A12` looks purple-tinted on calibrated displays but renders as near-black with imperceptible tint on some Android AMOLED screens. The purple depth that differentiates this from pure black is lost.

**Why it happens:** AMOLED panels have high contrast ratios that can crush dark values. A `#0A0A12` background may look identical to `#000000` at typical brightness settings.

**How to avoid:** The `primaryGradient` token in `ThemeColors` lets components add visible purple-tinted ambient orbs, card overlays, and surface colors that reinforce the background tint even if the background value itself is indistinguishable from black on AMOLED. Ensure `surface` and `backgroundAlt` tokens are noticeably lighter than `background` (at least 8 units difference on any channel) so depth layering is visible. Test on a physical Android device at 50% brightness.

**Warning signs:** The home screen looks identical to a default dark-mode app; no cosmic purple quality visible on Android test device.

### Pitfall 4: ThemeColors Interface Change Breaks TypeScript Compilation

**What goes wrong:** Adding required keys to `ThemeColors` interface causes TypeScript errors in every file that has a partial theme object or in test fixtures.

**Why it happens:** TypeScript correctly reports that `morningTheme`, `afternoonTheme`, `eveningTheme`, and `nightTheme` objects don't satisfy the updated interface until all 4 are updated.

**How to avoid:** Update the interface and all 4 theme objects in the same edit. The three objects are in the same file (`colors.ts`) — do them together. TypeScript will report errors during the update; they resolve when all 4 objects have the new keys.

**Warning signs:** `Property 'primaryGradient' is missing in type` TypeScript errors after updating the interface. These are expected and resolve once all 4 theme objects are updated.

### Pitfall 5: COLR-06 Skia Components Still Import Reanimated's interpolateColor

**What goes wrong:** `TimeShiftingBackground.tsx` currently imports `interpolateColor` from `react-native-reanimated`. If a future developer uses this import to animate the `primaryGradient` token values in a Skia component, it will produce wrong colors.

**Why it happens:** Reanimated and Skia use different internal color storage formats. Reanimated's `interpolateColor` produces ARGB integers; Skia expects hex strings or its own format.

**How to avoid:** During COLR-06 work, check `TimeShiftingBackground.tsx` — it already imports `interpolateColor` from Reanimated (line 23). Verify it is not being passed to any Skia `<LinearGradient>` or `<Circle>` color props. Currently it is imported but the Skia canvas uses the `gradient` string array directly (not an interpolated value). Remove the unused `interpolateColor` import as part of COLR-06 cleanup to prevent future misuse.

**Warning signs:** Colors in Skia components appear as wrong hues (channel order swapped) or render black.

---

## Code Examples

### Full ThemeColors Interface (Target State)

```typescript
// src/theme/colors.ts — complete updated interface
export interface ThemeColors {
  // Backgrounds (COLR-02 values updated)
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceGlow: string;

  // Accents (existing — primary flat color remains for non-gradient contexts)
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;

  // NEW: Gradient tokens (COLR-04)
  primaryGradient: [string, string, string];  // LinearGradient + Skia gradient stops
  glassOverlay: string;                        // rgba — glass card surface tint
  glassBorder: string;                         // rgba — glass card edge highlight

  // Mindi (unchanged)
  mindiBase: string;
  mindiGlow: string;
  mindiHighlight: string;

  // Text (TYPO-05 opacity hierarchy)
  textPrimary: string;    // hero text — #FFFFFF
  textSecondary: string;  // body — rgba(255,255,255,0.82)
  textMuted: string;      // captions — rgba(255,255,255,0.55)

  // States (unchanged)
  success: string;
  error: string;
  warning: string;

  // Particles (unchanged)
  particlePrimary: string;
  particleSecondary: string;
}
```

### expo-font Config Plugin in app.json (TYPO-06)

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      [
        "expo-font",
        {
          "fonts": [
            "./node_modules/@expo-google-fonts/cinzel/Cinzel_400Regular.ttf",
            "./node_modules/@expo-google-fonts/cinzel/Cinzel_700Bold.ttf",
            "./node_modules/@expo-google-fonts/cormorant-garamond/CormorantGaramond_400Regular.ttf",
            "./node_modules/@expo-google-fonts/cormorant-garamond/CormorantGaramond_400Regular_Italic.ttf",
            "./node_modules/@expo-google-fonts/raleway/Raleway_400Regular.ttf",
            "./node_modules/@expo-google-fonts/raleway/Raleway_500Medium.ttf"
          ]
        }
      ]
    ]
  }
}
```

### fontFamilies Constants (TYPO-01, TYPO-02, TYPO-03)

```typescript
// src/theme/typography.ts — add before textStyles definition
export const fontFamilies = {
  displayRegular: 'Cinzel_400Regular',
  displayBold: 'Cinzel_700Bold',
  editorialRegular: 'CormorantGaramond_400Regular',
  editorialItalic: 'CormorantGaramond_400Regular_Italic',
  bodyRegular: 'Raleway_400Regular',
  bodyMedium: 'Raleway_500Medium',
} as const;
```

### NebulaRenderer Token Consumption (COLR-06)

```typescript
// src/components/void/NebulaRenderer.tsx — replace nebulaColors useMemo
// REMOVE the switch(timeOfDay) block
// REPLACE with:
const { colors } = useThemeStore();
const [nebulaP, nebulaS, nebulaT] = colors.primaryGradient;

// Then in the clouds array:
const clouds = useMemo(() => [
  { ..., color: nebulaP, ... },
  { ..., color: nebulaS, ... },
  { ..., color: nebulaT, ... },
  { ..., color: nebulaP, ... },
  { ..., color: nebulaS, ... },
], [nebulaP, nebulaS, nebulaT]);
```

### TimeShiftingBackground Token Consumption (COLR-06)

```typescript
// src/components/ui/TimeShiftingBackground.tsx
// REMOVE: const GRADIENTS: Record<TimeOfDay, ...> = { ... }
// REMOVE: const AMBIENT_ORBS: Record<TimeOfDay, ...> = { ... }
// REMOVE: unused interpolateColor import from react-native-reanimated

// REPLACE with:
const { colors } = useThemeStore();

// Background gradient stops from existing color tokens
const gradient: [string, string, string] = [colors.background, colors.backgroundAlt, colors.surface];

// Ambient orb from theme primary (or glassOverlay for the tint effect)
const orbColor = colors.primary;
const orbOpacity = 0.08;

// Use colors.primaryGradient for the accent/nebula-like orb if needed
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useFonts() runtime loading | expo-font config plugin build-time embedding | SDK 52+ (stable in SDK 54) | Zero FOUT — fonts available before first render |
| ThemeColors with flat color tokens only | ThemeColors with gradient tuple tokens | This phase | LinearGradient + Skia can pull from a single source of truth |
| fontWeight string approximating bold | Named font variant constant | This phase | Correct typography on both iOS and Android |
| Hardcoded color constants per Skia component | Theme token consumption via useThemeStore | This phase | COLR-06: single token change propagates to all Skia renderers |

**Deprecated/outdated in this codebase:**
- `interpolateColor` import in `TimeShiftingBackground.tsx`: unused (the Skia canvas uses direct string array, not an interpolated animated value). Remove during COLR-06 cleanup.
- `fontWeight` references in `app/(main)/home.tsx`, `script.tsx`, `tracks.tsx` (hardcoded `fontWeight: '600'`): these are out of scope for Phase 1 (screen-level work is Phase 5), but the typography.ts update establishes the correct named-variant pattern that these screens will adopt in Phase 5.

---

## Open Questions

1. **Exact font file paths after @expo-google-fonts install**
   - What we know: `@expo-google-fonts` packages use consistent naming conventions. The config plugin path is relative to the project root.
   - What's unclear: Whether the installed packages use `.ttf` or `.otf` extensions, and whether italic variants ship as separate files or are included in a variable font.
   - Recommendation: After running `npx expo install @expo-google-fonts/cinzel @expo-google-fonts/cormorant-garamond @expo-google-fonts/raleway`, run `ls node_modules/@expo-google-fonts/cinzel/` to verify exact filenames before writing app.json. The executor should do this verification before writing font paths.

2. **Background color values — purple tint visibility on AMOLED**
   - What we know: `#0A0A12` is the target range for COLR-02. Current night theme is `#050510` (too dark, blue not purple). Current morning theme is `#1a1520` (slightly purple but too light/grey).
   - What's unclear: Whether `#0A0A12` is dark enough to feel "near-black" while retaining enough purple tint to be perceptibly different from pure black on mid-range Android AMOLED.
   - Recommendation: Set `background: '#0A0A12'` for all themes as the base. Use `backgroundAlt: '#0E0E1A'` and `surface: '#141425'` for visible depth layering. Validate on physical Android during implementation.

3. **Gold gradient on non-morning/evening themes (COLR-01 scope)**
   - What we know: COLR-01 says gold replaces flat orange on "all primary accents." Morning and evening themes had orange (`#ff9f43`, `#f59e0b`) as primary — gold is the clear replacement. Afternoon (violet `#a78bfa`) and night (indigo `#6366f1`) had no orange.
   - What's unclear: Whether afternoon/night themes should also get a gold `primaryGradient` (for CTAs) or whether their `primaryGradient` should stay violet/indigo (consistent with their color character).
   - Recommendation: Morning and evening `primaryGradient` = gold (`#F7C873 → #D4A017 → #A0720C`). Afternoon and night `primaryGradient` = violet/indigo spectrum appropriate to their time character. The gold-replacing-orange goal is met for morning and evening; violet themes retain their identity. COLR-05 confirms "all 4 themes updated" — this means all 4 get a `primaryGradient` value, not necessarily the same gold palette.

---

## Sources

### Primary (HIGH confidence)

- `/Users/joshuabellhome/wavium/wavium/src/theme/colors.ts` — direct codebase read, current ThemeColors interface and 4 theme objects
- `/Users/joshuabellhome/wavium/wavium/src/theme/typography.ts` — current typography system (no fontFamilies constant, system fonts only)
- `/Users/joshuabellhome/wavium/wavium/app.json` — current plugin config (expo-router only, no expo-font)
- `/Users/joshuabellhome/wavium/wavium/app/_layout.tsx` — SplashScreen pattern confirmed correct for config plugin approach
- `/Users/joshuabellhome/wavium/wavium/src/components/void/NebulaRenderer.tsx` — hardcoded nebulaColors confirmed
- `/Users/joshuabellhome/wavium/wavium/src/components/ui/TimeShiftingBackground.tsx` — hardcoded GRADIENTS and unused interpolateColor import confirmed
- `/Users/joshuabellhome/wavium/wavium/node_modules/expo-font/` — v14.0.11 confirmed in node_modules (already available)
- `.planning/research/STACK.md` — expo-font config plugin pattern, @expo-google-fonts availability confirmed HIGH
- `.planning/research/ARCHITECTURE.md` — ThemeColors extension pattern, font loading pattern, Skia token consumption pattern
- `.planning/research/PITFALLS.md` — font flash (Pitfall 4), font weight variant (Pitfall 10), Reanimated/Skia color incompatibility (Pitfall 8)
- [Expo Fonts docs](https://docs.expo.dev/develop/user-interface/fonts/) — config plugin approach verified HIGH confidence (referenced in prior research)

### Secondary (MEDIUM confidence)

- [expo/google-fonts GALLERY.md](https://github.com/expo/google-fonts/blob/main/GALLERY.md) — Cinzel, Cormorant Garamond, Raleway availability confirmed (referenced in prior research)
- [React Native Skia animations docs](https://shopify.github.io/react-native-skia/docs/animations/animations/) — SharedValue as direct Skia prop, interpolateColors from Skia (verified in prior research)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already in node_modules or confirmed in expo/google-fonts; no new native dependencies
- Architecture: HIGH — direct codebase analysis confirms current state; extension pattern is TypeScript interface + constant work
- Pitfalls: HIGH — all critical pitfalls (font flash, weight variants, Reanimated/Skia color incompatibility) traced to official docs in prior research; COLR-06 unused import identified from direct code read

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable Expo SDK — 30 days)
