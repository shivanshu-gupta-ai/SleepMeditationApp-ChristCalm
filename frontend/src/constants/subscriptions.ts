/** Must match products configured in RevenueCat + App Store Connect / Google Play */

export const ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "christcalm_premium";

export const OFFERING_ID = process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID || "default";

export const PRODUCT_IDS = {
  monthly: process.env.EXPO_PUBLIC_REVENUECAT_PRODUCT_MONTHLY || "christcalm_monthly",
  annual: process.env.EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL || "christcalm_annual",
} as const;

export type PlanId = keyof typeof PRODUCT_IDS;