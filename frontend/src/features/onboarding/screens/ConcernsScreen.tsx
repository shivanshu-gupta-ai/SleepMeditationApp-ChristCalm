import React from "react";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestionScreen } from "../components/OnboardingQuestionScreen";
import { useOnboarding } from "../OnboardingContext";
import { CONCERNS, CONCERNS_QUESTION } from "../copy";

/**
 * Screen 8 — What weighs on your heart right now? (multi-select)
 */
export function ConcernsScreen() {
  const { draft, toggleMulti } = useOnboarding();

  return (
    <OnboardingQuestionScreen
      title={CONCERNS_QUESTION.title}
      subtitle={CONCERNS_QUESTION.sub}
      testID="onboarding-screen-concerns"
    >
      {CONCERNS.map((opt) => (
        <OnboardingOption
          key={opt.id}
          icon={opt.icon}
          label={opt.label}
          multi
          selected={draft.concerns.includes(opt.id)}
          onPress={() => toggleMulti("concerns", opt.id)}
          testID={`concern-${opt.id}`}
        />
      ))}
    </OnboardingQuestionScreen>
  );
}

export default ConcernsScreen;
