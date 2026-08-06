/**
 * Onboarding architecture types — aligned with
 * docs/product/Onboarding-Design-Spec.md (v3.1).
 */

export type OnboardingRouteId =
  | "splash"
  | "welcome"
  | "benefit1"
  | "benefit2"
  | "benefit3"
  | "name"
  | "heart"
  | "faith"
  | "concerns"
  | "timing"
  | "support"
  | "didYouKnow"
  | "age"
  | "intensity"
  | "calculating"
  | "profileReveal"
  | "lifetimeLoss"
  | "visualRemaining"
  | "visualLost"
  | "yearsReclaim"
  | "socialProof"
  | "commitment"
  | "statsPreview"
  | "paywallFull"
  | "paywall50"
  | "paywall80"
  | "howAppWorks";

export type OnboardingScreenType =
  | "static"
  | "hook"
  | "value"
  | "input"
  | "multi-select"
  | "single"
  | "slider"
  | "education"
  | "loading"
  | "result"
  | "shock"
  | "visualization"
  | "hope"
  | "trust"
  | "ritual"
  | "motivation"
  | "monetization";

/** Grace expression bands from design §9 */
export type GraceExpression =
  | "welcome"
  | "listening"
  | "thoughtful"
  | "heavy"
  | "hopeful"
  | "committed"
  | "peaceful"
  | "notification"
  | "smile"
  | "anxiety"
  | "fact"
  | "thinking";

export type OnboardingScreenDef = {
  /** Route key / component id */
  id: OnboardingRouteId;
  /** 0-based index in the flow */
  index: number;
  /** Short label for progress chrome */
  label: string;
  type: OnboardingScreenType;
  grace: GraceExpression;
  /** Show continuous progress bar */
  showProgress: boolean;
  /** Allow back navigation (may be overridden by paywall rules) */
  showBack: boolean;
  /** Primary CTA copy; empty hides primary footer CTA (e.g. auto-advance) */
  ctaLabel: string;
  /** Optional secondary link under primary CTA */
  secondaryCtaLabel?: string;
};

/**
 * Screens prefer useOnboarding() for draft + navigation.
 * Props type kept empty for consistency / future overrides.
 */
export type OnboardingScreenProps = Record<string, never>;
