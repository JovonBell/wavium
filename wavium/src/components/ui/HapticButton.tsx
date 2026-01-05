/**
 * WAVIUM - Haptic Button
 * Button with haptic feedback and press animations
 */

import React, { useCallback, ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { springs } from '../../theme/animations';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';
type HapticType = 'light' | 'medium' | 'heavy' | 'none';

interface HapticButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  haptic?: HapticType;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: ReactNode;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HapticButton({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  haptic = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: HapticButtonProps) {
  const { colors } = useThemeStore();

  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, springs.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springs.snappy);
  }, []);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    // Haptic feedback
    switch (haptic) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }

    onPress();
  }, [haptic, disabled, loading, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Variant styles
  const getVariantStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'primary':
        return {
          bg: disabled ? colors.textMuted : colors.primary,
          text: '#ffffff',
        };
      case 'secondary':
        return {
          bg: 'transparent',
          text: colors.primary,
          border: colors.primary,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: colors.textPrimary,
        };
      case 'danger':
        return {
          bg: colors.error,
          text: '#ffffff',
        };
      default:
        return {
          bg: colors.primary,
          text: '#ffffff',
        };
    }
  };

  // Size styles
  const getSizeStyles = (): { padding: number; fontSize: number } => {
    switch (size) {
      case 'small':
        return { padding: spacing.sm, fontSize: 14 };
      case 'medium':
        return { padding: spacing.md, fontSize: 16 };
      case 'large':
        return { padding: spacing.lg, fontSize: 18 };
      default:
        return { padding: spacing.md, fontSize: 16 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border || 'transparent',
          borderWidth: variantStyles.border ? 1 : 0,
          paddingVertical: sizeStyles.padding,
          paddingHorizontal: sizeStyles.padding * 1.5,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {icon && <Animated.View style={styles.icon}>{icon}</Animated.View>}
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.text,
            {
              color: variantStyles.text,
              fontSize: sizeStyles.fontSize,
            },
            textStyle,
          ]}
        >
          {loading ? 'Loading...' : children}
        </Text>
      ) : (
        children
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    marginRight: spacing.xs,
  },
});
