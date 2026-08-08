import React from "react";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestionScreen } from "../components/OnboardingQuestionScreen";
import { useOnboarding } from "../OnboardingContext";
import { DESIRED_SUPPORT, SUPPORT_QUESTION } from "../copy";

/**
 * Screen 10 — How would you like ChristCalm to support you? (multi-select)
 */
export function SupportScreen() {
  const { draft, toggleMulti } = useOnboarding();

  return (
    <OnboardingQuestionScreen
      variant="choice"
      title={SUPPORT_QUESTION.title}
      subtitle={SUPPORT_QUESTION.sub}
      testID="onboarding-screen-support"
    >
      {DESIRED_SUPPORT.map((opt) => (
        <OnboardingOption
          key={opt.id}
          icon={opt.icon}
          label={opt.label}
          multi
          labelLines={2}
          selected={draft.desiredSupport.includes(opt.id)}
          onPress={() => toggleMulti("desiredSupport", opt.id)}
          testID={`support-${opt.id}`}
        />
      ))}
    </OnboardingQuestionScreen>
  );
}

export default SupportScreen;
