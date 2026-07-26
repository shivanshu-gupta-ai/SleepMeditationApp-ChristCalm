import { useAuth } from "@/src/features/auth/AuthContext";
import { useRevenueCat } from "@/src/features/subscriptions/RevenueCatContext";
import { planFromProductIdentifier } from "@/src/features/subscriptions/constants";

export type SubscriptionTier = "free" | "premium";

/**
 * Paywall bypass for local demos only.
 * Default OFF — production/TestFlight/sandbox must set EXPO_PUBLIC_UNLOCK_ALL=0
 * (or omit it). Preview may set =1 via sync-env.
 */
const UNLOCK_ALL =
  (process.env.EXPO_PUBLIC_UNLOCK_ALL ?? "0").toString().trim() === "1";

/**
 * Free vs premium for the signed-in user.
 *
 * Source of truth order:
 * 1. EXPO_PUBLIC_UNLOCK_ALL=1 (explicit preview/demo only)
 * 2. RevenueCat entitlement (StoreKit sandbox / production)
 * 3. Backend `user.is_premium` (RevenueCat webhook / DynamoDB)
 *
 * No hard-coded test emails — that would ship a free-premium path in the binary.
 */
export function usePremium() {
  const { user } = useAuth();
  const {
    isPremium: rcPremium,
    ready: rcReady,
    supported,
    customerInfo,
  } = useRevenueCat();

  const backendPremium = Boolean(user?.is_premium);
  const storePremium = rcReady && supported ? rcPremium : false;
  const isPremium = UNLOCK_ALL || storePremium || backendPremium;
  const subscriptionTier: SubscriptionTier = isPremium ? "premium" : "free";

  const entitlement = customerInfo?.entitlements.active?.christcalm_premium;
  const rcPlan = planFromProductIdentifier(entitlement?.productIdentifier ?? null);

  return {
    isPremium,
    isFree: !isPremium,
    subscriptionTier,
    plan: user?.plan ?? rcPlan ?? (isPremium && UNLOCK_ALL ? "preview" : null),
    premiumUntil: user?.premium_until ?? entitlement?.expirationDate ?? null,
    rcReady,
    rcSupported: supported,
    /** True only from RevenueCat entitlement (ignores UNLOCK_ALL) */
    storePremium,
  };
}
