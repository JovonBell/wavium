/**
 * WAVIUM - RevenueCat Wrapper
 * Handles subscription purchases, restoration, and status checks
 */

import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const APPLE_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || '';
const PRODUCT_ID = 'com.jovonbell.wavium.monthly';
const ENTITLEMENT_ID = 'premium';

let initialized = false;

/**
 * Initialize RevenueCat SDK. Call once at app startup.
 */
export async function initRevenueCat(userId?: string): Promise<void> {
  if (initialized) return;

  if (!APPLE_API_KEY) {
    console.warn('[RevenueCat] No API key set — skipping init');
    return;
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    if (Platform.OS === 'ios') {
      await Purchases.configure({
        apiKey: APPLE_API_KEY,
        appUserID: userId || undefined,
      });
    }

    initialized = true;
  } catch (e) {
    console.warn('[RevenueCat] Failed to configure:', e);
    // Don't block app — subscriptions just won't work
  }
}

/**
 * Identify user with RevenueCat (call after sign-in)
 */
export async function identifyUser(userId: string): Promise<void> {
  if (!initialized) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[RevenueCat] Failed to identify user:', e);
  }
}

/**
 * Get the monthly subscription package
 */
export async function getMonthlyPackage(): Promise<PurchasesPackage | null> {
  if (!initialized) return null;

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.monthly ?? null;
  } catch (e) {
    console.warn('[RevenueCat] Failed to get offerings:', e);
    return null;
  }
}

/**
 * Purchase the monthly subscription
 */
/**
 * Whether RevenueCat is configured and ready
 */
export function isRevenueCatReady(): boolean {
  return initialized;
}

export async function purchaseMonthly(): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  if (!initialized) {
    // Not configured — treat as success so onboarding can continue
    return { success: true };
  }

  try {
    const pkg = await getMonthlyPackage();
    if (!pkg) {
      return { success: false, error: 'No subscription package available' };
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    return { success: isPremium, customerInfo };
  } catch (e: any) {
    if (e.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    return { success: false, error: e.message || 'Purchase failed' };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isPremium: boolean;
  error?: string;
}> {
  if (!initialized) {
    return { success: true, isPremium: false };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    return { success: true, isPremium };
  } catch (e: any) {
    return { success: false, isPremium: false, error: e.message || 'Restore failed' };
  }
}

/**
 * Check current subscription status
 */
export async function getSubscriptionStatus(): Promise<{
  isPremium: boolean;
  expirationDate?: string;
}> {
  if (!initialized) {
    return { isPremium: false };
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return {
      isPremium: entitlement !== undefined,
      expirationDate: entitlement?.expirationDate ?? undefined,
    };
  } catch {
    return { isPremium: false };
  }
}
