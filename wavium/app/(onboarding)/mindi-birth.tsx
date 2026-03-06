/**
 * WAVIUM - Mindi Birth Screen
 * Watch Mindi emerge from light particles
 */

import React, { useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { LightCoalescing } from '../../src/components/ceremony';

export default function MindiBirthScreen() {
  const hasNavigated = useRef(false);

  const handleBirthComplete = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    router.push('/(onboarding)/intention');
  }, []);

  return (
    <LightCoalescing
      onBirthComplete={handleBirthComplete}
    />
  );
}
