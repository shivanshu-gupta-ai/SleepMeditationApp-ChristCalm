import React from "react";
import { EscalatingPaywall } from "../components/EscalatingPaywall";

/** Screen 24 — 50% forever + 5m timer */
export function Paywall50Screen() {
  return <EscalatingPaywall tier="fifty" testID="onboarding-screen-paywall50" />;
}

export default Paywall50Screen;
