/**
 * RevenueCat + App Store product configuration for ChristCalm (iOS-first).
 *
 * Entitlement: christcalm_premium
 * Offering:    default
 *
 * Real multi-tier annual SKUs (US):
 *   - cc_5999_1y  → $59.99 / year (full)
 *   - cc_3999_1y  → $39.99 / year (mid)
 *   - cc_1999_1y  → $19.99 / year (low)
 *   - cc_999_1m   → $9.99 / month
 *
 * Packages on offering `default`:
 *   $rc_annual | $rc_custom_annual_mid | $rc_custom_annual_low | $rc_monthly
 *
 * No free trial.
 */

export const ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "christcalm_premium";

export const OFFERING_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID || "default";

/** Canonical store product ids */
export const PRODUCT_IDS = {
  monthly: process.env.EXPO_PUBLIC_REVENUECAT_PRODUCT_MONTHLY || "cc_999_1m",
  annualFull: process.env.EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL_FULL || "cc_5999_1y",
  annualMid: process.env.EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL_MID || "cc_3999_1y",
  annualLow: process.env.EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL_LOW || "cc_1999_1y",
  /** @deprecated legacy annual with trial suffix — still mapped as mid/full fallback */
  annualLegacy: "cc_1999_1y_1w0",
} as const;

export type PlanId = "monthly" | "annualFull" | "annualMid" | "annualLow";

/** RC package lookup keys on the default offering */
export const PACKAGE_KEYS: Record<PlanId, string> = {
  monthly: "$rc_monthly",
  annualFull: "$rc_annual",
  annualMid: "$rc_custom_annual_mid",
  annualLow: "$rc_custom_annual_low",
};

/** All known product identifiers that grant premium (ASC + Test Store + aliases) */
export const PRODUCT_ID_ALIASES: Record<PlanId, readonly string[]> = {
  monthly: ["cc_999_1m", "christcalm_monthly", "monthly"],
  annualFull: ["cc_5999_1y", "christcalm_annual_full"],
  annualMid: ["cc_3999_1y", "christcalm_annual_mid", "cc_1999_1y_1w0", "christcalm_annual"],
  annualLow: ["cc_1999_1y", "christcalm_annual_low"],
};

export function planFromProductIdentifier(productId?: string | null): PlanId | null {
  if (!productId) return null;
  const id = productId.toLowerCase();
  // Check more specific annual tiers before generic "annual"
  const order: PlanId[] = ["annualFull", "annualMid", "annualLow", "monthly"];
  for (const plan of order) {
    const aliases = PRODUCT_ID_ALIASES[plan];
    if (aliases.some((a) => id === a.toLowerCase() || id.includes(a.toLowerCase()))) {
      return plan;
    }
  }
  if (id.includes("month") || id.includes("_1m")) return "monthly";
  if (id.includes("5999") || id.includes("59.99")) return "annualFull";
  if (id.includes("3999") || id.includes("39.99")) return "annualMid";
  if (id.includes("1999") || id.includes("19.99")) return "annualLow";
  if (id.includes("year") || id.includes("_1y")) return "annualFull";
  return null;
}

/** Onboarding ladder tier → primary purchase plan */
export type PaywallLadderTier = "full" | "mid" | "low";

export function planForLadderTier(tier: PaywallLadderTier): PlanId {
  if (tier === "full") return "annualFull";
  if (tier === "mid") return "annualMid";
  return "annualLow";
}
