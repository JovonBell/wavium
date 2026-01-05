/**
 * WAVIUM - Safe Container
 * Container with safe area handling and optional background
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/useThemeStore';
import TimeShiftingBackground from './TimeShiftingBackground';
import { spacing } from '../../theme/spacing';

interface SafeContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  withBackground?: boolean;
  padding?: boolean;
}

export default function SafeContainer({
  children,
  style,
  edges = ['top', 'bottom'],
  withBackground = true,
  padding = true,
}: SafeContainerProps) {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  const paddingStyle: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  const content = (
    <View
      style={[
        styles.container,
        paddingStyle,
        padding && styles.padding,
        !withBackground && { backgroundColor: colors.background },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (withBackground) {
    return (
      <View style={styles.wrapper}>
        <TimeShiftingBackground />
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: spacing.md,
  },
});
