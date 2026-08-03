import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestion } from "../components/OnboardingQuestion";
import { useOnboarding } from "../OnboardingContext";
import { DESIRED_SUPPORT, SUPPORT_QUESTION } from "../copy";

/**
 * Screen 10 — How would you like ChristCalm to support you? (multi-select)
 * Answers → draft.desiredSupport via OnboardingContext
 */
export function SupportScreen() {
  const { draft, toggleMulti } = useOnboarding();
  const { spacing } = useTheme();

  return (
    <View
      style={[styles.root, { paddingHorizontal: spacing.md }]}
      testID="onboarding-screen-support"
    >
      <OnboardingQuestion title={SUPPORT_QUESTION.title} subtitle={SUPPORT_QUESTION.sub} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 4, paddingBottom: 8 },
});

export default SupportScreen;
