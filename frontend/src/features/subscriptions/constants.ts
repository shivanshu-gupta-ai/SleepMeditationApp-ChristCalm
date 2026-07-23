/**
 * RevenueCat + App Store product configuration for ChristCalm (iOS-first).
 *
 * Entitlement: christcalm_premium
 * Offering:    default
 * Packages:    $rc_monthly / $rc_annual
 *
 * Store product IDs (both App Store + Test Store catalogs are recognized):
 *   - cc_999_1m / christcalm_monthly  → monthly
 *   - cc_1999_1y_1w0 / christcalm_annual → annual
 */

export const ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "christcalm_premium";

export const OFFERING_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID || "default";

/** Canonical store product ids used for purchase mapping */
export const PRODUCT_IDS = {
  monthly: process.env.EXPO_PUBLIC_REVENUECAT_PRODUCT_MONTHLY || "cc_999_1m",
  annual: process.env.EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL || "cc_1999_1y_1w0",
} as const;

export type PlanId = keyof typeof PRODUCT_IDS;

/** All known product identifiers that grant premium (ASC + Test Store aliases) */
export const PRODUCT_ID_ALIASES: Record<PlanId, readonly string[]> = {
  monthly: ["cc_999_1m", "christcalm_monthly", "monthly"],
  annual: ["cc_1999_1y_1w0", "christcalm_annual", "annual", "yearly"],
};

export function planFromProductIdentifier(productId?: string | null): PlanId | null {
  if (!productId) return null;
  const id = productId.toLowerCase();
  for (const [plan, aliases] of Object.entries(PRODUCT_ID_ALIASES) as [
    PlanId,
    readonly string[],
  ][]) {
    if (aliases.some((a) => id === a.toLowerCase() || id.includes(a.toLowerCase()))) {
      return plan;
    }
  }
  if (id.includes("year") || id.includes("_1y") || id.includes("1y_")) return "annual";
  if (id.includes("month") || id.includes("_1m") || id.includes("1m_")) return "monthly";
  return null;
}
