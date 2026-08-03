import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingOption } from "../components/OnboardingOption";
import { OnboardingQuestion } from "../components/OnboardingQuestion";
import { useOnboarding } from "../OnboardingContext";
import { PREFERRED_TIMES, TIMING_QUESTION } from "../copy";

/**
 * Screen 9 — When do you most need peace? (single)
 * Answers → draft.preferredTime via OnboardingContext
 */
export function TimingScreen() {
  const { draft, setSingle } = useOnboarding();
  const { spacing } = useTheme();

  return (
    <View style={[styles.root, { paddingHorizontal: spacing.md }]} testID="onboarding-screen-timing">
      <OnboardingQuestion title={TIMING_QUESTION.title} subtitle={TIMING_QUESTION.sub} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 4, paddingBottom: 8 },
});

export default TimingScreen;
