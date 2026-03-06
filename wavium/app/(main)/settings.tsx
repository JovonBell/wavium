/**
 * WAVIUM - Settings Screen
 * Account management, legal links, and app info
 */

import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useMindiStore } from '../../src/stores/useMindiStore';
import { GlassmorphicCard } from '../../src/components/ui';
import { typography, fontFamilies } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://wavium-production.up.railway.app';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  iconColor?: string;
}

function SettingsRow({ icon, label, onPress, color, iconColor }: SettingsRowProps) {
  const { colors } = useThemeStore();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={iconColor || colors.textSecondary} />
      <Text style={[styles.rowLabel, { color: color || colors.textPrimary }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { resetOnboarding } = useMindiStore();
  const userEmail = useAuthStore((s) => s.user?.email);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSignOut = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Sign Out',
      'You will need to sign in again to use Wavium.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await useAuthStore.getState().signOut();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your subliminals, streaks, and account data will be permanently deleted.',
              [
                { text: 'Keep Account', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    const { error } = await useAuthStore.getState().deleteAccount();
                    if (error) {
                      Alert.alert('Error', error);
                    } else {
                      resetOnboarding();
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const openLink = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`${API_BASE_URL}${path}`).catch(() => {
      Alert.alert('Error', 'Could not open link.');
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      {/* Account section */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ACCOUNT</Text>
        <GlassmorphicCard padding="none">
          <View style={styles.accountInfo}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            <Text style={[styles.email, { color: colors.textPrimary }]} numberOfLines={1}>
              {userEmail || 'Not signed in'}
            </Text>
          </View>
          <View style={[styles.separator, { backgroundColor: colors.glassBorder }]} />
          <SettingsRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
          />
        </GlassmorphicCard>
      </Animated.View>

      {/* Legal section */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>LEGAL</Text>
        <GlassmorphicCard padding="none">
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => openLink('/privacy')}
          />
          <View style={[styles.separator, { backgroundColor: colors.glassBorder }]} />
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => openLink('/terms')}
          />
        </GlassmorphicCard>
      </Animated.View>

      {/* Support section */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SUPPORT</Text>
        <GlassmorphicCard padding="none">
          <SettingsRow
            icon="mail-outline"
            label="Contact Support"
            onPress={() => Linking.openURL('mailto:support@wavium.app').catch(() => {})}
          />
        </GlassmorphicCard>
      </Animated.View>

      {/* Danger zone */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DANGER ZONE</Text>
        <GlassmorphicCard padding="none">
          <SettingsRow
            icon="trash-outline"
            label="Delete Account"
            onPress={handleDeleteAccount}
            color={colors.error || '#ff4444'}
            iconColor={colors.error || '#ff4444'}
          />
        </GlassmorphicCard>
      </Animated.View>

      {/* App info */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.appInfo}>
        <Text style={[styles.appVersion, { color: colors.textMuted }]}>
          Wavium v1.0.0 (Build 3)
        </Text>
      </Animated.View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    fontFamily: fontFamilies.displayRegular,
  },
  sectionLabel: {
    ...typography.label,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  email: {
    ...typography.body,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowLabel: {
    ...typography.body,
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  appVersion: {
    ...typography.caption,
  },
});
