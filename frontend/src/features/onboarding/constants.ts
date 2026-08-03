/**
 * Re-exports design-spec option catalogs + legacy helpers.
 * Prefer `copy.ts` for new screens.
 */
import type { OnboardingDraft } from "@/src/utils/onboarding-draft";
import type { IonIconName } from "@/src/constants/emotion-icons";

export type QuestionCopy = {
  overline: string;
  title: string;
  subtitle: string;
  hint?: string;
};

export {
  EMOTIONAL_STATES,
  FAITH_STAGES,
  CONCERNS,
  PREFERRED_TIMES,
  DESIRED_SUPPORT,
  HEART_QUESTION,
  FAITH_QUESTION,
  CONCERNS_QUESTION,
  TIMING_QUESTION,
  SUPPORT_QUESTION,
  type OnboardingChoice,
} from "./copy";

/** @deprecated Prefer question constants in copy.ts */
export const QUESTIONS = {
  name: {
    overline: "Getting to know you",
    title: "What should I call you?",
    subtitle: "This helps Grace speak to you more personally.",
  },
  heart: {
    overline: "Your heart",
    title: "How has your heart been feeling lately?",
    subtitle: "You can select more than one.",
  },
  faith: {
    overline: "Your faith",
    title: "Where are you in your faith journey?",
    subtitle: "There's no right or wrong answer here.",
  },
  concerns: {
    overline: "Your season",
    title: "What weighs on your heart right now?",
    subtitle: "Select everything that feels true.",
  },
  timing: {
    overline: "Your rhythm",
    title: "When do you most need peace?",
    subtitle: "We'll help you find stillness at the right moments.",
  },
  support: {
    overline: "How we help",
    title: "How would you like ChristCalm to support you?",
    subtitle: "Choose the kinds of help that would mean the most.",
  },
  practices: {
    overline: "You're ready",
    title: "Here's how ChristCalm works.",
    subtitle:
      "There isn't a fixed Day 1–7 plan. When you open the app, you choose how you feel — and we meet you with Scripture-based calm for that moment.",
  },
  covenant: {
    overline: "A quiet commitment",
    title: "Your Personal Peace Covenant",
    subtitle: "This is between you and Jesus. You can revisit it anytime.",
  },
} as const satisfies Record<string, QuestionCopy>;

/** Honest product preview — matches live app features. */
export const HOW_THE_APP_WORKS: {
  id: string;
  icon: IonIconName;
  title: string;
  sub: string;
}[] = [
  {
    id: "emotions",
    icon: "happy-outline",
    title: "Emotion-based meditations",
    sub: "Tell us how you feel — open a short, Scripture-guided session for that emotion.",
  },
  {
    id: "sos",
    icon: "heart",
    title: "SOS when panic hits",
    sub: "One-tap 4-7-8 breathing with calming verses for hard moments.",
  },
  {
    id: "devotional",
    icon: "book-outline",
    title: "Today's Scripture",
    sub: "A fresh Scripture reflection each day — not a locked multi-day course.",
  },
  {
    id: "wisdom",
    icon: "chatbubbles-outline",
    title: "What would Jesus say?",
    sub: "Type a concern — conversational wisdom from our handbook + AI.",
  },
  {
    id: "journal",
    icon: "create-outline",
    title: "Journal",
    sub: "Write what's on your heart with simple mood tags — private to you.",
  },
];

export function getInsightCopy(draft: OnboardingDraft) {
  const hearts = draft.emotionalState || [];
  const heavy =
    draft.concerns.length >= 3 ||
    hearts.includes("anxious") ||
    hearts.includes("weary") ||
    hearts.includes("overwhelmed");

  if (heavy) {
    return {
      headline: "It looks like you're carrying quite a bit right now.",
      sub: "You're not alone. God's peace is available to you — one small step at a time.",
    };
  }

  if (hearts.includes("peaceful") && hearts.length === 1) {
    return {
      headline: "What a gift to begin from a place of peace.",
      sub: "Grace will walk with you as you deepen the calm God has already placed in your heart.",
    };
  }

  return {
    headline: "Every season has its own rhythm.",
    sub: "You're not alone. God's peace is available to you — one small step at a time.",
  };
}

export type { OnboardingDraft };
