import React from "react";
import { EscalatingPaywall } from "../components/EscalatingPaywall";

/** Screen 25 — low annual ($19.99) hard step + 3m timer */
export function Paywall80Screen() {
  return <EscalatingPaywall tier="low" testID="onboarding-screen-paywall80" />;
}

export default Paywall80Screen;
