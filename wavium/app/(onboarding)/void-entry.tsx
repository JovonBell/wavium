/**
 * WAVIUM - Void Entry Screen
 * Enter the cosmic portal
 */

import React from 'react';
import { router } from 'expo-router';
import { VoidPortal } from '../../src/components/ceremony';

export default function VoidEntryScreen() {
  const handleEnterComplete = () => {
    router.push('/(onboarding)/mindi-birth');
  };

  return (
    <VoidPortal
      onEnterComplete={handleEnterComplete}
      autoStart={true}
    />
  );
}
