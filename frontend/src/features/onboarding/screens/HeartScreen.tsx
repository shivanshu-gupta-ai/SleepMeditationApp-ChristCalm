import React from "react";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestionScreen } from "../components/OnboardingQuestionScreen";
import { useOnboarding } from "../OnboardingContext";
import { EMOTIONAL_STATES, HEART_QUESTION } from "../copy";

/**
 * Screen 6 — How has your heart been feeling lately? (multi-select)
 */
export function HeartScreen() {
  const { draft, toggleMulti } = useOnboarding();

  return (
    <OnboardingQuestionScreen
      variant="choice"
      title={HEART_QUESTION.title}
      subtitle={HEART_QUESTION.sub}
      testID="onboarding-screen-heart"
    >
      {EMOTIONAL_STATES.map((opt) => (
        <OnboardingOption
          key={opt.id}
          icon={opt.icon}
          label={opt.label}
          sub={opt.sub}
          multi
          selected={draft.emotionalState.includes(opt.id)}
          onPress={() => toggleMulti("emotionalState", opt.id)}
          testID={`emotion-${opt.id}`}
        />
      ))}
    </OnboardingQuestionScreen>
  );
}

export default HeartScreen;
