import { useAuth } from "@/src/features/auth/AuthContext";
import { useRevenueCat } from "@/src/features/subscriptions/RevenueCatContext";

/** Premium from RevenueCat entitlement (client) or backend user flag (fallback). */
export function usePremium() {
  const { user } = useAuth();
  const { isPremium: rcPremium, ready: rcReady, supported } = useRevenueCat();

  const isPremium = rcReady && supported ? rcPremium || Boolean(user?.is_premium) : Boolean(user?.is_premium);

  return { isPremium, rcReady, rcSupported: supported };
}