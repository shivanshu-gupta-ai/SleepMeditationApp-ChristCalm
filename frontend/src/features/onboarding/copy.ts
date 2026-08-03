/**
 * Onboarding copy — short, spacious, design-audited for visual breathing room.
 * Prefer: headline + optional one short supporting line.
 */

import type { IonIconName } from "@/src/constants/emotion-icons";

export type OnboardingChoice = {
  id: string;
  label: string;
  sub?: string;
  icon: IonIconName;
};

// —— 0–5 ——

export const WELCOME_COPY = {
  overline: "A sacred space",
  headline: "Peace I leave with you; my peace I give you.",
  reference: "John 14:27",
  sub: "Grace walks with you.",
  cta: "Begin My Journey",
} as const;

export const BENEFIT_SLIDES = [
  {
    id: "benefit1" as const,
    index: 0,
    lead: "Stop the noise.",
    body: "Find peace that stays.",
  },
  {
    id: "benefit2" as const,
    index: 1,
    lead: "Heal your mind.",
    body: "Scripture-rooted rest.",
  },
  {
    id: "benefit3" as const,
    index: 2,
    lead: "Make it personal.",
    body: "Matched to how you feel.",
  },
] as const;

export const NAME_COPY = {
  title: "What should I call you?",
  sub: "So Grace can speak to you.",
  placeholder: "Your name",
  friendLink: "Call me Friend",
} as const;

// —— 6–10 ——

export const HEART_QUESTION = {
  title: "How has your heart been feeling?",
  sub: "Select all that fit.",
} as const;

export const EMOTIONAL_STATES: OnboardingChoice[] = [
  { id: "weary", label: "Weary", sub: "Running on empty", icon: "moon-outline" },
  { id: "anxious", label: "Anxious", sub: "Mind won't quiet", icon: "water-outline" },
  { id: "numb", label: "Numb", sub: "Going through motions", icon: "remove-circle-outline" },
  { id: "overwhelmed", label: "Overwhelmed", sub: "Too much", icon: "layers-outline" },
  {
    id: "hopeful_tired",
    label: "Hopeful but tired",
    sub: "Want peace again",
    icon: "partly-sunny-outline",
  },
  { id: "peaceful", label: "Peaceful", sub: "In a good place", icon: "flower-outline" },
  { id: "lonely", label: "Lonely", sub: "Distant from God", icon: "person-outline" },
  { id: "restless", label: "Restless", sub: "Can't settle", icon: "flash-outline" },
];

export const FAITH_QUESTION = {
  title: "Where are you in your faith?",
  sub: "No wrong answer.",
} as const;

export const FAITH_STAGES: OnboardingChoice[] = [
  { id: "seeking", label: "Seeking", sub: "Exploring", icon: "compass-outline" },
  { id: "new", label: "New to faith", sub: "Just beginning", icon: "leaf-outline" },
  { id: "growing", label: "Growing", sub: "Deepening", icon: "trending-up-outline" },
  { id: "returning", label: "Returning", sub: "Coming back", icon: "refresh-outline" },
  { id: "deep", label: "Deeply rooted", sub: "Faith is central", icon: "heart-outline" },
  { id: "struggling", label: "Struggling", sub: "Doubt or distance", icon: "cloudy-outline" },
];

export const CONCERNS_QUESTION = {
  title: "What weighs on your heart?",
  sub: "Select all that feel true.",
} as const;

export const CONCERNS: OnboardingChoice[] = [
  { id: "anxiety", label: "Anxiety & Fear", icon: "water-outline" },
  { id: "sleep", label: "Sleep & Rest", icon: "bed-outline" },
  { id: "grief", label: "Grief or Loss", icon: "heart-outline" },
  { id: "loneliness", label: "Loneliness", icon: "person-outline" },
  { id: "overwhelm", label: "Overwhelm", icon: "layers-outline" },
  { id: "faith_purpose", label: "Faith & Purpose", icon: "compass-outline" },
  { id: "relationships", label: "Relationships", icon: "people-outline" },
  { id: "guilt_shame", label: "Guilt or Shame", icon: "hand-left-outline" },
  { id: "decision_fatigue", label: "Decision fatigue", icon: "git-branch-outline" },
  { id: "far_from_god", label: "Far from God", icon: "cloudy-night-outline" },
];

export const TIMING_QUESTION = {
  title: "When do you most need peace?",
  sub: "We'll meet you there.",
} as const;

export const PREFERRED_TIMES: OnboardingChoice[] = [
  { id: "morning", label: "Morning", icon: "sunny-outline" },
  { id: "midday", label: "Midday", icon: "partly-sunny-outline" },
  { id: "evening", label: "Evening", icon: "moon-outline" },
  { id: "before_sleep", label: "Before sleep", icon: "bed-outline" },
  { id: "anxiety_hits", label: "When anxiety hits", icon: "flash-outline" },
  { id: "all_day", label: "All day", icon: "time-outline" },
];

export const SUPPORT_QUESTION = {
  title: "How can ChristCalm support you?",
  sub: "Choose what matters most.",
} as const;

export const DESIRED_SUPPORT: OnboardingChoice[] = [
  { id: "guided_meditations", label: "Guided meditations", icon: "headset-outline" },
  { id: "scripture_hold", label: "Scripture for hard moments", icon: "book-outline" },
  { id: "short_prayers", label: "Short prayers", icon: "hand-left-outline" },
  { id: "sleep_peace", label: "Peaceful sleep", icon: "bed-outline" },
  { id: "encouragement_distance", label: "When I feel distant", icon: "sparkles-outline" },
  { id: "wisdom_decisions", label: "Wisdom for daily life", icon: "bulb-outline" },
  { id: "not_alone", label: "Not walking alone", icon: "people-outline" },
  { id: "gentle_reminders", label: "Gentle stillness reminders", icon: "notifications-outline" },
];

// —— 11–15 ——

export const DID_YOU_KNOW = {
  title: "Did you know?",
  facts: [
    "Most people check their phone 50+ times a day",
    "Noise makes it harder to hear God",
    "Short daily stillness can change a whole day",
    "You don't have to carry it alone",
  ],
} as const;

export const AGE_QUESTION = {
  title: "How old are you?",
} as const;

export const AGE_RANGES: OnboardingChoice[] = [
  { id: "under_18", label: "Under 18", icon: "leaf-outline" },
  { id: "18_24", label: "18–24", icon: "sunny-outline" },
  { id: "25_34", label: "25–34", icon: "partly-sunny-outline" },
  { id: "35_44", label: "35–44", icon: "moon-outline" },
  { id: "45_54", label: "45–54", icon: "star-outline" },
  { id: "55_plus", label: "55+", icon: "flower-outline" },
];

export const INTENSITY_QUESTION = {
  title: "How heavy does your mind feel?",
  sub: "Be honest with yourself.",
  lowLabel: "Light",
  highLabel: "Overwhelming",
} as const;

export const CALCULATING_STEPS = [
  "Listening…",
  "Understanding…",
  "Preparing…",
] as const;

export const PROFILE_REVEAL = {
  overline: "Your season",
  cta: "This feels true",
} as const;

// —— 16–19 ——

export const LIFETIME_LOSS_COPY = {
  lead: "You're on track to spend",
  ofLife: "carrying this weight alone.",
  /** Optional single punch line — keep empty for max space */
  line: "Years of peace you may never fully taste.",
} as const;

export const VISUAL_REMAINING_COPY = {
  title: "What you have left.",
} as const;

export const VISUAL_LOST_COPY = {
  title: "What noise and anxiety will take.",
  footer: "Years you don't get back.",
} as const;

export const YEARS_RECLAIM_COPY = {
  lead: "The good news…",
  mid: "You can reclaim",
  ofPeace: "of peace and presence.",
  line: (n: number) => `${n} years living from rest—not pressure.`,
} as const;

// —— 20–22 ——

export const SOCIAL_PROOF_COPY = {
  title: "Made for people like you.",
  rating: "4.8",
  stars: "★★★★★",
  community: "12,400+ on this journey",
  quote: "I didn't realize how much peace I was losing.",
  attribution: "— Rachel",
} as const;

export const COMMITMENT_COPY = {
  title: "Ready?",
  instruction: "Hold to reclaim your peace.",
  holding: "Keep holding…",
  doneTitle: "You're committed.",
  doneSub: "The hardest step is done.",
  holdLabel: "Hold to commit",
} as const;

export const STATS_PREVIEW_COPY = {
  beforeTitle: "Before",
  beforeLine: "Noise · Poor rest · Distance",
  afterTitle: "After",
  afterLine: "Quiet · Deep rest · Nearness",
  footer: "Thousands stopped losing years.",
} as const;
