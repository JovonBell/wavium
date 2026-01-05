/**
 * WAVIUM - Haptic System
 * Immersive haptic feedback throughout the app
 */

import * as Haptics from 'expo-haptics';
import { hapticPatterns } from '../theme/animations';

// Haptic intensity levels for battery optimization
export type HapticIntensity = 'none' | 'light' | 'medium' | 'full';

class HapticSystem {
  private intensity: HapticIntensity = 'full';
  private enabled = true;

  setIntensity(intensity: HapticIntensity) {
    this.intensity = intensity;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Check if we should trigger haptics
  private shouldTrigger(requiredLevel: HapticIntensity): boolean {
    if (!this.enabled || this.intensity === 'none') return false;

    const levels: HapticIntensity[] = ['none', 'light', 'medium', 'full'];
    const currentIndex = levels.indexOf(this.intensity);
    const requiredIndex = levels.indexOf(requiredLevel);

    return currentIndex >= requiredIndex;
  }

  // Basic haptic feedback
  async tap() {
    if (!this.shouldTrigger('light')) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async selection() {
    if (!this.shouldTrigger('light')) return;
    await Haptics.selectionAsync();
  }

  async impact(style: 'light' | 'medium' | 'heavy' = 'medium') {
    if (!this.shouldTrigger('medium')) return;

    const styleMap = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };

    await Haptics.impactAsync(styleMap[style]);
  }

  // Notification haptics
  async success() {
    if (!this.shouldTrigger('medium')) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async warning() {
    if (!this.shouldTrigger('medium')) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  async error() {
    if (!this.shouldTrigger('medium')) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  // Mindi-specific haptics
  async mindiReaction() {
    if (!this.shouldTrigger('medium')) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.delay(80);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async mindiCelebration() {
    if (!this.shouldTrigger('full')) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await this.delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // Breathing pattern haptics
  async breathingCycle(onPhaseChange?: (phase: 'in' | 'hold' | 'out') => void) {
    if (!this.shouldTrigger('full')) return;

    // Inhale - gradual intensity increase
    onPhaseChange?.('in');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.delay(hapticPatterns.breatheIn / 4);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.delay(hapticPatterns.breatheIn / 4);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.delay(hapticPatterns.breatheIn / 2);

    // Hold - gentle pulses
    onPhaseChange?.('hold');
    const holdPulses = Math.floor(hapticPatterns.breatheHold / 1000);
    for (let i = 0; i < holdPulses; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await this.delay(1000);
    }

    // Exhale - gradual intensity decrease
    onPhaseChange?.('out');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.delay(hapticPatterns.breatheOut / 4);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.delay(hapticPatterns.breatheOut / 4);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.delay(hapticPatterns.breatheOut / 2);
  }

  // Audio-reactive haptics for the player
  async audioReactive(audioLevel: number) {
    if (!this.shouldTrigger('full') || audioLevel < 0.5) return;

    if (audioLevel > 0.8) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (audioLevel > 0.6) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // Evolution level up haptic sequence
  async levelUp() {
    if (!this.shouldTrigger('full')) return;

    // Ascending pattern
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.delay(150);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Stage evolution haptic sequence (more dramatic)
  async stageEvolution() {
    if (!this.shouldTrigger('full')) return;

    // Build-up
    for (let i = 0; i < 3; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await this.delay(150);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await this.delay(150);
    }

    // Climax
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.delay(200);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Void entry haptic
  async voidEntry() {
    if (!this.shouldTrigger('full')) return;

    // Swirling pattern
    for (let i = 0; i < 5; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await this.delay(200 - i * 30);
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // Session complete celebration
  async sessionComplete() {
    if (!this.shouldTrigger('full')) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await this.delay(200);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.delay(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Helper
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const haptics = new HapticSystem();
