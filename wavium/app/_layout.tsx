/**
 * WAVIUM - Root Layout
 * App-wide providers and navigation setup with Supabase auth
 */

import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useMindiStore } from '../src/stores/useMindiStore';
import { useAuthStore } from '../src/stores/useAuthStore';
import { ErrorBoundary } from '../src/components/ui';
import { AIConsentModal } from '../src/components/AIConsentModal';
import { initRevenueCat, identifyUser } from '../src/lib/revenuecat';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [aiConsentGiven, setAiConsentGiven] = useState<boolean | null>(null);
  const updateTimeOfDay = useThemeStore((state) => state.updateTimeOfDay);
  const userId = useMindiStore((state) => state.userId);
  const session = useAuthStore((state) => state.session);
  const initialized = useAuthStore((state) => state.initialized);

  // Track whether session exists as a boolean to avoid re-triggering the route
  // guard on every session object reference change (e.g. from token refresh or
  // supabase.auth.updateUser calls during onboarding).
  const hasSession = !!session;
  // Track whether the initial route has been set to prevent subsequent session
  // reference changes from re-firing the guard and causing navigation loops.
  const initialRouteSet = useRef(false);

  // Wait for Zustand store to hydrate from AsyncStorage
  useEffect(() => {
    const checkHydration = () => {
      if (useMindiStore.persist.hasHydrated()) {
        setIsHydrated(true);
      }
    };

    // Check immediately
    checkHydration();

    // Also listen for hydration finish.
    // NOTE: onFinishHydration fires on EVERY Zustand persist write, not just
    // the initial hydration from AsyncStorage. Guard with a check so we only
    // call setIsHydrated(true) once — repeated calls during onboarding (from
    // setUserName, setCurrentState, setIntention, etc.) were causing extra
    // render cycles in React Native that interfered with Expo Router's
    // navigation stack evaluation.
    const unsubscribe = useMindiStore.persist.onFinishHydration(() => {
      setIsHydrated((prev) => (prev ? prev : true));
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize theme based on time of day
        updateTimeOfDay();

        // Initialize Supabase auth (restore session from AsyncStorage)
        await useAuthStore.getState().initialize();

        // Initialize RevenueCat for subscriptions
        const authState = useAuthStore.getState();
        const rcUserId = authState.session?.user?.id;
        await initRevenueCat(rcUserId || undefined);
        if (rcUserId) {
          await identifyUser(rcUserId).catch(() => {});
        }

        // Minimum splash time for smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Check AI consent status on mount
  useEffect(() => {
    AsyncStorage.getItem('wavium-ai-consent').then((value) => {
      setAiConsentGiven(value === 'true');
    });
  }, []);

  // Route guard: Three-state routing based on auth + onboarding status.
  //
  // IMPORTANT: We depend on `hasSession` (boolean) instead of the `session`
  // object itself. Supabase fires onAuthStateChange for token refreshes,
  // updateUser() calls, etc., each producing a NEW session object reference.
  // If we depended on the session object, every such event would re-trigger
  // this effect and redirect away from onboarding (since userId is still null
  // mid-onboarding), causing an infinite onboarding loop.
  //
  // The `onboardingRedirectDone` ref prevents repeated "go to onboarding"
  // redirects while the user is mid-flow. It's reset on sign-out so a fresh
  // sign-in correctly evaluates whether onboarding is needed.
  useEffect(() => {
    if (!isHydrated || !appReady || !initialized) return;

    const currentSession = useAuthStore.getState().session;

    if (!currentSession) {
      // Not authenticated -> auth screens.
      // Reset the onboarding redirect flag so a fresh sign-in re-evaluates.
      initialRouteSet.current = false;
      router.replace('/(auth)/sign-in');
    } else if (!userId) {
      // Authenticated but hasn't completed onboarding -> onboarding.
      // Only redirect ONCE. This prevents session reference changes (from
      // updateUser, token refresh, etc.) from bouncing the user back to the
      // start of onboarding mid-flow.
      if (!initialRouteSet.current) {
        initialRouteSet.current = true;
        router.replace('/(onboarding)');
      }
    } else if (userId !== currentSession.user.id) {
      // Different user signed in — clear old onboarding data and re-onboard
      initialRouteSet.current = true;
      useMindiStore.getState().resetOnboarding();
      router.replace('/(onboarding)');
    } else {
      // Fully set up -> main app
      router.replace('/(main)/home');
    }
  }, [hasSession, userId, isHydrated, appReady, initialized]);

  // Wait for app ready, store hydration, AND auth initialization before rendering
  if (!appReady || !isHydrated || !initialized) {
    return null;
  }

  // Determine initial route based on three-state logic
  const initialRoute = !session ? '(auth)' : !userId ? '(onboarding)' : '(main)';

  return (
    <ErrorBoundary>
      <AIConsentModal
        visible={aiConsentGiven === false && initialized && appReady}
        onAccept={() => {
          AsyncStorage.setItem('wavium-ai-consent', 'true');
          setAiConsentGiven(true);
        }}
        onDecline={() => {
          Alert.alert(
            'AI Consent Required',
            'Wavium uses AI to generate personalized affirmations. The app cannot function without processing your data through AI services. Please accept to continue.',
            [{ text: 'OK' }]
          );
        }}
      />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(main)" />
            <Stack.Screen
              name="player/[id]"
              options={{
                animation: 'fade',
                presentation: 'fullScreenModal',
              }}
            />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
