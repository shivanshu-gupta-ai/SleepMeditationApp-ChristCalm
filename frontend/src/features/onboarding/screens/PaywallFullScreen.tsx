import React from "react";
import { EscalatingPaywall } from "../components/EscalatingPaywall";

/** Screen 23 — Full price paywall + soft 12m scarcity timer */
export function PaywallFullScreen() {
  return <EscalatingPaywall tier="full" testID="onboarding-screen-paywallFull" />;
}

export default PaywallFullScreen;
