/**
 * WAVIUM - Breathing Ritual Screen
 * The sacred breathing ceremony
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { BreathingCircle } from '../../src/components/ceremony';

export default function BreathScreen() {
  const handleComplete = () => {
    router.push('/(onboarding)/void-entry');
  };

  return (
    <BreathingCircle
      cycles={3}
      onComplete={handleComplete}
      onSkip={handleComplete}
    />
  );
}
