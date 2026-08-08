import React from "react";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestionScreen } from "../components/OnboardingQuestionScreen";
import { useOnboarding } from "../OnboardingContext";
import { FAITH_QUESTION, FAITH_STAGES } from "../copy";

/**
 * Screen 7 — Where are you in your faith journey? (single)
 */
export function FaithScreen() {
  const { draft, setSingle } = useOnboarding();

  return (
    <OnboardingQuestionScreen
      variant="choice"
      title={FAITH_QUESTION.title}
      subtitle={FAITH_QUESTION.sub}
      testID="onboarding-screen-faith"
    >
      {FAITH_STAGES.map((opt) => (
        <OnboardingOption
          key={opt.id}
          icon={opt.icon}
          label={opt.label}
          sub={opt.sub}
          selected={draft.faithStage === opt.id}
          onPress={() => setSingle("faithStage", opt.id)}
          testID={`faith-option-${opt.id}`}
        />
      ))}
    </OnboardingQuestionScreen>
  );
}

export default FaithScreen;
