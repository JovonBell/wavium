/**
 * WAVIUM - Main App Layout
 * Simple tab navigation: Home and Create
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, router, usePathname } from 'expo-router';
import { TabBar, DEFAULT_TABS, TimeShiftingBackground, HomeAmbientPlayer } from '../../src/components/ui';

// Screens that should hide the tab bar (creation flow)
const SCREENS_WITHOUT_TABS = ['/script', '/tracks'];

export default function MainLayout() {
  const pathname = usePathname();

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
