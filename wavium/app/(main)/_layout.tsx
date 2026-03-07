/**
 * WAVIUM - Main App Layout
 * Simple tab navigation: Home and Create
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, router, usePathname } from 'expo-router';
import { TabBar, DEFAULT_TABS, TimeShiftingBackground, HomeAmbientPlayer } from '../../src/components/ui';
import { useMindiStore } from '../../src/stores/useMindiStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { getVoiceCloneStatus } from '../../src/services/api';

// Screens that should hide the tab bar (creation flow)
const SCREENS_WITHOUT_TABS = ['/script', '/tracks', '/settings'];

export default function MainLayout() {
  const pathname = usePathname();

  // Rehydrate voice clone status from backend for returning users (Bug 3)
  const userId = useMindiStore((s) => s.userId);
  const hasCustomVoice = useMindiStore((s) => s.hasCustomVoice);
  const setCustomVoice = useMindiStore((s) => s.setCustomVoice);
  const authUserId = useAuthStore((s) => s.user?.id);

  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    const effectiveUserId = userId || authUserId;
    if (effectiveUserId && !hasCustomVoice) {
      const accessToken = session?.access_token ?? null;
      getVoiceCloneStatus(effectiveUserId, accessToken).then(({ hasVoice, voiceId }) => {
        if (hasVoice && voiceId) {
          setCustomVoice(voiceId);
        }
      }).catch(() => {
        // Silently fail — voice status is a nice-to-have on load
      });
    }
  }, [userId, authUserId, session]);

  // Check if we should show tabs
  const shouldShowTabs = !SCREENS_WITHOUT_TABS.some((screen) =>
    pathname.includes(screen)
  );

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname.includes('/create')) return 'create';
    return 'home';
  };

  const handleTabPress = (key: string) => {
    router.push(`/(main)/${key}` as any);
  };

  return (
    <View style={styles.container}>
      <TimeShiftingBackground />
      <HomeAmbientPlayer isActive={!pathname.includes('/player')} />
      <View style={styles.content}>
        <Slot />
      </View>
      {shouldShowTabs && (
        <TabBar
          tabs={DEFAULT_TABS}
          activeTab={getActiveTab()}
          onTabPress={handleTabPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
