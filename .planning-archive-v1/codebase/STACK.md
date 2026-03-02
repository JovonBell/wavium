# Technology Stack

**Analysis Date:** 2026-02-02

## Languages

**Primary:**
- TypeScript 5.9.2 - Frontend mobile app (React Native/Expo)
- Python 3.11+ - Backend API (FastAPI)
- JavaScript - Build configuration and utilities

**Secondary:**
- JSX/TSX - React component syntax throughout frontend

## Runtime

**Environment:**
- Node.js 18+ - Frontend development and build
- Python 3.11+ - Backend runtime
- Expo SDK 54 - Mobile app runtime (iOS, Android, Web)

**Package Manager:**
- npm - Primary (Wavium project root and frontend `wavium/` subdirectory)
- pip - Python backend dependencies
- Lockfile: `wavium/package-lock.json` present

## Frameworks

**Core:**
- React Native 0.81.5 - Cross-platform mobile framework
- Expo ~54.0.30 - React Native distribution and tooling
- Expo Router 6.0.21 - File-based routing (replaces React Navigation setup)
- React 19.1.0 - Core UI library
- FastAPI 0.109.0 - Python async web framework for backend API

**State Management:**
- Zustand 5.0.9 - Client-side state management (`src/stores/useMindiStore.ts`)
- Jotai 2.16.1 - Lightweight atomic state management (secondary)
- AsyncStorage via @react-native-async-storage/async-storage 2.2.0 - Persistent local state

**Graphics & Animation:**
- @shopify/react-native-skia 2.2.12 - GPU-accelerated graphics for Mindi character animations
- react-native-reanimated 4.1.1 - 60fps performant animations
- expo-linear-gradient 15.0.8 - Linear gradient rendering

**Testing:**
- Not configured (no test framework detected in package.json)

**Build/Dev:**
- Babel 7.x via babel-preset-expo 54.0.9 - JavaScript transpilation
- TypeScript 5.9.2 - Static type checking (strict mode enabled in `wavium/tsconfig.json`)
- Expo CLI - Mobile app bundling and deployment

## Key Dependencies

**Critical:**

**Frontend:**
- expo-av 16.0.8 - Audio playback for subliminal tracks
- expo-file-system 19.0.21 - File system access for audio management
- expo-haptics 15.0.8 - Haptic feedback for user interactions
- expo-sensors 15.0.8 - Gyroscope/accelerometer access for parallax effects
- react-native-gesture-handler 2.28.0 - Advanced gesture recognition
- react-native-screens 4.16.0 - Native screen component optimization
- react-native-safe-area-context 5.6.2 - Safe area handling across devices

**Backend:**
- groq 0.4.2 - Groq LLM API client (affirmation generation)
- edge-tts 6.1.9 - Microsoft TTS engine (text-to-speech generation)
- aiofiles 23.2.1 - Async file I/O for audio processing
- uvicorn 0.27.0 - ASGI server for FastAPI
- python-multipart 0.0.6 - Multipart form data handling
- python-dotenv 1.0.0 - Environment variable loading

**Infrastructure:**
- expo-blur 15.0.8 - Blur effect rendering
- expo-splash-screen 31.0.13 - Splash screen management
- expo-status-bar 3.0.9 - Status bar styling
- @expo/vector-icons 15.0.3 - Icon library
- react-native-mmkv 4.1.0 - High-performance local storage (referenced but may be optional)
- react-native-worklets 0.5.1 - Worklet support for animations

## Configuration

**Environment:**
- Frontend: Development server at `http://{DEV_MACHINE_IP}:8000` (configurable in `wavium/src/api/client.ts`)
- Production: `https://api.wavium.app`
- Backend: Configured via `.env` file in `backend/` directory

**Key configs required:**
- `backend/.env`: GROQ_API_KEY, Supabase credentials, Cloudflare R2 credentials
- `wavium/src/api/client.ts`: DEV_MACHINE_IP hardcoded for development

**Build:**
- `wavium/babel.config.js` - Babel configuration with expo preset and react-native-reanimated plugin
- `wavium/tsconfig.json` - TypeScript strict mode enabled
- `wavium/app.json` - Expo configuration with app metadata, icons, splash screens
- `backend/` - No special build config; runs directly via uvicorn

## Platform Requirements

**Development:**
- Node.js 18+ with npm
- Python 3.11+ with pip
- FFmpeg (mentioned in README for audio processing, but version not specified)
- Expo CLI installed globally or via npx
- iOS: Xcode (for iOS simulator/device)
- Android: Android Studio + SDK (for Android emulator/device)

**Production:**
- Mobile: iOS 12+ and Android 9+ (via Expo's minimum requirements)
- Backend: Linux-based server (typical for FastAPI deployments)
- Cloudflare R2 or similar S3-compatible storage for audio files

---

*Stack analysis: 2026-02-02*
