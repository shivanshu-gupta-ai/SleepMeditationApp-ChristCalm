import React from "react";
import { EscalatingPaywall } from "../components/EscalatingPaywall";

/** Screen 24 — mid annual ($39.99) + 5m timer */
export function Paywall50Screen() {
  return <EscalatingPaywall tier="mid" testID="onboarding-screen-paywall50" />;
}

export default Paywall50Screen;
