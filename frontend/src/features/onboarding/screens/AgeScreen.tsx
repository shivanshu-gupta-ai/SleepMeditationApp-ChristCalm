import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestion } from "../components/OnboardingQuestion";
import { useOnboarding } from "../OnboardingContext";
import { AGE_QUESTION, AGE_RANGES } from "../copy";

/**
 * Screen 12 — How old are you? (single)
 * Stores draft.ageRange
 */
export function AgeScreen() {
  const { draft, setSingle } = useOnboarding();
  const { spacing } = useTheme();

  return (
    <View style={[styles.root, { paddingHorizontal: spacing.md }]} testID="onboarding-screen-age">
      <OnboardingQuestion title={AGE_QUESTION.title} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 4, paddingBottom: 8 },
});

export default AgeScreen;
