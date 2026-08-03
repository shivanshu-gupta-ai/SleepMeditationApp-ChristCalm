/**
 * Escalating paywall tiers — design §4 timers + marketing prices.
 * Purchases go through RevenueCat (default offering: $rc_annual / $rc_monthly).
 */

export type PaywallTier = "full" | "fifty" | "eighty";

export const TIMER_CONFIG = {
  fullPrice: 12 * 60, // 12 minutes
  fiftyOff: 5 * 60, // 5 minutes
  eightyOff: 3 * 60, // 3 minutes
} as const;

export const TIMER_STORAGE_KEYS = {
  full: "cc_paywall_full_expiry",
  fifty: "cc_paywall_50_expiry",
  eighty: "cc_paywall_80_expiry",
} as const;

/** Design marketing prices (INR). Store prices from RevenueCat override when available. */
export const PAYWALL_MARKETING = {
  full: {
    yearlyList: "₹4,999",
    yearlyNow: "₹4,999",
    monthly: "₹499",
    yearlySuffix: "/ year",
    monthlySuffix: "/ month",
  },
  fifty: {
    yearlyList: "₹4,999",
    yearlyNow: "₹2,499",
    discountLabel: "50% OFF FOREVER",
    badge: "LIMITED TIME OFFER",
  },
  eighty: {
    yearlyList: "₹4,999",
    yearlyNow: "₹999",
    discountLabel: "80% OFF FOREVER",
    badge: "ONE-TIME OFFER",
  },
} as const;

export const PAYWALL_COPY = {
  full: {
    headline: "Choose your plan",
    timerCaption: "Limited time",
    primaryCta: "Continue",
    secondaryCta: "Not now",
    bestValue: "Best value",
  },
  fifty: {
    headline: "50% OFF FOREVER",
    timerCaption: "Expires in",
    expireNote: "When the timer hits zero, this price is gone.",
    primaryCta: "Redeem 50% Offer",
    secondaryCta: "Continue without discount",
  },
  eighty: {
    headline: "80% OFF FOREVER",
    timerCaption: "Ends in",
    expireNote: "Final chance. This price won't return.",
    primaryCta: "Claim One-Time Offer",
    secondaryCta: "I'd rather pay full price",
  },
} as const;
