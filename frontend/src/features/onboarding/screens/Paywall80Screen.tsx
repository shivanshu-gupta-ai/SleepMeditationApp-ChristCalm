import React from "react";
import { EscalatingPaywall } from "../components/EscalatingPaywall";

/** Screen 25 — 80% one-time + 3m pulse timer (max urgency) */
export function Paywall80Screen() {
  return <EscalatingPaywall tier="eighty" testID="onboarding-screen-paywall80" />;
}

export default Paywall80Screen;
