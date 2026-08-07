/**
 * Escalating hard-paywall tiers — real App Store SKUs via RevenueCat.
 *
 * US list prices (store is source of truth at runtime):
 *   full  → annualFull $59.99  (+ optional monthly $9.99)
 *   mid   → annualMid  $39.99
 *   low   → annualLow  $19.99
 *
 * Timers = UX urgency only. No free trial.
 */

export type PaywallTier = "full" | "mid" | "low";

/** Map onboarding UI tier → sequence indices (23 full, 24 mid, 25 low) */
export const PAYWALL_STEP_INDEX: Record<PaywallTier, number> = {
  full: 23,
  mid: 24,
  low: 25,
};

export const TIMER_CONFIG = {
  fullPrice: 12 * 60, // 12 minutes
  mid: 5 * 60, // 5 minutes
  low: 3 * 60, // 3 minutes
} as const;

export const TIMER_STORAGE_KEYS = {
  full: "cc_paywall_full_expiry",
  mid: "cc_paywall_mid_expiry",
  low: "cc_paywall_low_expiry",
} as const;

/** Display fallbacks only when StoreKit packages have not loaded yet */
export const PAYWALL_FALLBACK_PRICES = {
  annualFull: "$59.99",
  annualMid: "$39.99",
  annualLow: "$19.99",
  monthly: "$9.99",
} as const;

export const PAYWALL_COPY = {
  full: {
    headline: "Unlock ChristCalm Premium",
    timerCaption: "Limited time to choose your plan",
    primaryCta: "Continue with Premium",
    secondaryCta: "See lower annual price",
    bestValue: "Best value · billed yearly",
  },
  mid: {
    headline: "A more accessible annual plan",
    timerCaption: "This step ends in",
    expireNote: "When the timer ends, only the final entry price remains.",
    primaryCta: "Get this annual plan",
    secondaryCta: "See final annual price",
  },
  low: {
    headline: "Final annual offer",
    timerCaption: "Ends in",
    expireNote: "Subscribe to continue. Restore if you already purchased.",
    primaryCta: "Claim entry annual plan",
    secondaryCta: "Restore purchases",
  },
} as const;
