import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestion } from "../components/OnboardingQuestion";
import { useOnboarding } from "../OnboardingContext";
import { CONCERNS, CONCERNS_QUESTION } from "../copy";

/**
 * Screen 8 — What weighs on your heart right now? (multi-select)
 * Answers → draft.concerns via OnboardingContext
 */
export function ConcernsScreen() {
  const { draft, toggleMulti } = useOnboarding();
  const { spacing } = useTheme();

  return (
    <View
      style={[styles.root, { paddingHorizontal: spacing.md }]}
      testID="onboarding-screen-concerns"
    >
      <OnboardingQuestion title={CONCERNS_QUESTION.title} subtitle={CONCERNS_QUESTION.sub} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 4, paddingBottom: 8 },
});

export default ConcernsScreen;
