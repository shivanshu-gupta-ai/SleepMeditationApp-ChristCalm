import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestion } from "../components/OnboardingQuestion";
import { useOnboarding } from "../OnboardingContext";
import { FAITH_QUESTION, FAITH_STAGES } from "../copy";

/**
 * Screen 7 — Where are you in your faith journey? (single)
 * Answers → draft.faithStage via OnboardingContext
 */
export function FaithScreen() {
  const { draft, setSingle } = useOnboarding();
  const { spacing } = useTheme();

  return (
    <View style={[styles.root, { paddingHorizontal: spacing.md }]} testID="onboarding-screen-faith">
      <OnboardingQuestion title={FAITH_QUESTION.title} subtitle={FAITH_QUESTION.sub} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 4, paddingBottom: 8 },
});

export default FaithScreen;
