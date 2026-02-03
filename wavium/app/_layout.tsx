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
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

/**
 * Inner navigator that handles session-based routing.
 * Must be inside AuthProvider to access auth state.
 */
function RootNavigator() {
  const [appReady, setAppReady] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const updateTimeOfDay = useThemeStore((state) => state.updateTimeOfDay);
  const { session, loading, isPasswordRecovery } = useAuthContext();

  // Wait for Zustand store to hydrate from MMKV
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

        // Minimum splash time for smooth experience
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

  // Session-based routing
  useEffect(() => {
    if (!isHydrated || !appReady || loading) return;

    if (!session) {
      // No session - go to auth
      router.replace('/(auth)');
    } else if (isPasswordRecovery) {
      // Password recovery flow - go to update password screen
      router.replace('/(auth)/update-password');
    } else {
      // Authenticated - go to main app
      router.replace('/(main)/home');
    }
  }, [session, loading, isPasswordRecovery, isHydrated, appReady]);

  // Wait for app ready, store hydration, AND auth loading before rendering
  if (!appReady || !isHydrated || loading) {
    return null;
  }

  return (
    <Stack
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
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
