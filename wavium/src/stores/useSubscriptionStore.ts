/**
 * WAVIUM - Subscription Store
 * Manages premium subscription state via RevenueCat
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  purchaseSubscription,
  restorePurchases,
  getSubscriptionStatus,
  SubscriptionTier,
} from '../lib/revenuecat';

interface SubscriptionState {
  isPremium: boolean;
  expirationDate: string | null;
  loading: boolean;

  // Actions
  checkSubscription: () => Promise<void>;
  purchase: (tier?: SubscriptionTier) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<{ success: boolean; isPremium: boolean; error?: string }>;
  setPremium: (isPremium: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      isPremium: false,
      expirationDate: null,
      loading: false,

      checkSubscription: async () => {
        set({ loading: true });
        try {
          const status = await getSubscriptionStatus();
          set({
            isPremium: status.isPremium,
            expirationDate: status.expirationDate ?? null,
          });
        } catch {
          // Keep existing state on error
        } finally {
          set({ loading: false });
        }
      },

      purchase: async (tier: SubscriptionTier = 'annual') => {
        set({ loading: true });
        try {
          const result = await purchaseSubscription(tier);
          if (result.success) {
            set({ isPremium: true });
          }
          return { success: result.success, error: result.error };
        } catch (e: any) {
          return { success: false, error: e.message };
        } finally {
          set({ loading: false });
        }
      },

      restore: async () => {
        set({ loading: true });
        try {
          const result = await restorePurchases();
          if (result.isPremium) {
            set({ isPremium: true });
          }
          return result;
        } catch (e: any) {
          return { success: false, isPremium: false, error: e.message };
        } finally {
          set({ loading: false });
        }
      },

      setPremium: (isPremium) => set({ isPremium }),
    }),
    {
      name: 'wavium-subscription',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
