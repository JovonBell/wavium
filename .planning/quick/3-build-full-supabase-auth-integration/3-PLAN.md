---
phase: quick
plan: 3
type: execute
wave: 1
depends_on: []
files_modified:
  - wavium/package.json
  - wavium/src/lib/supabase.ts
  - wavium/src/stores/useAuthStore.ts
  - wavium/app/(auth)/_layout.tsx
  - wavium/app/(auth)/sign-in.tsx
  - wavium/app/(auth)/sign-up.tsx
  - wavium/app/(auth)/forgot-password.tsx
  - wavium/app/_layout.tsx
  - wavium/app/(main)/home.tsx
  - wavium/app/(onboarding)/name-mindi.tsx
  - wavium/src/stores/useMindiStore.ts
autonomous: false
requirements: []
must_haves:
  truths:
    - "User can create a new account with email and password"
    - "User can sign in with existing credentials"
    - "User can request a password reset email"
    - "Unauthenticated users are redirected to sign-in screen"
    - "Authenticated users skip auth and go to onboarding or main app"
    - "Session persists across app restarts via AsyncStorage"
    - "User can log out from the home screen"
    - "userName from onboarding is stored in Supabase user metadata"
  artifacts:
    - path: "wavium/src/lib/supabase.ts"
      provides: "Supabase client singleton with AsyncStorage session persistence"
    - path: "wavium/src/stores/useAuthStore.ts"
      provides: "Auth state management — session, user, loading, signIn, signUp, signOut, resetPassword"
    - path: "wavium/app/(auth)/sign-in.tsx"
      provides: "Sign-in screen with email/password"
    - path: "wavium/app/(auth)/sign-up.tsx"
      provides: "Sign-up screen with email/password/confirm password"
    - path: "wavium/app/(auth)/forgot-password.tsx"
      provides: "Forgot password screen with email input"
  key_links:
    - from: "wavium/app/_layout.tsx"
      to: "wavium/src/stores/useAuthStore.ts"
      via: "useAuthStore session check determines initial route"
      pattern: "useAuthStore.*session"
    - from: "wavium/app/(auth)/sign-in.tsx"
      to: "wavium/src/stores/useAuthStore.ts"
      via: "signIn action triggers Supabase auth"
      pattern: "signIn.*email.*password"
    - from: "wavium/app/(onboarding)/name-mindi.tsx"
      to: "wavium/src/lib/supabase.ts"
      via: "updateUser stores userName in user_metadata"
      pattern: "supabase.*updateUser.*user_metadata"
---

<objective>
Full Supabase authentication integration for Wavium.

Purpose: Replace the fake `user_${Date.now()}` user ID with real Supabase email/password auth. This is the foundation for all future user-specific features (cloud sync, profiles, etc.).

Output: Working auth flow — sign up, sign in, forgot password, session persistence, route protection, logout, and userName stored in Supabase user metadata.
</objective>

<execution_context>
@/Users/joshuabellhome/.claude/get-shit-done/workflows/execute-plan.md
@/Users/joshuabellhome/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@wavium/app/_layout.tsx (root layout with route guard based on userId)
@wavium/app/(main)/_layout.tsx (main layout with tab bar)
@wavium/app/(main)/home.tsx (home screen showing userName, has secret reset)
@wavium/app/(onboarding)/_layout.tsx (onboarding stack)
@wavium/app/(onboarding)/name-mindi.tsx (where fake userId is set)
@wavium/src/stores/useMindiStore.ts (Zustand store with userId, userName, persist via AsyncStorage)
@wavium/src/components/ui/index.ts (available UI components)
@wavium/src/theme/colors.ts (theme system)
@wavium/src/theme/typography.ts (font families and text styles)
@wavium/src/theme/spacing.ts (spacing tokens)
@wavium/package.json (current deps — no supabase yet)

<interfaces>
<!-- Key types and contracts the executor needs -->

From wavium/src/stores/useMindiStore.ts:
```typescript
// Current state — userId is string | null, userName is string
interface MindiStoreState {
  userId: string | null;
  userName: string;
  setUserId: (id: string) => void;
  setUserName: (name: string) => void;
  resetOnboarding: () => void;
}
```

From wavium/app/_layout.tsx:
```typescript
// Route guard logic — navigates based on userId from Zustand store
const userId = useMindiStore((state) => state.userId);
// if userId => router.replace('/(main)/home')
// initialRoute = userId ? '(main)' : '(onboarding)';
// Stack has: (onboarding), (main), player/[id]
```

From wavium/src/components/ui/index.ts:
```typescript
export { default as GlassmorphicCard } from './GlassmorphicCard';
export { default as HapticButton } from './HapticButton';
export { default as GlowText } from './GlowText';
export { default as SafeContainer } from './SafeContainer';
export { default as TimeShiftingBackground } from './TimeShiftingBackground';
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Supabase, create client config and auth store</name>
  <files>
    wavium/package.json,
    wavium/src/lib/supabase.ts,
    wavium/src/stores/useAuthStore.ts
  </files>
  <action>
**Step 1: Install @supabase/supabase-js**

Run `cd /Users/joshuabellhome/wavium/wavium && npx expo install @supabase/supabase-js` (use expo install for version compatibility).

**Step 2: Create Supabase client — wavium/src/lib/supabase.ts**

Create a Supabase client singleton configured for React Native with AsyncStorage session persistence:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://upuflykybtvdgzsqzzon.supabase.co';
const SUPABASE_ANON_KEY = ''; // MUST BE FILLED — see checkpoint

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native
  },
});
```

NOTE: The anon key is intentionally left empty. The user MUST provide it. The checkpoint in Task 3 will gate on this.

**Step 3: Create auth store — wavium/src/stores/useAuthStore.ts**

Create a Zustand store (NOT persisted — Supabase handles session persistence internally via AsyncStorage) that manages auth state and exposes actions:

```typescript
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}
```

Implementation details:
- `initialize()`: Call `supabase.auth.getSession()` to restore session, then set up `supabase.auth.onAuthStateChange()` listener that updates `session` and `user` on every auth event. Set `initialized: true` once done. The listener handles token refresh automatically.
- `signUp(email, password)`: Call `supabase.auth.signUp({ email, password })`. Return `{ error: null }` on success, `{ error: message }` on failure. Map common error messages to user-friendly text (e.g., "User already registered" for duplicate email).
- `signIn(email, password)`: Call `supabase.auth.signInWithPassword({ email, password })`. Same error pattern.
- `signOut()`: Call `supabase.auth.signOut()`. The onAuthStateChange listener will clear session/user.
- `resetPassword(email)`: Call `supabase.auth.resetPasswordForEmail(email)`. Return error or null.

Do NOT persist this store with Zustand persist middleware — Supabase's own AsyncStorage integration handles session tokens. This store is runtime state only.
  </action>
  <verify>
    <automated>cd /Users/joshuabellhome/wavium/wavium && node -e "require('@supabase/supabase-js')" && echo "supabase-js installed OK"</automated>
  </verify>
  <done>
    - @supabase/supabase-js in package.json dependencies
    - wavium/src/lib/supabase.ts exports `supabase` client singleton with AsyncStorage
    - wavium/src/stores/useAuthStore.ts exports `useAuthStore` with initialize, signUp, signIn, signOut, resetPassword
    - Auth store uses onAuthStateChange listener (not manual session tracking)
  </done>
</task>

<task type="auto">
  <name>Task 2: Build auth screens and wire into app routing</name>
  <files>
    wavium/app/(auth)/_layout.tsx,
    wavium/app/(auth)/sign-in.tsx,
    wavium/app/(auth)/sign-up.tsx,
    wavium/app/(auth)/forgot-password.tsx,
    wavium/app/_layout.tsx,
    wavium/app/(onboarding)/name-mindi.tsx,
    wavium/app/(main)/home.tsx,
    wavium/src/stores/useMindiStore.ts
  </files>
  <action>
**Step 1: Create (auth) route group layout — wavium/app/(auth)/_layout.tsx**

Simple Stack layout (same pattern as onboarding layout):
- headerShown: false, animation: 'fade', contentStyle: transparent
- Screens: index (redirects to sign-in), sign-in, sign-up, forgot-password

**Step 2: Create Sign In screen — wavium/app/(auth)/sign-in.tsx**

Match existing Wavium aesthetic using existing UI components (SafeContainer, GlassmorphicCard, HapticButton, GlowText, TimeShiftingBackground).

Layout:
- TimeShiftingBackground as backdrop (same as main app)
- SafeContainer for safe area
- GlowText "WAVIUM" title at top (same as onboarding welcome)
- GlassmorphicCard containing:
  - Email TextInput (keyboardType: email-address, autoCapitalize: none, autoComplete: email)
  - Password TextInput (secureTextEntry)
  - Error text (shown when signIn returns error, colored with colors.error)
  - HapticButton "Sign In" variant="primary" fullWidth — calls useAuthStore().signIn(email, password)
  - Loading state: disable button + show "Signing in..." text while loading
- Below card: "Don't have an account? Sign Up" TouchableOpacity -> router.push('/(auth)/sign-up')
- Below that: "Forgot password?" TouchableOpacity -> router.push('/(auth)/forgot-password')

Use KeyboardAvoidingView (Platform.OS === 'ios' ? 'padding' : 'height') wrapping the content.

Style inputs with: backgroundColor: colors.surface, borderColor: colors.primary + '40', borderWidth: 1, borderRadius: 16, padding: spacing.md, color: colors.textPrimary, fontFamily from typography.body. Same pattern as name-mindi.tsx inputWrapper.

**Step 3: Create Sign Up screen — wavium/app/(auth)/sign-up.tsx**

Same aesthetic as sign-in. Fields: email, password, confirm password.
- Validate password match before calling signUp
- Validate password length >= 6 characters
- On successful sign up, show a message: "Check your email to confirm your account" (Supabase sends confirmation email by default). Use an Alert or inline text.
- HapticButton "Create Account" variant="primary"
- "Already have an account? Sign In" link at bottom

**Step 4: Create Forgot Password screen — wavium/app/(auth)/forgot-password.tsx**

Minimal screen: email input + "Send Reset Link" button. On success, show confirmation message and auto-navigate back to sign-in after 3 seconds. "Back to Sign In" link.

**Step 5: Update root layout — wavium/app/_layout.tsx**

Major changes to the route guard logic:

1. Import `useAuthStore` alongside existing imports
2. In the prepare() function, call `await useAuthStore.getState().initialize()` to restore Supabase session
3. Replace the `userId` route guard logic with auth-aware logic:
   - Read `session` from `useAuthStore` and `userId` from `useMindiStore`
   - Three states determine routing:
     a. No session (not authenticated) -> route to `(auth)`
     b. Session exists but no userId (authenticated but hasn't onboarded) -> route to `(onboarding)`
     c. Session exists AND userId exists (fully set up) -> route to `(main)/home`
4. Add `(auth)` to the Stack:
   ```tsx
   <Stack.Screen name="(auth)" />
   <Stack.Screen name="(onboarding)" />
   <Stack.Screen name="(main)" />
   <Stack.Screen name="player/[id]" ... />
   ```
5. Update initialRoute calculation to use the three-state logic
6. Subscribe to auth state changes: when `useAuthStore` session changes (sign in / sign out), trigger re-routing. Use a useEffect watching `session` from useAuthStore.

**Step 6: Update name-mindi.tsx — wavium/app/(onboarding)/name-mindi.tsx**

In handleContinue():
1. Keep existing `setName(name.trim())` call
2. Replace `setUserId('user_${Date.now()}')` with:
   - Get the Supabase user id: `const userId = useAuthStore.getState().user?.id`
   - Call `setUserId(userId)` (stores Supabase UUID instead of fake ID)
   - Call `setUserName(name.trim())` to store display name in Zustand
   - Also update Supabase user metadata: `await supabase.auth.updateUser({ data: { display_name: name.trim() } })` — this stores the name server-side so it survives device changes
3. The route guard in _layout.tsx will handle navigation to main when userId is set

**Step 7: Add logout to home screen — wavium/app/(main)/home.tsx**

Add a settings/logout icon button in the header area (top-right corner, using Ionicons "log-out-outline"):
- On press: show Alert.alert confirmation "Log Out?" with "Cancel" and "Log Out" options
- On confirm: call `useAuthStore.getState().signOut()`, then call `useMindiStore.getState().resetOnboarding()` to clear local state
- The auth state change listener will trigger re-routing to (auth) screen
- Style: subtle, using colors.textMuted, positioned absolute top-right with proper safe area inset

**Step 8: Update useMindiStore.ts — wavium/src/stores/useMindiStore.ts**

Update `resetOnboarding()` to also clear `userName`:
```typescript
resetOnboarding: () => set({
  userId: null,
  userName: '',
  name: 'Mindi',
  subliminals: [],
  creation: { ...initialCreation },
  streak: { ...initialStreak },
}),
```
(userName was already '' initial but make sure resetOnboarding explicitly clears it)
  </action>
  <verify>
    <automated>ls /Users/joshuabellhome/wavium/wavium/app/\(auth\)/sign-in.tsx /Users/joshuabellhome/wavium/wavium/app/\(auth\)/sign-up.tsx /Users/joshuabellhome/wavium/wavium/app/\(auth\)/forgot-password.tsx /Users/joshuabellhome/wavium/wavium/app/\(auth\)/_layout.tsx && echo "All auth screen files exist"</automated>
  </verify>
  <done>
    - Auth route group (auth) with sign-in, sign-up, forgot-password screens
    - All screens use existing Wavium UI components (GlassmorphicCard, HapticButton, GlowText, SafeContainer, TimeShiftingBackground)
    - Root layout has three-state routing: no session -> auth, session but no userId -> onboarding, both -> main
    - name-mindi.tsx stores Supabase user UUID as userId and saves userName to user_metadata
    - Home screen has logout button with confirmation dialog
    - resetOnboarding clears userName
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Verify Supabase credentials and test full auth flow</name>
  <what-built>
    Complete Supabase auth integration: sign up, sign in, forgot password, session persistence, route protection, and logout. The Supabase client is configured for project ref `upuflykybtvdgzsqzzon` but needs the anon key.
  </what-built>
  <how-to-verify>
    1. **Provide Supabase anon key:** Go to https://supabase.com/dashboard/project/upuflykybtvdgzsqzzon/settings/api and copy the "anon public" key. Paste it into `wavium/src/lib/supabase.ts` where `SUPABASE_ANON_KEY = ''` is.

    2. **Enable email auth in Supabase Dashboard:** Go to Authentication > Providers and ensure Email provider is enabled. For development, consider disabling "Confirm email" under Authentication > Settings to skip email verification.

    3. **Test the flow in iOS Simulator:**
       - `cd wavium && npx expo start` — open in iOS Simulator
       - App should show Sign In screen (not onboarding)
       - Tap "Sign Up" — create an account with email/password
       - If email confirmation disabled: should auto-sign in and go to onboarding
       - Complete onboarding (breath, void, intention, name Mindi)
       - Should land on home screen with your name
       - Kill and reopen app — should go straight to home (session persisted)
       - Tap logout icon — confirm — should return to sign in screen
       - Sign in with your credentials — should go to home (skips onboarding since userId exists)

    4. **Test forgot password:** Tap forgot password, enter email, verify "reset link sent" message appears
  </how-to-verify>
  <resume-signal>Type "approved" if auth flow works, or describe any issues</resume-signal>
</task>

</tasks>

<verification>
- `@supabase/supabase-js` appears in wavium/package.json
- `wavium/src/lib/supabase.ts` exports configured client
- `wavium/src/stores/useAuthStore.ts` exports store with signIn/signUp/signOut/resetPassword
- All 4 auth screen files exist in wavium/app/(auth)/
- Root layout has (auth) screen in Stack and three-state route guard
- name-mindi.tsx uses Supabase user.id instead of `user_${Date.now()}`
- Home screen has logout button
- App launches to sign-in when no session exists
</verification>

<success_criteria>
- New user can sign up, complete onboarding, and land on home screen
- Existing user can sign in and go directly to home (skipping onboarding)
- Closing and reopening app preserves session (no re-login needed)
- Logging out clears state and returns to sign-in screen
- Forgot password sends reset email
- All screens match Wavium's glassmorphic dark aesthetic
</success_criteria>

<output>
After completion, create `.planning/quick/3-build-full-supabase-auth-integration/3-SUMMARY.md`
</output>
