/**
 * RevenueCat SDK integration (react-native-purchases + react-native-purchases-ui).
 *
 * - Configure once with public API key (test_… or appl_…)
 * - Identify users with Purchases.logIn(appUserId)
 * - Entitlement: christcalm_premium
 * - Packages from current offering (default)
 * - Branded purchases via purchasePackage + remote Paywall + Customer Center
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOfferings,
  type PurchasesPackage,
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import {
  ENTITLEMENT_ID,
  OFFERING_ID,
  PRODUCT_IDS,
  planFromProductIdentifier,
  type PlanId,
} from "@/src/features/subscriptions/constants";
import { api } from "@/src/api/client";

export type RevenueCatState = {
  ready: boolean;
  supported: boolean;
  configured: boolean;
  isPremium: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  loadingOfferings: boolean;
  purchasing: boolean;
  error: string | null;
  clearError: () => void;
  getPackage: (plan: PlanId) => PurchasesPackage | null;
  /** Purchase monthly/annual package from current offering */
  purchase: (plan: PlanId) => Promise<boolean>;
  /** RevenueCat Paywalls (dashboard / default package UI) */
  presentPaywall: () => Promise<boolean>;
  /** Only if christcalm_premium is not active */
  presentPaywallIfNeeded: () => Promise<boolean>;
  /** Manage subscription / restore / refunds (native) */
  presentCustomerCenter: () => Promise<void>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<CustomerInfo | null>;
};

const RevenueCatContext = createContext<RevenueCatState | undefined>(undefined);

function getApiKey(): string {
  if (Platform.OS === "ios") {
    return (process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "").trim();
  }
  if (Platform.OS === "android") {
    return (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "").trim();
  }
  return "";
}

export function hasPremiumEntitlement(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

function formatPurchasesError(e: unknown): string {
  const err = e as PurchasesError & { userCancelled?: boolean };
  if (err?.userCancelled) return "";
  const code = err?.code;
  if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return "";
  if (code === PURCHASES_ERROR_CODE.NETWORK_ERROR) {
    return "Network error. Check your connection and try again.";
  }
  if (code === PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR) {
    return "This plan is not available yet. Try again later or use a device build.";
  }
  if (code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
    return "Purchases are not allowed on this device/account.";
  }
  return err?.message || "Something went wrong with subscriptions.";
}

async function syncBackend(active: boolean, plan: PlanId | null) {
  try {
    await api.syncSubscription({ active, plan });
  } catch {
    // Webhook remains long-term source of truth
  }
}

export function RevenueCatProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const apiKey = getApiKey();
  const supported = Platform.OS === "ios" || Platform.OS === "android";
  const configuredOnce = useRef(false);

  const [ready, setReady] = useState(!supported || !apiKey);
  const [configured, setConfigured] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const applyCustomerInfo = useCallback(async (info: CustomerInfo) => {
    setCustomerInfo(info);
    const active = hasPremiumEntitlement(info);
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    const plan = planFromProductIdentifier(entitlement?.productIdentifier);
    await syncBackend(active, plan);
  }, []);

  // Configure SDK once + identify user
  useEffect(() => {
    if (!supported || !apiKey) {
      setReady(true);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        if (!configuredOnce.current) {
          Purchases.configure({
            apiKey,
            appUserID: userId || undefined,
          });
          configuredOnce.current = true;
          if (mounted) setConfigured(true);
        } else if (userId) {
          const { customerInfo: info } = await Purchases.logIn(userId);
          if (mounted) await applyCustomerInfo(info);
        } else {
          // Signed out — anonymous again
          try {
            const info = await Purchases.logOut();
            if (mounted) await applyCustomerInfo(info);
          } catch {
            /* already anonymous */
          }
        }

        if (userId && configuredOnce.current) {
          // Ensure identity when configure already used anonymous id
          try {
            const { customerInfo: info } = await Purchases.logIn(userId);
            if (mounted) await applyCustomerInfo(info);
          } catch (e) {
            console.warn("RevenueCat logIn", e);
          }
        } else if (!userId) {
          try {
            const info = await Purchases.getCustomerInfo();
            if (mounted) await applyCustomerInfo(info);
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        console.warn("RevenueCat configure failed", e);
        if (mounted) setError(formatPurchasesError(e) || "Failed to start subscriptions.");
      } finally {
        if (mounted) setReady(true);
      }
    })();

    const listener = (info: CustomerInfo) => {
      applyCustomerInfo(info).catch(() => {});
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      mounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [supported, apiKey, userId, applyCustomerInfo]);

  // Load offerings
  useEffect(() => {
    if (!ready || !supported || !apiKey || !configuredOnce.current) return;

    let cancelled = false;
    setLoadingOfferings(true);
    Purchases.getOfferings()
      .then((o) => {
        if (!cancelled) setOfferings(o);
      })
      .catch((e) => {
        console.warn("RevenueCat offerings failed", e);
        if (!cancelled) setError(formatPurchasesError(e) || "Could not load plans.");
      })
      .finally(() => {
        if (!cancelled) setLoadingOfferings(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, supported, apiKey]);

  const getPackage = useCallback(
    (plan: PlanId): PurchasesPackage | null => {
      const current =
        offerings?.current ??
        (OFFERING_ID ? offerings?.all?.[OFFERING_ID] : null) ??
        null;
      if (!current) return null;

      const targetType = plan === "annual" ? PACKAGE_TYPE.ANNUAL : PACKAGE_TYPE.MONTHLY;
      const byType = current.availablePackages.find((p) => p.packageType === targetType);
      if (byType) return byType;

      const aliases = [
        PRODUCT_IDS[plan],
        plan === "annual" ? "christcalm_annual" : "christcalm_monthly",
        plan === "annual" ? "$rc_annual" : "$rc_monthly",
        plan === "annual" ? "annual" : "monthly",
      ].map((s) => s.toLowerCase());

      return (
        current.availablePackages.find((p) => {
          const hay = `${p.identifier} ${p.product.identifier}`.toLowerCase();
          return aliases.some((a) => hay.includes(a));
        }) ?? null
      );
    },
    [offerings]
  );

  const purchase = useCallback(
    async (plan: PlanId) => {
      if (!supported || !apiKey) {
        throw new Error("Subscriptions require the native iOS or Android app.");
      }
      const pkg = getPackage(plan);
      if (!pkg) {
        throw new Error(
          "This plan is not available yet. Check RevenueCat offerings and store products."
        );
      }
      setPurchasing(true);
      setError(null);
      try {
        const { customerInfo: info } = await Purchases.purchasePackage(pkg);
        await applyCustomerInfo(info);
        return hasPremiumEntitlement(info);
      } catch (e) {
        const msg = formatPurchasesError(e);
        if (!msg) return false; // user cancelled
        setError(msg);
        const err = new Error(msg) as Error & { userCancelled?: boolean };
        err.userCancelled = false;
        throw err;
      } finally {
        setPurchasing(false);
      }
    },
    [supported, apiKey, getPackage, applyCustomerInfo]
  );

  const presentPaywall = useCallback(async () => {
    if (!supported || !apiKey) {
      throw new Error("RevenueCat Paywalls require a native iOS/Android build.");
    }
    setPurchasing(true);
    setError(null);
    try {
      const offering =
        offerings?.current ??
        (OFFERING_ID ? offerings?.all?.[OFFERING_ID] : undefined) ??
        undefined;
      const result = await RevenueCatUI.presentPaywall(
        offering ? { offering, displayCloseButton: true } : { displayCloseButton: true }
      );
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        const info = await Purchases.getCustomerInfo();
        await applyCustomerInfo(info);
        return hasPremiumEntitlement(info);
      }
      if (result === PAYWALL_RESULT.ERROR) {
        setError("Could not present the subscription screen.");
      }
      return false;
    } catch (e) {
      const msg = formatPurchasesError(e);
      if (msg) setError(msg);
      throw e;
    } finally {
      setPurchasing(false);
    }
  }, [supported, apiKey, offerings, applyCustomerInfo]);

  const presentPaywallIfNeeded = useCallback(async () => {
    if (!supported || !apiKey) {
      throw new Error("RevenueCat Paywalls require a native iOS/Android build.");
    }
    setPurchasing(true);
    setError(null);
    try {
      const offering =
        offerings?.current ??
        (OFFERING_ID ? offerings?.all?.[OFFERING_ID] : undefined) ??
        undefined;
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
        ...(offering ? { offering } : {}),
        displayCloseButton: true,
      });
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        const info = await Purchases.getCustomerInfo();
        await applyCustomerInfo(info);
        return hasPremiumEntitlement(info);
      }
      // NOT_PRESENTED = already entitled
      if (result === PAYWALL_RESULT.NOT_PRESENTED) {
        const info = await Purchases.getCustomerInfo();
        await applyCustomerInfo(info);
        return hasPremiumEntitlement(info);
      }
      return false;
    } catch (e) {
      const msg = formatPurchasesError(e);
      if (msg) setError(msg);
      throw e;
    } finally {
      setPurchasing(false);
    }
  }, [supported, apiKey, offerings, applyCustomerInfo]);

  const presentCustomerCenter = useCallback(async () => {
    if (!supported || !apiKey) {
      throw new Error("Customer Center requires a native iOS/Android build.");
    }
    setError(null);
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onRestoreCompleted: ({ customerInfo: info }) => {
            applyCustomerInfo(info).catch(() => {});
          },
        },
      });
      // Refresh after dismiss
      const info = await Purchases.getCustomerInfo();
      await applyCustomerInfo(info);
    } catch (e) {
      const msg = formatPurchasesError(e);
      if (msg) setError(msg);
      throw e;
    }
  }, [supported, apiKey, applyCustomerInfo]);

  const restore = useCallback(async () => {
    if (!supported || !apiKey) {
      throw new Error("Restore is available in the native iOS or Android app.");
    }
    setPurchasing(true);
    setError(null);
    try {
      const info = await Purchases.restorePurchases();
      await applyCustomerInfo(info);
      return hasPremiumEntitlement(info);
    } catch (e) {
      const msg = formatPurchasesError(e);
      if (msg) setError(msg);
      throw e;
    } finally {
      setPurchasing(false);
    }
  }, [supported, apiKey, applyCustomerInfo]);

  const refresh = useCallback(async () => {
    if (!supported || !apiKey || !configuredOnce.current) return null;
    try {
      const info = await Purchases.getCustomerInfo();
      await applyCustomerInfo(info);
      return info;
    } catch (e) {
      console.warn("getCustomerInfo failed", e);
      return null;
    }
  }, [supported, apiKey, applyCustomerInfo]);

  const value = useMemo<RevenueCatState>(
    () => ({
      ready,
      supported,
      configured,
      isPremium: hasPremiumEntitlement(customerInfo),
      customerInfo,
      offerings,
      loadingOfferings,
      purchasing,
      error,
      clearError,
      getPackage,
      purchase,
      presentPaywall,
      presentPaywallIfNeeded,
      presentCustomerCenter,
      restore,
      refresh,
    }),
    [
      ready,
      supported,
      configured,
      customerInfo,
      offerings,
      loadingOfferings,
      purchasing,
      error,
      clearError,
      getPackage,
      purchase,
      presentPaywall,
      presentPaywallIfNeeded,
      presentCustomerCenter,
      restore,
      refresh,
    ]
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCat() {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) throw new Error("useRevenueCat must be used within RevenueCatProvider");
  return ctx;
}
