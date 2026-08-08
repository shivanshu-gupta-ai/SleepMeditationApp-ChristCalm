import React from "react";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestionScreen } from "../components/OnboardingQuestionScreen";
import { useOnboarding } from "../OnboardingContext";
import { AGE_QUESTION, AGE_RANGES } from "../copy";

/**
 * Screen 12 — How old are you? (single)
 */
export function AgeScreen() {
  const { draft, setSingle } = useOnboarding();

  return (
    <OnboardingQuestionScreen
      variant="choice"
      title={AGE_QUESTION.title}
      testID="onboarding-screen-age"
    >
      {AGE_RANGES.map((opt) => (
        <OnboardingOption
          key={opt.id}
          icon={opt.icon}
          label={opt.label}
          selected={draft.ageRange === opt.id}
          onPress={() => setSingle("ageRange", opt.id)}
          testID={`age-${opt.id}`}
        />
      ))}
    </OnboardingQuestionScreen>
  );
}

export default AgeScreen;
