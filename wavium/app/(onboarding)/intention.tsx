/**
 * WAVIUM - First Intention Screen
 * User shares their first intention with Mindi
 */

import React from 'react';
import { router } from 'expo-router';
import { IntentionAbsorber } from '../../src/components/ceremony';
import { useMindiStore } from '../../src/stores/useMindiStore';

export default function IntentionScreen() {
  const setIntention = useMindiStore((state) => state.setIntention);

  const handleComplete = (intention: string) => {
    // Save intention to store so it persists
    setIntention(intention);
    router.push('/(onboarding)/name-mindi');
  };

  return (
    <IntentionAbsorber
      onComplete={handleComplete}
    />
  );
}
