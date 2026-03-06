/**
 * WAVIUM - First Intention Screen
 * User shares their first intention with Mindi
 */

import React, { useCallback } from 'react';
import { router } from 'expo-router';
import { IntentionAbsorber } from '../../src/components/ceremony';
import { useMindiStore } from '../../src/stores/useMindiStore';

export default function IntentionScreen() {
  const setIntention = useMindiStore((state) => state.setIntention);

  // Stable callback reference — prevents IntentionAbsorber's useEffect from
  // re-firing when this component re-renders, which would call router.push
  // a second time and corrupt the navigation stack.
  const handleComplete = useCallback((intention: string) => {
    // Save intention to store so it persists
    setIntention(intention);
    router.push('/(onboarding)/name-mindi');
  }, [setIntention]);

  return (
    <IntentionAbsorber
      onComplete={handleComplete}
    />
  );
}
