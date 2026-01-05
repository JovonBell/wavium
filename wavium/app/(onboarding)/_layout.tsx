/**
 * WAVIUM - Onboarding Layout
 * Ceremonial flow navigation
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="breath" />
      <Stack.Screen name="void-entry" />
      <Stack.Screen name="mindi-birth" />
      <Stack.Screen name="intention" />
      <Stack.Screen name="name-mindi" />
    </Stack>
  );
}
