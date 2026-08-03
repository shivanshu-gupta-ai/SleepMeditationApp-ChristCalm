import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestion } from "../components/OnboardingQuestion";
import { useOnboarding } from "../OnboardingContext";
import { EMOTIONAL_STATES, HEART_QUESTION } from "../copy";

/**
 * Screen 6 — How has your heart been feeling lately? (multi-select)
 * Answers → draft.emotionalState via OnboardingContext
 */
export function HeartScreen() {
  const { draft, toggleMulti } = useOnboarding();
  const { spacing } = useTheme();

  return (
    <View style={[styles.root, { paddingHorizontal: spacing.md }]} testID="onboarding-screen-heart">
      <OnboardingQuestion title={HEART_QUESTION.title} subtitle={HEART_QUESTION.sub} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 4, paddingBottom: 8 },
});

export default HeartScreen;
