# Codebase Structure

**Analysis Date:** 2026-02-02

## Directory Layout

```
C:\Users\jbell4\Downloads\Wavium\
├── backend/                         # Legacy backend (replaced by wavium/backend)
│   ├── main.py                      # Simple FastAPI server (reference only)
│   ├── services/
│   │   ├── groq_service.py
│   │   └── tts_service.py
│   └── audio_output/                # Audio file output directory
│
├── wavium/                          # Main project monorepo
│   ├── app/                         # Mobile app screens (Expo Router)
│   │   ├── _layout.tsx              # Root layout with splash screen
│   │   ├── (onboarding)/            # Onboarding flow screens
│   │   │   ├── index.tsx            # Onboarding start
│   │   │   ├── intention.tsx
│   │   │   ├── breath.tsx
│   │   │   ├── name-mindi.tsx
│   │   │   ├── void-entry.tsx
│   │   │   └── _layout.tsx
│   │   ├── (main)/                  # Main app screens
│   │   │   ├── home.tsx             # Home screen with library
│   │   │   ├── create.tsx           # Create subliminal flow
│   │   │   ├── script.tsx           # Review affirmations
│   │   │   ├── tracks.tsx           # Select background track
│   │   │   └── _layout.tsx          # Main layout with tab bar
│   │   └── player/
│   │       └── [id].tsx             # Audio player screen
│   │
│   ├── src/                         # Shared source code
│   │   ├── api/                     # Backend communication
│   │   │   ├── client.ts            # API client class
│   │   │   ├── hooks.ts             # React hooks for API calls
│   │   │   └── index.ts
│   │   │
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/                  # Basic UI building blocks
│   │   │   │   ├── GlassmorphicCard.tsx
│   │   │   │   ├── GlowText.tsx
│   │   │   │   ├── HapticButton.tsx
│   │   │   │   ├── LoadingOverlay.tsx
│   │   │   │   ├── SafeContainer.tsx
│   │   │   │   ├── TabBar.tsx
│   │   │   │   ├── TimeShiftingBackground.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── mindi/               # Mindi character animations
│   │   │   │   ├── MindiEyes.tsx
│   │   │   │   ├── MindiGlow.tsx
│   │   │   │   ├── MindiParticles.tsx
│   │   │   │   ├── MindiRenderer.tsx
│   │   │   │   ├── MindiSpeech.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── ceremony/            # Onboarding animation components
│   │   │   │   ├── BreathingCircle.tsx
│   │   │   │   ├── IntentionAbsorber.tsx
│   │   │   │   ├── LightCoalescing.tsx
│   │   │   │   ├── VoidPortal.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── void/                # Player and effects components
│   │   │   │   ├── AffirmationSpirals.tsx
│   │   │   │   ├── NebulaRenderer.tsx
│   │   │   │   ├── ParallaxLayer.tsx
│   │   │   │   ├── PlayerControls.tsx
│   │   │   │   ├── StarField.tsx
│   │   │   │   ├── VoidContainer.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── audio/               # Audio-specific components
│   │   │       └── (empty - for future use)
│   │   │
│   │   ├── stores/                  # Zustand state management
│   │   │   ├── useMindiStore.ts     # User identity, creation flow, library
│   │   │   └── useThemeStore.ts     # Theme and time-of-day settings
│   │   │
│   │   ├── services/                # Business logic services
│   │   │   └── groq.ts              # Groq LLM affirmation generation
│   │   │
│   │   ├── systems/                 # Encapsulated systems
│   │   │   ├── AudioSystem.ts       # Audio playback and visualization
│   │   │   ├── HapticSystem.ts      # Haptic feedback
│   │   │   ├── OfflineSystem.ts     # Offline handling
│   │   │   ├── index.ts
│   │   │   └── evolution/           # Mindi evolution system (empty)
│   │   │
│   │   ├── theme/                   # Design tokens and styling
│   │   │   ├── colors.ts            # Color definitions by time-of-day
│   │   │   ├── typography.ts        # Text styles
│   │   │   └── spacing.ts           # Layout spacing constants
│   │   │
│   │   └── utils/                   # Utility functions (empty)
│   │
│   ├── backend/                     # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py              # FastAPI app setup and routes
│   │   │   ├── api/
│   │   │   │   └── routes/
│   │   │   │       ├── intentions.py       # Process intentions → affirmations
│   │   │   │       ├── generation.py       # Voice and background options
│   │   │   │       ├── library.py          # Manage saved subliminals
│   │   │   │       ├── sessions.py         # Listen history and XP tracking
│   │   │   │       └── evolution.py        # Mindi progression system
│   │   │   ├── core/
│   │   │   │   └── config.py        # Environment configuration
│   │   │   ├── models/              # Database models (if Supabase used)
│   │   │   └── services/
│   │   │       └── audio_pipeline.py        # Multi-stage audio generation
│   │   └── requirements.txt         # Python dependencies
│   │
│   ├── assets/                      # Static assets
│   │   ├── audio/                   # Ambient background tracks
│   │   │   ├── backgrounds/
│   │   │   └── ui/                  # UI sound effects
│   │   ├── images/
│   │   │   ├── icon.png
│   │   │   ├── splash-icon.png
│   │   │   ├── adaptive-icon.png
│   │   │   └── particles/           # Particle textures
│   │   └── shaders/                 # GLSL shaders for effects
│   │
│   ├── app.json                     # Expo configuration
│   ├── package.json                 # Node dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   └── index.ts                     # Entry point marker
│
├── .planning/                       # GSD planning directory
│   └── codebase/                    # Architecture documentation
│
└── .claude/                         # Claude IDE settings
```

## Directory Purposes

**app/ (Expo Router screens):**
- Purpose: Mobile app screen components with routing
- Contains: Layout files and screen components
- Key files: Root layout (`_layout.tsx`), onboarding flow, main app screens, player

**src/api/:**
- Purpose: Backend communication layer
- Contains: API client class, request/response types, React hooks
- Key files: `client.ts` (WaviumApiClient singleton), `hooks.ts` (useApi, useGeneration, useLibrary, etc.)

**src/components/:**
- Purpose: Reusable UI and visual components organized by domain
- Contains: Four categories: `ui/` (basic components), `mindi/` (character), `ceremony/` (onboarding effects), `void/` (player effects)
- Key files: All export via barrel files (index.ts)

**src/stores/:**
- Purpose: Persistent local state management
- Contains: Zustand stores with AsyncStorage persistence
- Key files: `useMindiStore.ts` (identity, creation, library), `useThemeStore.ts` (theming)

**src/systems/:**
- Purpose: Encapsulated functionality for domain systems
- Contains: Singleton classes with React hooks
- Key files: `AudioSystem.ts` (playback and visualization), `HapticSystem.ts`, `OfflineSystem.ts`

**src/theme/:**
- Purpose: Design tokens and styling constants
- Contains: Color schemes by time-of-day, typography styles, spacing values
- Key files: `colors.ts`, `typography.ts`, `spacing.ts`

**backend/app/api/routes/:**
- Purpose: Request handlers organized by feature domain
- Contains: FastAPI route handlers with Pydantic models
- Key files: `intentions.py` (affirmation generation), `generation.py` (voice/background), `library.py` (saved subliminals), `sessions.py` (listening stats), `evolution.py` (Mindi state)

**backend/app/services/:**
- Purpose: Business logic and external service integration
- Contains: AudioPipeline class with multi-stage audio generation
- Key files: `audio_pipeline.py` (5-stage workflow)

**backend/app/core/:**
- Purpose: Application configuration
- Contains: Settings loaded from environment variables
- Key files: `config.py` (Settings class)

**assets/:**
- Purpose: Static media assets
- Contains: Audio backgrounds, UI images, particle textures, shaders
- Key files: Platform icons and splash screens

## Key File Locations

**Entry Points:**
- `C:\Users\jbell4\Downloads\Wavium\wavium\app\_layout.tsx`: Mobile app root, initializes theme/store, renders navigation
- `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\main.py`: Backend API server initialization

**Configuration:**
- `C:\Users\jbell4\Downloads\Wavium\wavium\app.json`: Expo app metadata
- `C:\Users\jbell4\Downloads\Wavium\wavium\package.json`: Node.js dependencies
- `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\core\config.py`: Backend environment variables
- `C:\Users\jbell4\Downloads\Wavium\wavium\tsconfig.json`: TypeScript configuration (extends Expo base)

**Core Logic:**
- `C:\Users\jbell4\Downloads\Wavium\wavium\src\api\client.ts`: API client with all backend endpoints
- `C:\Users\jbell4\Downloads\Wavium\wavium\src\stores\useMindiStore.ts`: Main app state (identity, library, creation)
- `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\services\audio_pipeline.py`: Audio generation workflow
- `C:\Users\jbell4\Downloads\Wavium\wavium\src\systems\AudioSystem.ts`: Audio playback management

**Testing:**
- No test files present in codebase

## Naming Conventions

**Files:**
- Screen components: `[screen-name].tsx` (e.g., `home.tsx`, `create.tsx`)
- Reusable components: `PascalCase.tsx` (e.g., `MindiRenderer.tsx`, `GlassmorphicCard.tsx`)
- Stores: `use[StoreName].ts` (e.g., `useMindiStore.ts`)
- Systems: `[SystemName]System.ts` (e.g., `AudioSystem.ts`)
- Routes: `[feature-name].py` (e.g., `intentions.py`, `library.py`)
- Configuration: `config.py`, `settings` class pattern

**Directories:**
- Feature directories: lowercase (e.g., `components/`, `stores/`, `api/`)
- Grouped components: lowercase by category (e.g., `mindi/`, `ui/`, `ceremony/`)
- Screen groups: `(name)` pattern for Expo Router groups (e.g., `(main)`, `(onboarding)`)

## Where to Add New Code

**New Feature:**
- Primary code: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\api\routes\[feature].py` (new route file)
- Add hook: `C:\Users\jbell4\Downloads\Wavium\wavium\src\api\hooks.ts` (add useFeature hook)
- Add screen: `C:\Users\jbell4\Downloads\Wavium\wavium\app\(main)\[feature].tsx`
- Tests: Not currently present; would go in `__tests__/` or `.test.ts` files

**New Component/Module:**
- Reusable UI component: `C:\Users\jbell4\Downloads\Wavium\wavium\src\components\[category]\NewComponent.tsx`
- Export in barrel: `C:\Users\jbell4\Downloads\Wavium\wavium\src\components\[category]\index.ts`
- System component: `C:\Users\jbell4\Downloads\Wavium\wavium\src\systems\[SystemName]System.ts`

**Utilities:**
- Shared helpers: `C:\Users\jbell4\Downloads\Wavium\wavium\src\utils\[utility-name].ts`
- Backend utilities: `C:\Users\jbell4\Downloads\Wavium\wavium\backend\app\[module]\utils.py`

**Styling/Theme:**
- New colors: Add to `C:\Users\jbell4\Downloads\Wavium\wavium\src\theme\colors.ts`
- New typography variant: Add to `C:\Users\jbell4\Downloads\Wavium\wavium\src\theme\typography.ts`
- New spacing value: Add to `C:\Users\jbell4\Downloads\Wavium\wavium\src\theme\spacing.ts`

## Special Directories

**.expo/:**
- Purpose: Expo Go configuration and settings
- Generated: Yes
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Installed npm packages
- Generated: Yes
- Committed: No

**backend/ (root level):**
- Purpose: Legacy reference implementation (not used)
- Status: Deprecated in favor of wavium/backend/
- Note: Consider removing or documenting as reference only

**assets/audio/backgrounds/:**
- Purpose: Ambient background tracks for subliminal mixing
- Generated: No
- Format: MP3 files referenced in audio_pipeline.py

**assets/shaders/:**
- Purpose: GLSL shader code for visual effects
- Generated: No
- Status: Exists but implementation details unclear

---

*Structure analysis: 2026-02-02*
