/**
 * Derive spiritual profile from onboarding answers (screens 6–13).
 * Design example: "The Weary Seeker" — we map answer patterns to a small set
 * of seasons so the reveal feels personal, not random.
 */
import type { OnboardingDraft } from "@/src/utils/onboarding-draft";

export type ProfileMetricLevel = "Low" | "Moderate" | "High" | "Strong" | "Growing" | "Soft";

export type SpiritualProfile = {
  id: string;
  title: string;
  description: string;
  mentalNoise: "Low" | "Moderate" | "High";
  restCapacity: "Low" | "Moderate" | "High";
  desireForGod: "Soft" | "Growing" | "Strong";
};

const HEAVY_HEARTS = new Set([
  "weary",
  "anxious",
  "overwhelmed",
  "restless",
  "numb",
  "lonely",
]);

const SEEKING_FAITH = new Set(["seeking", "new", "returning", "struggling"]);
const ROOTED_FAITH = new Set(["deep", "growing"]);

export function deriveSpiritualProfile(draft: OnboardingDraft): SpiritualProfile {
  const hearts = draft.emotionalState || [];
  const heavyHeartCount = hearts.filter((h) => HEAVY_HEARTS.has(h)).length;
  const load = draft.dailyLoad ?? 5;
  const faith = draft.faithStage || "";
  const concernCount = draft.concerns?.length ?? 0;

  const mentalNoise: SpiritualProfile["mentalNoise"] =
    load >= 7 || heavyHeartCount >= 2 ? "High" : load >= 4 || heavyHeartCount >= 1 ? "Moderate" : "Low";

  const restCapacity: SpiritualProfile["restCapacity"] =
    load >= 7 || hearts.includes("weary") || hearts.includes("restless")
      ? "Low"
      : load >= 4
        ? "Moderate"
        : "High";

  const desireForGod: SpiritualProfile["desireForGod"] = ROOTED_FAITH.has(faith)
    ? "Strong"
    : SEEKING_FAITH.has(faith) || hearts.includes("hopeful_tired")
      ? "Growing"
      : hearts.includes("peaceful") && heavyHeartCount === 0
        ? "Soft"
        : "Strong";

  // Primary season labels
  if (
    (hearts.includes("weary") || hearts.includes("hopeful_tired") || load >= 6) &&
    (SEEKING_FAITH.has(faith) || !faith)
  ) {
    return {
      id: "weary_seeker",
      title: "The Weary Seeker",
      description: "You want God near—but noise keeps pulling you away.",
      mentalNoise: mentalNoise === "Low" ? "Moderate" : mentalNoise,
      restCapacity: restCapacity === "High" ? "Low" : restCapacity,
      desireForGod: desireForGod === "Soft" ? "Strong" : desireForGod,
    };
  }

  if (hearts.includes("anxious") || hearts.includes("restless") || concernCount >= 4) {
    return {
      id: "restless_heart",
      title: "The Restless Heart",
      description: "You long for stillness—worry keeps the volume high.",
      mentalNoise: "High",
      restCapacity: restCapacity === "High" ? "Moderate" : restCapacity,
      desireForGod,
    };
  }

  if (faith === "struggling" || faith === "returning" || hearts.includes("lonely")) {
    return {
      id: "returning_soul",
      title: "The Returning Soul",
      description: "Something in you wants to come home again.",
      mentalNoise,
      restCapacity,
      desireForGod: "Growing",
    };
  }

  if (hearts.includes("peaceful") && heavyHeartCount === 0 && load < 5) {
    return {
      id: "quiet_rooted",
      title: "The Quietly Rooted",
      description: "You begin in peace. Deepen what's already growing.",
      mentalNoise: "Low",
      restCapacity: restCapacity === "Low" ? "Moderate" : restCapacity,
      desireForGod: desireForGod === "Soft" ? "Growing" : desireForGod,
    };
  }

  if (ROOTED_FAITH.has(faith) && (heavyHeartCount >= 1 || load >= 5)) {
    return {
      id: "burdened_disciple",
      title: "The Burdened Disciple",
      description: "Faith is central—but daily weight still presses hard.",
      mentalNoise,
      restCapacity: restCapacity === "High" ? "Moderate" : restCapacity,
      desireForGod: "Strong",
    };
  }

  // Default — matches design sample when answers are mixed/heavy
  return {
    id: "weary_seeker",
    title: "The Weary Seeker",
    description: "You want God near—but noise keeps pulling you away.",
    mentalNoise: mentalNoise === "Low" ? "Moderate" : mentalNoise,
    restCapacity: restCapacity === "High" ? "Low" : restCapacity,
    desireForGod: "Strong",
  };
}
