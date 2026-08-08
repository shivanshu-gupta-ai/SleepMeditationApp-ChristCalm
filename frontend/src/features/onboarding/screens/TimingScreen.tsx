import React from "react";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestionScreen } from "../components/OnboardingQuestionScreen";
import { useOnboarding } from "../OnboardingContext";
import { PREFERRED_TIMES, TIMING_QUESTION } from "../copy";

/**
 * Screen 9 — When do you most need peace? (single)
 */
export function TimingScreen() {
  const { draft, setSingle } = useOnboarding();

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
          selected={draft.preferredTime === opt.id}
          onPress={() => setSingle("preferredTime", opt.id)}
          testID={`time-${opt.id}`}
        />
      ))}
    </OnboardingQuestionScreen>
  );
}

export default TimingScreen;
