import { useAuth } from "@/src/features/auth/AuthContext";
import { useRevenueCat } from "@/src/features/subscriptions/RevenueCatContext";
import { planFromProductIdentifier } from "@/src/features/subscriptions/constants";

export type SubscriptionTier = "free" | "premium";

/** Preview unlock: set EXPO_PUBLIC_UNLOCK_ALL=0 to re-enable paywall gating. */
const UNLOCK_ALL =
  (process.env.EXPO_PUBLIC_UNLOCK_ALL ?? "1").toString().trim() !== "0";

const TEST_EMAILS = new Set(["test@christcalm.dev"].map((e) => e.toLowerCase()));

/**
 * Free vs premium for the signed-in user.
 *
 * Source of truth order:
 * 1. EXPO_PUBLIC_UNLOCK_ALL (default on for local preview)
 * 2. Known test accounts (test@christcalm.dev)
 * 3. RevenueCat entitlement `christcalm_premium` (iOS/Android)
 * 4. Backend `user.is_premium` (DynamoDB / webhook)
 */
export function usePremium() {
  const { user } = useAuth();
  const {
    isPremium: rcPremium,
    ready: rcReady,
    supported,
    customerInfo,
  } = useRevenueCat();

  const email = (user?.email || "").toLowerCase();
  const isTestAccount = TEST_EMAILS.has(email);
  const backendPremium = Boolean(user?.is_premium);
  const storePremium = rcReady && supported ? rcPremium : false;
  const isPremium = UNLOCK_ALL || isTestAccount || storePremium || backendPremium;
  const subscriptionTier: SubscriptionTier = isPremium ? "premium" : "free";

  const entitlement = customerInfo?.entitlements.active?.christcalm_premium;
  const rcPlan = planFromProductIdentifier(entitlement?.productIdentifier ?? null);

  return {
    isPremium,
    isFree: !isPremium,
    subscriptionTier,
    plan: user?.plan ?? rcPlan ?? (isPremium ? "preview" : null),
    premiumUntil: user?.premium_until ?? entitlement?.expirationDate ?? null,
    rcReady,
    rcSupported: supported,
    /** True only from RevenueCat entitlement (ignores UNLOCK_ALL / test email) */
    storePremium,
  };
}
