/**
 * Canonical onboarding sequence — mirrors
 * docs/product/Onboarding-Design-Spec.md §2 screen table.
 */
import type { OnboardingRouteId, OnboardingScreenDef } from "./types";

export const ONBOARDING_SEQUENCE: readonly OnboardingScreenDef[] = [
  {
    id: "splash",
    index: 0,
    label: "Splash",
    type: "static",
    grace: "welcome",
    showProgress: false,
    showBack: false,
    ctaLabel: "",
  },
  {
    id: "welcome",
    index: 1,
    label: "Welcome",
    type: "hook",
    grace: "welcome",
    showProgress: false,
    showBack: false,
    ctaLabel: "Begin My Journey",
    secondaryCtaLabel: "Already have an account? Sign in",
  },
  {
    id: "benefit1",
    index: 2,
    label: "Quiet the noise",
    type: "value",
    grace: "peaceful",
    showProgress: false,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "benefit2",
    index: 3,
    label: "Scripture rest",
    type: "value",
    grace: "thoughtful",
    showProgress: false,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "benefit3",
    index: 4,
    label: "Personal support",
    type: "value",
    grace: "hopeful",
    showProgress: false,
    showBack: true,
    ctaLabel: "Personalize My Journey",
  },
  {
    id: "name",
    index: 5,
    label: "Name",
    type: "input",
    grace: "thinkname",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "heart",
    index: 6,
    label: "Heart",
    type: "multi-select",
    grace: "listening",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "faith",
    index: 7,
    label: "Faith",
    type: "single",
    grace: "listening",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "concerns",
    index: 8,
    label: "Concerns",
    type: "multi-select",
    grace: "listening",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "timing",
    index: 9,
    label: "Timing",
    type: "single",
    grace: "listening",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "support",
    index: 10,
    label: "Support",
    type: "multi-select",
    grace: "listening",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "didYouKnow",
    index: 11,
    label: "Did You Know",
    type: "education",
    grace: "listening",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "age",
    index: 12,
    label: "Age",
    type: "single",
    grace: "listening",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "intensity",
    index: 13,
    label: "Intensity",
    type: "slider",
    grace: "listening",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "calculating",
    index: 14,
    label: "Calculating",
    type: "loading",
    grace: "thoughtful",
    showProgress: true,
    showBack: false,
    ctaLabel: "",
  },
  {
    id: "profileReveal",
    index: 15,
    label: "Profile",
    type: "result",
    grace: "thoughtful",
    showProgress: true,
    showBack: true,
    ctaLabel: "This feels true",
  },
  {
    id: "lifetimeLoss",
    index: 16,
    label: "Lifetime Loss",
    type: "shock",
    grace: "heavy",
    showProgress: true,
    showBack: true,
    ctaLabel: "Next",
  },
  {
    id: "visualRemaining",
    index: 17,
    label: "Years Left",
    type: "visualization",
    grace: "heavy",
    showProgress: true,
    showBack: true,
    ctaLabel: "Next",
  },
  {
    id: "visualLost",
    index: 18,
    label: "Time Lost",
    type: "visualization",
    grace: "heavy",
    showProgress: true,
    showBack: true,
    ctaLabel: "Next",
  },
  {
    id: "yearsReclaim",
    index: 19,
    label: "Reclaim",
    type: "hope",
    grace: "hopeful",
    showProgress: true,
    showBack: true,
    ctaLabel: "I want those years back",
  },
  {
    id: "socialProof",
    index: 20,
    label: "Social Proof",
    type: "trust",
    grace: "hopeful",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "commitment",
    index: 21,
    label: "Commitment",
    type: "ritual",
    grace: "committed",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "statsPreview",
    index: 22,
    label: "Stats",
    type: "motivation",
    grace: "peaceful",
    showProgress: true,
    showBack: true,
    ctaLabel: "Continue",
  },
  {
    id: "paywallFull",
    index: 23,
    label: "Plan",
    type: "monetization",
    grace: "peaceful",
    showProgress: true,
    showBack: true,
    // CTAs live inside paywall screens (purchase + scarcity UI)
    ctaLabel: "",
  },
  {
    id: "paywall50",
    index: 24,
    label: "50% Off",
    type: "monetization",
    grace: "peaceful",
    showProgress: true,
    showBack: false,
    ctaLabel: "",
  },
  {
    id: "paywall80",
    index: 25,
    label: "80% Off",
    type: "monetization",
    grace: "peaceful",
    showProgress: true,
    showBack: false,
    ctaLabel: "",
  },
  {
    id: "howAppWorks",
    index: 26,
    label: "How It Works",
    type: "education",
    grace: "peaceful",
    // Finale: no progress chrome; CTA leaves to sign-in with exit fade
    showProgress: false,
    showBack: false,
    ctaLabel: "Start my journey",
  },
] as const;

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_SEQUENCE.length;

export const ONBOARDING_STEP_LABELS = ONBOARDING_SEQUENCE.map((s) => s.label);

export const ONBOARDING_ROUTE_INDEX: Record<OnboardingRouteId, number> =
  ONBOARDING_SEQUENCE.reduce(
    (acc, s) => {
      acc[s.id] = s.index;
      return acc;
    },
    {} as Record<OnboardingRouteId, number>
  );

/** Paywall tier indices — back never re-enters a prior tier once passed. */
export const PAYWALL_INDICES = {
  full: 23,
  fifty: 24,
  eighty: 25,
} as const;

export function getScreenDef(index: number): OnboardingScreenDef {
  return ONBOARDING_SEQUENCE[Math.min(Math.max(0, index), TOTAL_ONBOARDING_STEPS - 1)];
}

/**
 * Resolve the previous step index, applying paywall ladder rules
 * (no return to a better/earlier offer once advanced).
 */
export function previousStepIndex(current: number): number | null {
  if (current <= 0) return null;
  const def = getScreenDef(current);
  if (!def.showBack) return null;
  // From later paywalls, jump back before the monetization ladder
  if (current === PAYWALL_INDICES.fifty || current === PAYWALL_INDICES.eighty) {
    return PAYWALL_INDICES.full - 1; // statsPreview
  }
  return current - 1;
}
