export { OnboardingNavigator } from "./OnboardingNavigator";
export {
  OnboardingProvider,
  useOnboarding,
  useOnboardingOptional,
} from "./OnboardingContext";
export { GraceCompanion } from "./components/GraceCompanion";
export { GraceMoodImage } from "./components/GraceMoodImage";
export { OnboardingGrace } from "./components/OnboardingGrace";
export { IntensityMascot, intensityBandFromValue, intensityLabel } from "./components/IntensityMascot";
export {
  GraceActor,
  MOTION_PROFILES,
  graceConfigForRoute,
  profileForExpression,
} from "./mascot";
export { GracePlaceholder } from "./components/GracePlaceholder";
export { OnboardingOption } from "./components/OnboardingOption";
export { ProgressBar } from "./components/ProgressBar";
/** @deprecated Prefer ProgressBar — kept for existing imports */
export { default as OnboardingProgress } from "./components/OnboardingProgress";
export { OnboardingQuestion } from "./components/OnboardingQuestion";
export { default as OnboardingStepLayout, useObStyles } from "./components/OnboardingStepLayout";
export * from "./sequence";
export * from "./types";
export * from "./constants";
export * from "./copy";
export { deriveSpiritualProfile } from "./deriveProfile";
export type { SpiritualProfile } from "./deriveProfile";
export { deriveLifetimeStats } from "./lifetimeStats";
export type { LifetimeStats } from "./lifetimeStats";
export { YearDotGrid } from "./components/YearDotGrid";
export { ScarcityTimer } from "./components/ScarcityTimer";
export { EscalatingPaywall } from "./components/EscalatingPaywall";
export * from "./paywallConfig";
export * from "./screens";
