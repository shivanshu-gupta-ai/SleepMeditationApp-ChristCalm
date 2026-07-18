import { useAuth } from "@/src/features/auth/AuthContext";
import { useRevenueCat } from "@/src/features/subscriptions/RevenueCatContext";

export type SubscriptionTier = "free" | "premium";

/** Preview unlock: set EXPO_PUBLIC_UNLOCK_ALL=0 to re-enable paywall gating. */
const UNLOCK_ALL =
  (process.env.EXPO_PUBLIC_UNLOCK_ALL ?? "1").toString().trim() !== "0";

const TEST_EMAILS = new Set(
  ["test@christcalm.dev"].map((e) => e.toLowerCase())
);

/**
 * Free vs premium for the signed-in user.
 *
 * Source of truth order:
 * 1. EXPO_PUBLIC_UNLOCK_ALL (default on for preview — nothing behind paywall)
 * 2. Known test accounts (test@christcalm.dev)
 * 3. RevenueCat entitlement on iOS/Android (when SDK configured)
 * 4. Backend `user.is_premium` (DynamoDB)
 */
export function usePremium() {
  const { user } = useAuth();
  const { isPremium: rcPremium, ready: rcReady, supported } = useRevenueCat();

  const email = (user?.email || "").toLowerCase();
  const isTestAccount = TEST_EMAILS.has(email);
  const backendPremium = Boolean(user?.is_premium);
  const storePremium = rcReady && supported ? rcPremium : false;
  const isPremium = UNLOCK_ALL || isTestAccount || storePremium || backendPremium;
  const subscriptionTier: SubscriptionTier = isPremium ? "premium" : "free";

  return {
    isPremium,
    isFree: !isPremium,
    subscriptionTier,
    plan: user?.plan ?? (isPremium ? "preview" : null),
    premiumUntil: user?.premium_until ?? null,
    rcReady,
    rcSupported: supported,
  };
}
