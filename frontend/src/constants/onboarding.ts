import type { OnboardingDraft } from "@/src/utils/onboarding-draft";
import type { IonIconName } from "@/src/constants/emotion-icons";

/** Canonical question copy — same structure on every knowledge step */
export type QuestionCopy = {
  overline: string;
  title: string;
  subtitle: string;
  hint?: string;
};

export const QUESTIONS = {
  name: {
    overline: "Getting to know you",
    title: "What should I call you?",
    subtitle: "This helps our conversations feel personal and warm.",
  },
  heart: {
    overline: "Your heart",
    title: "How has your heart been feeling lately?",
    subtitle: "Be honest — there's no wrong answer here.",
    hint: "Choose the one that fits most right now",
  },
  faith: {
    overline: "Your faith",
    title: "Where are you in your faith journey right now?",
    subtitle: "Every season is welcome. We'll meet you where you are.",
    hint: "Choose one that feels closest",
  },
  concerns: {
    overline: "Your season",
    title: "What's weighing on your heart right now?",
    subtitle: "Name what feels heavy so we can bring the right peace.",
    hint: "Select all that feel true",
  },
  timing: {
    overline: "Your rhythm",
    title: "When do you most need peace during the day?",
    subtitle: "We'll gently meet you in those moments.",
    hint: "Choose one primary time",
  },
  support: {
    overline: "How Grace helps",
    title: "How would you like Grace to support you?",
    subtitle: "Choose what feels most helpful for this season.",
    hint: "Select all that resonate",
  },
  practices: {
    overline: "You're ready",
    title: "Here's how ChristCalm works.",
    subtitle:
      "There isn't a fixed Day 1–7 plan. When you open the app, you choose how you feel — and we meet you with Scripture-based calm for that moment.",
    hint: "Optional: try one gentle practice before you start",
  },
  covenant: {
    overline: "A quiet commitment",
    title: "Your Personal Peace Covenant",
    subtitle: "This is between you and Jesus. You can revisit it anytime.",
  },
} as const satisfies Record<string, QuestionCopy>;

export const EMOTIONAL_STATES: {
  id: string;
  label: string;
  sub: string;
  icon: IonIconName;
}[] = [
  { id: "weary", label: "Weary", sub: "I'm running on empty", icon: "moon-outline" },
  { id: "anxious", label: "Anxious", sub: "My mind won't quiet down", icon: "water-outline" },
  { id: "numb", label: "Numb", sub: "I'm going through the motions", icon: "remove-circle-outline" },
  {
    id: "hopeful_tired",
    label: "Hopeful but tired",
    sub: "I want to feel peace again",
    icon: "partly-sunny-outline",
  },
  { id: "peaceful", label: "Peaceful", sub: "I'm in a good place", icon: "flower-outline" },
];

export const FAITH_STAGES: {
  id: string;
  label: string;
  sub: string;
  icon: IonIconName;
}[] = [
  { id: "seeking", label: "Seeking", sub: "I'm exploring faith", icon: "compass-outline" },
  { id: "new", label: "New", sub: "I'm new to following Jesus", icon: "leaf-outline" },
  { id: "growing", label: "Growing", sub: "I'm growing and learning", icon: "trending-up-outline" },
  {
    id: "deep",
    label: "Deeply rooted",
    sub: "Faith is the center of my life",
    icon: "heart-outline",
  },
];

export const CONCERNS: {
  id: string;
  label: string;
  sub: string;
  icon: IonIconName;
}[] = [
  {
    id: "anxiety",
    label: "Anxiety & Worry",
    sub: "Restless thoughts, racing mind",
    icon: "water-outline",
  },
  {
    id: "panic",
    label: "Panic or Fear",
    sub: "Sudden waves of alarm",
    icon: "alert-circle-outline",
  },
  { id: "sleep", label: "Sleep & Rest", sub: "Hard to settle at night", icon: "bed-outline" },
  { id: "grief", label: "Grief or Loss", sub: "Carrying sorrow", icon: "heart-outline" },
  {
    id: "loneliness",
    label: "Loneliness",
    sub: "Feeling unseen or alone",
    icon: "person-outline",
  },
  {
    id: "overwhelm",
    label: "Overwhelm & Busyness",
    sub: "Too much to hold",
    icon: "layers-outline",
  },
  {
    id: "purpose",
    label: "Purpose & Direction",
    sub: "Unsure of the next step",
    icon: "compass-outline",
  },
  {
    id: "faith_struggle",
    label: "Struggles with Faith",
    sub: "Questions and doubt",
    icon: "help-circle-outline",
  },
  {
    id: "closer_to_jesus",
    label: "Closer to Jesus",
    sub: "I just want to grow nearer to Him",
    icon: "heart-circle-outline",
  },
];

export const DESIRED_SUPPORT: {
  id: string;
  label: string;
  sub: string;
  icon: IonIconName;
}[] = [
  {
    id: "rest_sleep",
    label: "Rest & sleep",
    sub: "Help me rest and sleep better",
    icon: "bed-outline",
  },
  {
    id: "calm_anxiety",
    label: "Calm my mind",
    sub: "Scripture for anxious thoughts",
    icon: "water-outline",
  },
  {
    id: "scripture",
    label: "God's Word",
    sub: "Hear Scripture personally",
    icon: "book-outline",
  },
  {
    id: "daily_habits",
    label: "Simple habits",
    sub: "Build gentle daily practices",
    icon: "leaf-outline",
  },
  {
    id: "presence",
    label: "His presence",
    sub: "Feel God more deeply",
    icon: "sparkles-outline",
  },
  {
    id: "grief_emotions",
    label: "Hard emotions",
    sub: "Process grief with care",
    icon: "heart-outline",
  },
  {
    id: "purpose",
    label: "Purpose",
    sub: "Find direction for this season",
    icon: "compass-outline",
  },
  {
    id: "quiet",
    label: "Quiet company",
    sub: "Just be with me in the stillness",
    icon: "flame-outline",
  },
];

export const PREFERRED_TIMES: {
  id: string;
  label: string;
  sub: string;
  icon: IonIconName;
}[] = [
  { id: "morning", label: "Morning", sub: "Start my day with Jesus", icon: "sunny-outline" },
  {
    id: "midday",
    label: "Midday",
    sub: "Reset in the middle of busyness",
    icon: "partly-sunny-outline",
  },
  { id: "evening", label: "Evening", sub: "Wind down and reflect", icon: "moon-outline" },
  { id: "before_sleep", label: "Before sleep", sub: "Quiet my mind at night", icon: "bed-outline" },
  {
    id: "random",
    label: "Random moments",
    sub: "Whenever I feel overwhelmed",
    icon: "time-outline",
  },
];

export const FIRST_PRACTICES: {
  id: string;
  label: string;
  text: string;
  icon: IonIconName;
}[] = [
  {
    id: "breathe",
    label: "Breathe with Jesus",
    text: 'Take 3 slow breaths and whisper: "Jesus, I receive Your peace."',
    icon: "fitness-outline",
  },
  {
    id: "scripture",
    label: "Today's Scripture",
    text: "Read today's Scripture slowly and let one word settle.",
    icon: "book-outline",
  },
  {
    id: "share",
    label: "Honest prayer",
    text: "Tell Jesus one thing heavy on your heart.",
    icon: "chatbubble-ellipses-outline",
  },
];

/** Honest product preview — matches live app features (not a sequential week plan). */
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
    title: "Today's devotional",
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

export const ONBOARDING_STEP_LABELS = [
  "Welcome",
  "Name",
  "Heart",
  "Faith",
  "Concerns",
  "Timing",
  "Insight",
  "Support",
  "Scripture",
  "Covenant",
  "Building",
  "Practices",
] as const;

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEP_LABELS.length;

export function getInsightCopy(draft: OnboardingDraft) {
  const heavy =
    draft.concerns.length >= 3 ||
    draft.emotionalState === "anxious" ||
    draft.emotionalState === "weary";

  if (heavy) {
    return {
      headline: "It looks like you're carrying quite a bit right now.",
      sub: "You're not alone. God's peace is available to you — one small step at a time.",
    };
  }

  if (draft.emotionalState === "peaceful") {
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

// Keep draft type import live for consumers that re-export
export type { OnboardingDraft };
