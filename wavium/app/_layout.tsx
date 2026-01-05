/**
 * WAVIUM - Root Layout
 * App-wide providers and navigation setup
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeStore } from '../src/stores/useThemeStore';
import { useMindiStore } from '../src/stores/useMindiStore';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const updateTimeOfDay = useThemeStore((state) => state.updateTimeOfDay);
  const userId = useMindiStore((state) => state.userId);

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

        // Add any other initialization here
        // e.g., font loading, auth check, etc.
        await new Promise(resolve => setTimeout(resolve, 500)); // Minimum splash time
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Route guard: When userId changes, ensure correct navigation
  useEffect(() => {
    if (!isHydrated || !appReady) return;

    if (userId) {
      // User is logged in, ensure we're in main app
      router.replace('/(main)/home');
    }
  }, [userId, isHydrated, appReady]);

  // Wait for BOTH app ready AND store hydration before rendering
  if (!appReady || !isHydrated) {
    return null;
  }

  // Determine initial route based on user state (NOW safe to read from hydrated store)
  const initialRoute = userId ? '(main)' : '(onboarding)';

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
