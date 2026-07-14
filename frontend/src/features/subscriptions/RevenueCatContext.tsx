import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
  LOG_LEVEL,
  PACKAGE_TYPE,
} from "react-native-purchases";
import { ENTITLEMENT_ID } from "@/src/features/subscriptions/constants";
import { api } from "@/src/api/client";
import type { PlanId } from "@/src/features/subscriptions/constants";

type RevenueCatState = {
  ready: boolean;
  supported: boolean;
  isPremium: boolean;
  offerings: PurchasesOfferings | null;
  loadingOfferings: boolean;
  purchasing: boolean;
  getPackage: (plan: PlanId) => PurchasesPackage | null;
  purchase: (plan: PlanId) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
};

const RevenueCatContext = createContext<RevenueCatState | undefined>(undefined);

function getApiKey() {
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
  }
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";
  }
  return "";
}

function hasEntitlement(info: CustomerInfo | null) {
  return Boolean(info?.entitlements.active[ENTITLEMENT_ID]);
}

function planFromProductId(productId?: string | null): PlanId | null {
  if (!productId) return null;
  const id = productId.toLowerCase();
  if (id.includes("annual") || id.includes("year")) return "annual";
  if (id.includes("month")) return "monthly";
  return null;
}

async function syncBackend(active: boolean, plan: PlanId | null) {
  try {
    await api.syncSubscription({ active, plan });
  } catch {
    // webhook remains source of truth; sync is best-effort for immediate UI
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
  const [ready, setReady] = useState(!supported);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const applyCustomerInfo = useCallback(async (info: CustomerInfo) => {
    setCustomerInfo(info);
    const active = hasEntitlement(info);
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    const plan = planFromProductId(entitlement?.productIdentifier);
    await syncBackend(active, plan);
  }, []);

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
        Purchases.configure({ apiKey });
        if (userId) {
          const { customerInfo } = await Purchases.logIn(userId);
          if (mounted) await applyCustomerInfo(customerInfo);
        }
        if (mounted) setReady(true);
      } catch (e) {
        console.warn("RevenueCat configure failed", e);
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

  useEffect(() => {
    if (!ready || !supported || !apiKey) return;

    setLoadingOfferings(true);
    Purchases.getOfferings()
      .then((o) => setOfferings(o))
      .catch((e) => console.warn("RevenueCat offerings failed", e))
      .finally(() => setLoadingOfferings(false));
  }, [ready, supported, apiKey]);

  const getPackage = useCallback(
    (plan: PlanId): PurchasesPackage | null => {
      const current = offerings?.current;
      if (!current) return null;

      const targetType = plan === "annual" ? PACKAGE_TYPE.ANNUAL : PACKAGE_TYPE.MONTHLY;
      const byType = current.availablePackages.find((p) => p.packageType === targetType);
      if (byType) return byType;

      const needle = plan === "annual" ? "annual" : "month";
      return (
        current.availablePackages.find((p) =>
          p.product.identifier.toLowerCase().includes(needle)
        ) ?? null
      );
    },
    [offerings]
  );

  const purchase = useCallback(
    async (plan: PlanId) => {
      if (!supported || !apiKey) {
        throw new Error("Subscriptions are available in the iOS and Android app.");
      }
      const pkg = getPackage(plan);
      if (!pkg) {
        throw new Error("This plan is not available yet. Check RevenueCat offerings.");
      }
      setPurchasing(true);
      try {
        const { customerInfo: info } = await Purchases.purchasePackage(pkg);
        await applyCustomerInfo(info);
        return hasEntitlement(info);
      } finally {
        setPurchasing(false);
      }
    },
    [supported, apiKey, getPackage, applyCustomerInfo]
  );

  const restore = useCallback(async () => {
    if (!supported || !apiKey) {
      throw new Error("Restore is available in the iOS and Android app.");
    }
    setPurchasing(true);
    try {
      const info = await Purchases.restorePurchases();
      await applyCustomerInfo(info);
      return hasEntitlement(info);
    } finally {
      setPurchasing(false);
    }
  }, [supported, apiKey, applyCustomerInfo]);

  const refresh = useCallback(async () => {
    if (!supported || !apiKey) return;
    const info = await Purchases.getCustomerInfo();
    await applyCustomerInfo(info);
  }, [supported, apiKey, applyCustomerInfo]);

  const value = useMemo(
    () => ({
      ready,
      supported,
      isPremium: hasEntitlement(customerInfo),
      offerings,
      loadingOfferings,
      purchasing,
      getPackage,
      purchase,
      restore,
      refresh,
    }),
    [
      ready,
      supported,
      customerInfo,
      offerings,
      loadingOfferings,
      purchasing,
      getPackage,
      purchase,
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