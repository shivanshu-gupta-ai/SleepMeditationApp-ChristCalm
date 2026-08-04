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
  headline: "Welcome to ChristCalm",
  scripture: "Peace I leave with you; my peace I give you.",
  reference: "John 14:27",
  supporting: "Grace walks with you.",
  /** @deprecated use supporting */
  sub: "Grace walks with you.",
  cta: "Begin My Journey",
} as const;

/** Four-screen visual intro carousel (welcome + benefits). */
export const INTRO_SLIDES = [
  {
    id: "welcome" as const,
    pageIndex: 0,
    overline: "A sacred space",
    headline: "Welcome to ChristCalm",
    scripture: "Peace I leave with you; my peace I give you.",
    reference: "John 14:27",
    supporting: "Grace walks with you.",
    variant: "welcome" as const,
    cta: "Begin My Journey",
  },
  {
    id: "benefit1" as const,
    pageIndex: 1,
    overline: "A quieter mind",
    headline: "Step out of the noise. Rest in His peace.",
    supporting:
      "Gentle Christian meditations help you slow down and become still.",
    variant: "noise" as const,
    cta: "Continue",
  },
  {
    id: "benefit2" as const,
    pageIndex: 2,
    overline: "Rooted in Scripture",
    headline: "Let His Word settle your heart.",
    supporting:
      "Guided Scripture, prayer and reflection for difficult moments.",
    variant: "scripture" as const,
    cta: "Continue",
  },
  {
    id: "benefit3" as const,
    pageIndex: 3,
    overline: "Made for your season",
    headline: "Support that meets you where you are.",
    supporting:
      "Personalized around your emotions, faith journey and daily rhythm.",
    variant: "personal" as const,
    cta: "Personalize My Journey",
  },
] as const;

/** @deprecated prefer INTRO_SLIDES — kept for any legacy imports */
export const BENEFIT_SLIDES = [
  {
    id: "benefit1" as const,
    index: 0,
    lead: INTRO_SLIDES[1].headline,
    body: INTRO_SLIDES[1].supporting,
  },
  {
    id: "benefit2" as const,
    index: 1,
    lead: INTRO_SLIDES[2].headline,
    body: INTRO_SLIDES[2].supporting,
  },
  {
    id: "benefit3" as const,
    index: 2,
    lead: INTRO_SLIDES[3].headline,
    body: INTRO_SLIDES[3].supporting,
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
  sub: "Pick what fits best.",
} as const;

/** 4 core states — anxiety, overload, weariness, distance (ChristCalm’s lane). */
export const EMOTIONAL_STATES: OnboardingChoice[] = [
  { id: "anxious", label: "Anxious", sub: "Mind won’t quiet", icon: "water-outline" },
  { id: "overwhelmed", label: "Overwhelmed", sub: "Too much at once", icon: "layers-outline" },
  { id: "weary", label: "Weary", sub: "Running on empty", icon: "moon-outline" },
  { id: "lonely", label: "Lonely", sub: "Distant from God", icon: "person-outline" },
];

export const FAITH_QUESTION = {
  title: "Where are you in your faith?",
  sub: "No wrong answer.",
} as const;

/** 4 stages that cover seeker → struggle without overload. */
export const FAITH_STAGES: OnboardingChoice[] = [
  { id: "seeking", label: "Seeking", sub: "Exploring faith", icon: "compass-outline" },
  { id: "growing", label: "Growing", sub: "Deepening daily", icon: "trending-up-outline" },
  { id: "returning", label: "Returning", sub: "Coming back", icon: "refresh-outline" },
  { id: "struggling", label: "Struggling", sub: "Doubt or distance", icon: "cloudy-outline" },
];

export const CONCERNS_QUESTION = {
  title: "What weighs on your heart?",
  sub: "Select what feels true.",
} as const;

/** 4 concerns the app can actually serve. */
export const CONCERNS: OnboardingChoice[] = [
  { id: "anxiety", label: "Anxiety & overthinking", icon: "water-outline" },
  { id: "sleep", label: "Sleep & rest", icon: "bed-outline" },
  { id: "overwhelm", label: "Overwhelm", icon: "layers-outline" },
  { id: "faith_purpose", label: "Faith & nearness to God", icon: "compass-outline" },
];

export const TIMING_QUESTION = {
  title: "When do you most need peace?",
  sub: "We’ll meet you there.",
} as const;

/** 4 moments that drive meditation + sleep product use. */
export const PREFERRED_TIMES: OnboardingChoice[] = [
  { id: "morning", label: "Morning", icon: "sunny-outline" },
  { id: "evening", label: "Evening", icon: "moon-outline" },
  { id: "before_sleep", label: "Before sleep", icon: "bed-outline" },
  { id: "anxiety_hits", label: "When anxiety hits", icon: "flash-outline" },
];

export const SUPPORT_QUESTION = {
  title: "How can ChristCalm support you?",
  sub: "Choose what matters most.",
} as const;

/** 4 product pillars. */
export const DESIRED_SUPPORT: OnboardingChoice[] = [
  { id: "guided_meditations", label: "Guided meditations", icon: "headset-outline" },
  { id: "scripture_hold", label: "Scripture for hard moments", icon: "book-outline" },
  { id: "sleep_peace", label: "Peaceful sleep", icon: "bed-outline" },
  { id: "short_prayers", label: "Short prayers", icon: "hand-left-outline" },
];

// —— 11–15 ——

export const DID_YOU_KNOW = {
  title: "Did you know?",
  sub: "You’re not alone in this.",
  facts: [
    {
      text: "The average person loses 2+ hours a day to overthinking.",
      icon: "time-outline" as const,
    },
    {
      text: "That’s ~700 hours a year — almost a full month of mental noise.",
      icon: "calendar-outline" as const,
    },
    {
      text: "1 in 3 adults wrestle with anxiety week to week.",
      icon: "water-outline" as const,
    },
    {
      text: "Just 10 minutes of stillness can interrupt the spiral.",
      icon: "leaf-outline" as const,
    },
  ],
} as const;

export const AGE_QUESTION = {
  title: "How old are you?",
} as const;

/** 4 broad bands — enough for personalization, not a census. */
export const AGE_RANGES: OnboardingChoice[] = [
  { id: "18_24", label: "18–24", icon: "sunny-outline" },
  { id: "25_34", label: "25–34", icon: "partly-sunny-outline" },
  { id: "35_54", label: "35–54", icon: "moon-outline" },
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
  /** @deprecated use reviews[0] */
  quote: "I didn't realize how much peace I was losing.",
  /** @deprecated use reviews[0] */
  attribution: "— Rachel",
  reviews: [
    {
      quote: "I didn't realize how much peace I was losing.",
      name: "Rachel",
      meta: "Anxiety & rest",
      stars: 5,
    },
    {
      quote: "The overthinking got quieter. I sleep without replaying the day.",
      name: "Marcus",
      meta: "2 months with ChristCalm",
      stars: 5,
    },
    {
      quote: "Scripture finally feels near again — not another task on my list.",
      name: "Elena",
      meta: "Faith & stillness",
      stars: 5,
    },
    {
      quote: "Ten minutes at night changed my mornings. I'm less heavy.",
      name: "David",
      meta: "Evening practice",
      stars: 5,
    },
    {
      quote: "I used to carry every worry alone. This app helped me lay it down.",
      name: "Priya",
      meta: "Overthinking",
      stars: 5,
    },
    {
      quote: "Gentle, not gimmicky. Peace without the pressure.",
      name: "James",
      meta: "App Store review",
      stars: 5,
    },
  ],
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

/** Screen 26 — How the app works */
export const HOW_APP_WORKS_COPY = {
  title: "How ChristCalm works",
  sub: "Simple tools for peace, when you need them.",
  cta: "Start my journey",
  cards: [
    {
      id: "emotions",
      icon: "happy-outline" as const,
      title: "Emotion meditations",
      sub: "Pick how you feel. Get a short, Scripture-led calm.",
    },
    {
      id: "sos",
      icon: "heart" as const,
      title: "SOS breath",
      sub: "One tap when panic hits — 4-7-8 with verses.",
    },
    {
      id: "scripture",
      icon: "book-outline" as const,
      title: "Today's Scripture",
      sub: "A daily verse and reflection.",
    },
    {
      id: "wisdom",
      icon: "chatbubbles-outline" as const,
      title: "What would Jesus say?",
      sub: "Ask, and receive wise, grounded counsel.",
    },
    {
      id: "journal",
      icon: "create-outline" as const,
      title: "Journal",
      sub: "Write freely. Private to you.",
    },
  ],
} as const;
