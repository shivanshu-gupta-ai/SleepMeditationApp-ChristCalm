/**
 * Lifetime loss / reclaim numbers for screens 16–19.
 * Anchored to design examples (19 years lost, 7 reclaimed) while
 * shifting slightly with age range + daily load for personalization.
 */
import type { OnboardingDraft } from "@/src/utils/onboarding-draft";

export type LifetimeStats = {
  /** Estimated years of life remaining (dot grid size). */
  remainingYears: number;
  /** Years on track to lose to noise/anxiety (shock number). */
  lostYears: number;
  /** Years ChristCalm can help reclaim (hope number). */
  reclaimYears: number;
};

const AGE_MID: Record<string, number> = {
  under_18: 16,
  "18_24": 21,
  "25_34": 30,
  "35_44": 40,
  "45_54": 50,
  "55_plus": 62,
};

/** ~ life expectancy used only for remaining-years inventory. */
const LIFE_EXPECTANCY = 82;

/**
 * Derive emotional lifetime stats from draft.
 * Default path (mid-age, elevated load) lands near design: ~19 lost, ~7 reclaim.
 */
export function deriveLifetimeStats(draft: OnboardingDraft): LifetimeStats {
  const ageMid = AGE_MID[draft.ageRange || "25_34"] ?? 30;
  const remainingYears = Math.max(18, Math.min(70, LIFE_EXPECTANCY - ageMid));

  const load = draft.dailyLoad ?? 5;
  const heavyHearts = (draft.emotionalState || []).filter((h) =>
    ["weary", "anxious", "overwhelmed", "restless", "numb", "lonely"].includes(h)
  ).length;
  const concerns = draft.concerns?.length ?? 0;

  // Base ~11 + load weight + heart/concern pressure → ~19 at load 7, 2 heavy, 3 concerns
  let lostYears = Math.round(9 + load * 1.05 + heavyHearts * 1.2 + concerns * 0.45);
  lostYears = Math.max(8, Math.min(Math.floor(remainingYears * 0.55), lostYears));
  // Pull toward design sample when answers are “typical heavy”
  if (load >= 5 && heavyHearts >= 1) {
    lostYears = Math.max(lostYears, 16);
  }
  if (load >= 6) {
    lostYears = Math.max(lostYears, 18);
  }

  // ~37% reclaim of lost — design: 19 → 7
  let reclaimYears = Math.round(lostYears * 0.37);
  reclaimYears = Math.max(4, Math.min(lostYears - 2, reclaimYears));

  return {
    remainingYears,
    lostYears: Math.min(lostYears, remainingYears),
    reclaimYears,
  };
}
