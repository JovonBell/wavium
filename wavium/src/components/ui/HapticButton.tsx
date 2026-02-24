/**
 * WAVIUM - Haptic Button
 * Button with haptic feedback, gradient fills, breathing glow, and press animations
 */

import React, { useCallback, useEffect, ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/useThemeStore';
import { fontFamilies } from '../../theme/typography';
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
  const glowOpacity = useSharedValue(0.15);
  const secondaryPulse = useSharedValue(0.6);

  // Breathing glow animation for primary variant
  useEffect(() => {
    if (variant === 'primary') {
      glowOpacity.value = withRepeat(
        withTiming(0.4, {
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
    }
  }, [variant]);

  // Subtle pulse animation for secondary variant gradient border
  useEffect(() => {
    if (variant === 'secondary') {
      secondaryPulse.value = withRepeat(
        withTiming(1.0, {
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
    }
  }, [variant]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, springs.snappy);
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

  // Animated transform + breathing glow shadow for primary
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    ...(variant === 'primary'
      ? {
          shadowColor: colors.primaryGradient[1],
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 20,
          shadowOpacity: glowOpacity.value,
        }
      : {}),
  }));

  // Animated opacity for secondary gradient border
  const secondaryBorderStyle = useAnimatedStyle(() => ({
    opacity: secondaryPulse.value,
  }));

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

  const sizeStyles = getSizeStyles();

  // Shared text content renderer
  const renderContent = (textColor: string) => (
    <>
      {icon && <Animated.View style={styles.icon}>{icon}</Animated.View>}
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.text,
            {
              color: textColor,
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
    </>
  );

  // --- PRIMARY VARIANT: LinearGradient fill + breathing glow ---
  if (variant === 'primary') {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          {
            opacity: disabled ? 0.5 : 1,
            elevation: 0,
          },
          fullWidth && styles.fullWidth,
          animatedStyle,
          style,
        ]}
      >
        <LinearGradient
          colors={
            disabled
              ? [colors.textMuted, colors.textMuted, colors.textMuted]
              : (colors.primaryGradient as unknown as [string, string, ...string[]])
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            {
              paddingVertical: sizeStyles.padding,
              paddingHorizontal: sizeStyles.padding * 1.5,
            },
          ]}
        >
          {renderContent('#ffffff')}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  // --- SECONDARY VARIANT: Gradient border with inner fill ---
  if (variant === 'secondary') {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          {
            opacity: disabled ? 0.5 : 1,
          },
          fullWidth && styles.fullWidth,
          animatedStyle,
          style,
        ]}
      >
        <Animated.View style={secondaryBorderStyle}>
          <LinearGradient
            colors={colors.primaryGradient as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.button,
              {
                padding: 1, // 1px gradient border
              },
            ]}
          >
            <View
              style={[
                styles.secondaryInner,
                {
                  backgroundColor: colors.background,
                  paddingVertical: sizeStyles.padding - 1,
                  paddingHorizontal: sizeStyles.padding * 1.5 - 1,
                },
              ]}
            >
              {renderContent(colors.primary)}
            </View>
          </LinearGradient>
        </Animated.View>
      </AnimatedTouchable>
    );
  }

  // --- GHOST / DANGER VARIANTS: Flat color (unchanged behavior) ---
  const getVariantStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
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

  const variantStyles = getVariantStyles();

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
      {renderContent(variantStyles.text)}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontFamily: fontFamilies.bodyMedium,
    textAlign: 'center',
  },
  icon: {
    marginRight: spacing.xs,
  },
  secondaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md - 1,
    minHeight: 42, // 44 - 2px border
  },
});
