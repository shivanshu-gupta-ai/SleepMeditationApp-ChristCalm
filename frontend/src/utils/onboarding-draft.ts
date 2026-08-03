import { storage } from "@/src/utils/storage";

/**
 * Local onboarding draft — fields map to Onboarding-Design-Spec.md §6.
 * camelCase in app; draftToApiPayload converts for the API.
 */
export type OnboardingDraft = {
  name: string;
  emotionalState: string[];
  faithStage: string | null;
  concerns: string[];
  preferredTime: string | null;
  desiredSupport: string[];
  ageRange: string | null;
  /** 0–10 mental load (intensity slider) */
  dailyLoad: number | null;
  /** Derived spiritual profile id */
  profileType: string | null;
  commitmentAccepted: boolean;
  commitmentDate: string | null;
  firstPracticesDone: string[];
  /** Highest paywall screen index seen (prevents returning to better offers) */
  highestPaywallSeen: number | null;
};

const KEY = "cc_onboarding_draft";

export const defaultOnboardingDraft = (): OnboardingDraft => ({
  name: "",
  emotionalState: [],
  faithStage: null,
  concerns: [],
  preferredTime: null,
  desiredSupport: [],
  ageRange: null,
  dailyLoad: null,
  profileType: null,
  commitmentAccepted: false,
  commitmentDate: null,
  firstPracticesDone: [],
  highestPaywallSeen: null,
});

export async function loadOnboardingDraft(): Promise<OnboardingDraft> {
  const raw = await storage.getItem(KEY, null);
  if (raw == null) return defaultOnboardingDraft();

  let d: Partial<OnboardingDraft> & Record<string, unknown> = {};
  if (typeof raw === "string") {
    try {
      d = JSON.parse(raw) as Partial<OnboardingDraft>;
    } catch {
      return defaultOnboardingDraft();
    }
  } else if (typeof raw === "object") {
    d = raw as Partial<OnboardingDraft>;
  } else {
    return defaultOnboardingDraft();
  }

  // Migrate old single-string heart selection → array
  let emotionalState: string[] = [];
  if (Array.isArray(d.emotionalState)) {
    emotionalState = d.emotionalState.filter((c): c is string => typeof c === "string");
  } else if (typeof d.emotionalState === "string" && d.emotionalState) {
    emotionalState = [d.emotionalState];
  }

  // Migrate firstPracticesDone boolean[] → string[]
  let firstPracticesDone: string[] = [];
  if (Array.isArray(d.firstPracticesDone)) {
    if (d.firstPracticesDone.every((x) => typeof x === "string")) {
      firstPracticesDone = d.firstPracticesDone as string[];
    } else {
      firstPracticesDone = (d.firstPracticesDone as unknown[])
        .map((v, i) => (v ? `practice_${i}` : null))
        .filter((x): x is string => !!x);
    }
  }

  return {
    name: typeof d.name === "string" ? d.name : "",
    emotionalState,
    faithStage: typeof d.faithStage === "string" ? d.faithStage : null,
    concerns: Array.isArray(d.concerns) ? d.concerns.filter((c) => typeof c === "string") : [],
    desiredSupport: Array.isArray(d.desiredSupport)
      ? d.desiredSupport.filter((c) => typeof c === "string")
      : [],
    preferredTime: typeof d.preferredTime === "string" ? d.preferredTime : null,
    ageRange: typeof d.ageRange === "string" ? d.ageRange : null,
    dailyLoad: typeof d.dailyLoad === "number" ? d.dailyLoad : null,
    profileType: typeof d.profileType === "string" ? d.profileType : null,
    commitmentAccepted: Boolean(d.commitmentAccepted),
    commitmentDate: typeof d.commitmentDate === "string" ? d.commitmentDate : null,
    firstPracticesDone,
    highestPaywallSeen:
      typeof d.highestPaywallSeen === "number" ? d.highestPaywallSeen : null,
  };
}

export async function saveOnboardingDraft(draft: OnboardingDraft): Promise<void> {
  await storage.setItem(KEY, JSON.stringify(draft) as unknown as string);
}

export async function clearOnboardingDraft(): Promise<void> {
  await storage.removeItem(KEY);
}

export function draftToApiPayload(draft: OnboardingDraft) {
  // API currently accepts boolean[]; map string practice ids → fixed-length flags.
  const practiceFlags = [0, 1, 2].map((i) =>
    draft.firstPracticesDone.includes(`practice_${i}`) ||
    draft.firstPracticesDone.includes(String(i))
  );

  return {
    faith_journey: draft.faithStage,
    concerns: draft.concerns,
    emotional_state: draft.emotionalState.length ? draft.emotionalState.join(",") : null,
    desired_support: draft.desiredSupport,
    preferred_time: draft.preferredTime,
    commitment_accepted: draft.commitmentAccepted,
    commitment_date: draft.commitmentDate,
    first_practices_done: practiceFlags,
    display_name: draft.name || "Friend",
  };
}
