import { useAuth } from "@/src/context/AuthContext";
import { useRevenueCat } from "@/src/context/RevenueCatContext";

/** Premium from RevenueCat entitlement (client) or backend user flag (fallback). */
export function usePremium() {
  const { user } = useAuth();
  const { isPremium: rcPremium, ready: rcReady, supported } = useRevenueCat();

  const isPremium = rcReady && supported ? rcPremium || Boolean(user?.is_premium) : Boolean(user?.is_premium);

  return { isPremium, rcReady, rcSupported: supported };
}