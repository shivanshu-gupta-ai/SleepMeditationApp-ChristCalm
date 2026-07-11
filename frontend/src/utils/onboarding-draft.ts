import { storage } from "@/src/utils/storage";

export type OnboardingDraft = {
  name: string;
  emotionalState: string | null;
  faithStage: string | null;
  concerns: string[];
  desiredSupport: string[];
  preferredTime: string | null;
  commitmentAccepted: boolean;
  commitmentDate: string | null;
  firstPracticesDone: boolean[];
};

const KEY = "cc_onboarding_draft";

export const defaultOnboardingDraft = (): OnboardingDraft => ({
  name: "",
  emotionalState: null,
  faithStage: null,
  concerns: [],
  desiredSupport: [],
  preferredTime: null,
  commitmentAccepted: false,
  commitmentDate: null,
  firstPracticesDone: [false, false, false],
});

export async function loadOnboardingDraft(): Promise<OnboardingDraft> {
  const raw = await storage.getItem(KEY, null);
  if (raw == null) return defaultOnboardingDraft();

  let d: Partial<OnboardingDraft> = {};
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

  return {
    name: typeof d.name === "string" ? d.name : "",
    emotionalState: typeof d.emotionalState === "string" ? d.emotionalState : null,
    faithStage: typeof d.faithStage === "string" ? d.faithStage : null,
    concerns: Array.isArray(d.concerns) ? d.concerns.filter((c) => typeof c === "string") : [],
    desiredSupport: Array.isArray(d.desiredSupport)
      ? d.desiredSupport.filter((c) => typeof c === "string")
      : [],
    preferredTime: typeof d.preferredTime === "string" ? d.preferredTime : null,
    commitmentAccepted: Boolean(d.commitmentAccepted),
    commitmentDate: typeof d.commitmentDate === "string" ? d.commitmentDate : null,
    firstPracticesDone: Array.isArray(d.firstPracticesDone)
      ? d.firstPracticesDone.map(Boolean)
      : [false, false, false],
  };
}

export async function saveOnboardingDraft(draft: OnboardingDraft): Promise<void> {
  // Storage API types scalar values; JSON round-trip is handled by the storage layer.
  await storage.setItem(KEY, JSON.stringify(draft) as unknown as string);
}

export async function clearOnboardingDraft(): Promise<void> {
  await storage.removeItem(KEY);
}

export function draftToApiPayload(draft: OnboardingDraft) {
  return {
    faith_journey: draft.faithStage,
    concerns: draft.concerns,
    emotional_state: draft.emotionalState,
    desired_support: draft.desiredSupport,
    preferred_time: draft.preferredTime,
    commitment_accepted: draft.commitmentAccepted,
    commitment_date: draft.commitmentDate,
    first_practices_done: draft.firstPracticesDone,
    display_name: draft.name || "Friend",
  };
}