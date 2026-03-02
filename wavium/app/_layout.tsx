/**
 * WAVIUM - Root Layout
 * App-wide providers and navigation setup with Supabase auth
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useMindiStore } from '../src/stores/useMindiStore';
import { useAuthStore } from '../src/stores/useAuthStore';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const updateTimeOfDay = useThemeStore((state) => state.updateTimeOfDay);
  const userId = useMindiStore((state) => state.userId);
  const session = useAuthStore((state) => state.session);
  const initialized = useAuthStore((state) => state.initialized);

  // Wait for Zustand store to hydrate from AsyncStorage
  useEffect(() => {
    const checkHydration = () => {
      if (useMindiStore.persist.hasHydrated()) {
        setIsHydrated(true);
      }
    };

    // Check immediately
    checkHydration();

    // Also listen for hydration finish
    const unsubscribe = useMindiStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
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

  // Route guard: Three-state routing based on auth + onboarding status
  useEffect(() => {
    if (!isHydrated || !appReady || !initialized) return;

    if (!session) {
      // Not authenticated -> auth screens
      router.replace('/(auth)/sign-in');
    } else if (!userId) {
      // Authenticated but hasn't completed onboarding -> onboarding
      router.replace('/(onboarding)');
    } else {
      // Fully set up -> main app
      router.replace('/(main)/home');
    }
  }, [session, userId, isHydrated, appReady, initialized]);

  // Wait for app ready, store hydration, AND auth initialization before rendering
  if (!appReady || !isHydrated || !initialized) {
    return null;
  }

  // Determine initial route based on three-state logic
  const initialRoute = !session ? '(auth)' : !userId ? '(onboarding)' : '(main)';

  return (
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
  );
}
