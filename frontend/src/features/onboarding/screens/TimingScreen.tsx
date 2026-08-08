import React from "react";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestionScreen } from "../components/OnboardingQuestionScreen";
import { useOnboarding } from "../OnboardingContext";
import { PREFERRED_TIMES, TIMING_QUESTION } from "../copy";

/**
 * Screen 9 — When do you most need peace? (multi-select)
 */
export function TimingScreen() {
  const { draft, toggleMulti } = useOnboarding();

  return (
    <OnboardingQuestionScreen
      variant="choice"
      title={TIMING_QUESTION.title}
      subtitle={TIMING_QUESTION.sub}
      testID="onboarding-screen-timing"
    >
      {PREFERRED_TIMES.map((opt) => (
        <OnboardingOption
          key={opt.id}
          icon={opt.icon}
          label={opt.label}
          labelLines={2}
          multi
          selected={draft.preferredTime.includes(opt.id)}
          onPress={() => toggleMulti("preferredTime", opt.id)}
          testID={`time-${opt.id}`}
        />
      ))}
    </OnboardingQuestionScreen>
  );
}

export default TimingScreen;
