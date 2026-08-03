/**
 * Expo Router entry for onboarding.
 * Flow logic lives in `@/src/features/onboarding` (OnboardingNavigator + screens).
 * Design source: docs/product/Onboarding-Design-Spec.md
 */
import { OnboardingNavigator } from "@/src/features/onboarding";

export default function OnboardingRoute() {
  return <OnboardingNavigator />;
}
