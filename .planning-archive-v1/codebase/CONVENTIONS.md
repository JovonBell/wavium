# Coding Conventions

**Analysis Date:** 2026-02-02

## Naming Patterns

**Files:**
- React Native components: PascalCase with `.tsx` extension
  - Example: `HapticButton.tsx`, `BreathingCircle.tsx`, `MindiRenderer.tsx`
- Services and utilities: camelCase with `.ts` extension
  - Example: `groq_service.py`, `client.ts`, `AudioSystem.ts`
- Store/hook files: camelCase with `use` prefix
  - Example: `useMindiStore.ts`, `useThemeStore.ts`
- Theme/config files: camelCase
  - Example: `colors.ts`, `spacing.ts`, `animations.ts`

**Functions:**
- React components: PascalCase (function names match file names)
  - Example: `export default function HapticButton() {...}`
- Utility functions: camelCase
  - Example: `generateAffirmations()`, `generateAudio()`, `handleStatusUpdate()`
- Private functions: camelCase with underscore prefix or private class methods
  - Example: `private async configureAudioMode()`, `_startSimulatedLevels()`
- Hook functions: camelCase with `use` prefix
  - Example: `useApi()`, `useGeneration()`, `useProcessIntention()`

**Variables:**
- Constants (React Native): camelCase
  - Example: `TIMEOUT`, `BASE`, `SCREEN_WIDTH`, `PHASE_MESSAGES`
- State/props: camelCase
  - Example: `circleScale`, `glowIntensity`, `isPlaying`, `isBuffering`
- Boolean variables/states: prefixed with `is` or `has`
  - Example: `isLoaded`, `isPlaying`, `isBuffering`, `isComplete`, `hasError`
- Private class fields: camelCase with `private` modifier
  - Example: `private sound: Audio.Sound | null`

**Types:**
- Interface names: PascalCase with suffix
  - Example: `interface HapticButtonProps`, `interface AudioState`, `interface MindiStoreState`
- Union types: PascalCase
  - Example: `type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest'`
  - Example: `type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'`
- Record/object type keys: camelCase
  - Example: `Record<TimeOfDay, ThemeColors>`

## Code Style

**Formatting:**
- No explicit linter/prettier config found (defaults to Expo standards)
- 2-space indentation (implicit from code samples)
- Semicolons required
- Quotes: single or double (mixed in codebase, but single quotes preferred in TS files)
- Line length: Appears reasonable, no extreme line wrapping

**TypeScript:**
- Strict mode enabled in `tsconfig.json`: `"strict": true`
- All React components typed with props interfaces
- Generic types used for API responses: `ApiResponse<T>`, `useApi<T>()`
- Explicit return types on functions
- No `any` types found in core codebase

**React Native patterns:**
- Functional components with hooks preferred
- Animated components: Use `Animated.createAnimatedComponent()` for custom animations
- StyleSheet.create() for all style definitions
- useCallback() used for memoized callbacks to prevent re-renders
- useSharedValue() from react-native-reanimated for animated values

## Import Organization

**Order:**
1. React/React Native core imports
   ```typescript
   import React, { useEffect, useState, useCallback } from 'react';
   import { View, StyleSheet, Text, Dimensions } from 'react-native';
   ```

2. Third-party libraries
   ```typescript
   import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
   import * as Haptics from 'expo-haptics';
   import { create } from 'zustand';
   ```

3. Internal imports (relative paths)
   ```typescript
   import { useThemeStore } from '../../stores/useThemeStore';
   import { typography } from '../../theme/typography';
   import { spacing, borderRadius } from '../../theme/spacing';
   ```

**Path Aliases:**
- Not explicitly configured; relative paths used throughout
- Common pattern: `../../` for going up directories to access stores, theme, services

## Error Handling

**Patterns:**
- API client: Returns structured `ApiResponse<T>` with `data`, `error`, and `status` fields
  - Location: `src/api/client.ts` (lines 22-26)
  - Example: Check `response.error` before processing `response.data`

- Async operations: Try/catch blocks with console.error for debugging
  - Example in `src/systems/AudioSystem.ts` (lines 64-84):
    ```typescript
    try {
      const { sound } = await Audio.Sound.createAsync(...);
      this.sound = sound;
      return true;
    } catch (error) {
      console.error('Error loading audio:', error);
      return false;
    }
    ```

- Hooks: State for loading, error, and data
  - Pattern: `const { data, loading, error, execute } = useApi(apiCall)`
  - Location: `src/api/hooks.ts` (lines 11-42)

- WebSocket errors: Captured in `onerror` handler with fallback UI state
  - Location: `src/api/client.ts` (lines 176-181)

- Graceful degradation: Many operations return boolean success/failure
  - Example: `audio.load()` returns `Promise<boolean>` (line 64)

## Logging

**Framework:** Native `console` object (console.log, console.error)

**Patterns:**
- Errors logged with descriptive context: `console.error('Error loading audio:', error)`
- Used in catch blocks and error handlers
- No centralized logging service found

**When to log:**
- Error conditions: `console.error()` in catch blocks
- Debug info: Setup/config completions (e.g., line 48 in AudioSystem.ts)
- WebSocket message parsing errors: `console.error('WebSocket message parse error:', e)`

## Comments

**When to Comment:**
- File headers: Describe purpose and file function
  ```typescript
  /**
   * WAVIUM - API Client
   * Backend communication layer
   */
  ```

- Complex algorithms: Breathing circle animation phases have inline comments
  - `// INHALE`, `// HOLD`, `// EXHALE` (BreathingCircle.tsx lines 104, 117, 130)

- Configuration sections: Inline comments for configuration values
  - Line 9 in `client.ts`: `// Use your machine's IP for physical devices to connect`

- TODO/FIXME: One instance found (PlayerControls.tsx): `// TODO: Implement download functionality`

**JSDoc/TSDoc:**
- Minimal usage in current codebase
- Service functions have docstrings: `"""Generate personalized affirmations based on user's intention"""`
- Python backend uses docstrings (PEP 257 style)
- TypeScript mostly relies on type inference and interface signatures

## Function Design

**Size:**
- Most functions 20-50 lines
- Longer functions: AudioSystem methods up to 100+ lines (justified by initialization logic)
- Short hooks: API hooks typically 30-40 lines

**Parameters:**
- Props interfaces preferred over inline object parameters
- Example: `HapticButtonProps` interface (lines 29-41)
- Generic type parameters for reusable hooks: `useApi<T>()`

**Return Values:**
- Explicit return type annotations on all functions
- Component functions return JSX.Element (implicit)
- Hooks return object with multiple values: `{ data, loading, error, execute, reset }`
- Service functions return typed objects or Promise<boolean>

**Async patterns:**
- `async/await` preferred throughout
- No callback chains; promises chained with `.then()` avoided
- WebSocket callback-based API wrapped with handlers (not promises)

## Module Design

**Exports:**
- Named exports for utilities and types
- Default exports for React components
  - Example: `export default function HapticButton(...) {...}`
- Singleton pattern for API and system objects
  - `export const api = new WaviumApiClient();`
  - `export const audio = new AudioSystem();`
- Type exports: `export type { WaviumApiClient };`, `export interface ApiResponse<T>`

**Barrel Files:**
- Index files used for re-exporting components and utilities
- Location: `src/components/ui/index.ts`, `src/components/ceremony/index.ts`
- Example: `src/components/ui/index.ts` exports all UI components

**File organization:**
- `/api` - API client, hooks, types
- `/components` - UI components organized by feature (ceremony, mindi, ui, void)
- `/stores` - Zustand stores
- `/systems` - Singleton system classes (Audio, Haptic, Offline)
- `/theme` - Design tokens (colors, spacing, typography, animations)
- `/services` - Business logic services (groq, speech)

---

*Convention analysis: 2026-02-02*
