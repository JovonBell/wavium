/**
 * WAVIUM - Custom Tab Bar
 * Floating glassmorphic bottom navigation
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { springs } from '../../theme/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TabButton = ({
  tab,
  isActive,
  onPress,
}: {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}) => {
  const { colors } = useThemeStore();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, springs.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springs.snappy);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.tabButton, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Ionicons
        name={isActive ? tab.iconFocused : tab.icon}
        size={24}
        color={isActive ? colors.primary : colors.textMuted}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: isActive ? colors.primary : colors.textMuted },
        ]}
      >
        {tab.label}
      </Text>

      {/* Active indicator */}
      {isActive && (
        <Animated.View
          style={[
            styles.activeIndicator,
            { backgroundColor: colors.primary },
          ]}
        />
      )}
    </AnimatedTouchable>
  );
};

export default function TabBar({
  tabs,
  activeTab,
  onTabPress,
}: TabBarProps) {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || spacing.md }]}>
      <BlurView intensity={30} tint="dark" style={styles.blur}>
        {/* Gradient overlay */}
        <View style={[styles.overlay, { backgroundColor: colors.surfaceGlow }]} />

        {/* Tab buttons */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              isActive={activeTab === tab.key}
              onPress={() => onTabPress(tab.key)}
            />
          ))}
        </View>
      </BlurView>
    </View>
  );
}

// Default tabs for the app - simplified to just Home and Create
export const DEFAULT_TABS: TabItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home-outline',
    iconFocused: 'home',
  },
  {
    key: 'create',
    label: 'Create',
    icon: 'add-circle-outline',
    iconFocused: 'add-circle',
  },
];

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
  },
  blur: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    marginTop: 4,
    fontSize: 10,
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
});
