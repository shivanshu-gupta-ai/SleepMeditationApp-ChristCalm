import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useOnboarding } from "../OnboardingContext";
import { YearDotGrid } from "../components/YearDotGrid";
import { VISUAL_REMAINING_COPY } from "../copy";
import { deriveLifetimeStats } from "../lifetimeStats";

/**
 * Screen 17 — Visual: What You Have Left
 * Clean grid of soft gray dots = remaining years.
 * Deliberately spare: inventory before the guilt contrast.
 */
export function VisualRemainingScreen() {
  const { draft } = useOnboarding();
  const { colors, fonts, spacing } = useTheme();
  const { remainingYears } = useMemo(() => deriveLifetimeStats(draft), [draft]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xl,
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 26,
          lineHeight: 34,
          letterSpacing: -0.5,
          color: colors.textPrimary,
          textAlign: "center",
          marginBottom: spacing.xl,
          maxWidth: 300,
        },
      }),
    [colors, fonts, spacing]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-visualRemaining">
      <Text style={styles.title}>{VISUAL_REMAINING_COPY.title}</Text>
      <YearDotGrid total={remainingYears} lostCount={0} testID="year-grid-remaining" />
    </View>
  );
}

export default VisualRemainingScreen;
