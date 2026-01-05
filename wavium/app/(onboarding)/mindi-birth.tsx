/**
 * WAVIUM - Mindi Birth Screen
 * Watch Mindi emerge from light particles
 */

import React from 'react';
import { router } from 'expo-router';
import { LightCoalescing } from '../../src/components/ceremony';

export default function MindiBirthScreen() {
  const handleBirthComplete = () => {
    router.push('/(onboarding)/intention');
  };

  return (
    <LightCoalescing
      onBirthComplete={handleBirthComplete}
    />
  );
}
