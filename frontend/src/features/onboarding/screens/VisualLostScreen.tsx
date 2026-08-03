import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useOnboarding } from "../OnboardingContext";
import { YearDotGrid } from "../components/YearDotGrid";
import { VISUAL_LOST_COPY } from "../copy";
import { deriveLifetimeStats } from "../lifetimeStats";

/**
 * Screen 18 — Visual: Time Being Lost
 * Same grid as 17; significant portion filled warm orange (visual lifetime guilt).
 */
export function VisualLostScreen() {
  const { draft } = useOnboarding();
  const { colors, fonts, spacing } = useTheme();
  const { remainingYears, lostYears } = useMemo(
    () => deriveLifetimeStats(draft),
    [draft]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 22,
          lineHeight: 32,
          letterSpacing: -0.4,
          color: colors.textPrimary,
          textAlign: "center",
          marginBottom: spacing.xl,
          maxWidth: 340,
        },
        footer: {
          fontFamily: fonts.bodyMedium,
          fontSize: 15,
          lineHeight: 23,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.xl,
          maxWidth: 320,
        },
      }),
    [colors, fonts, spacing]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-visualLost">
      <Text style={styles.title}>{VISUAL_LOST_COPY.title}</Text>
      <YearDotGrid
        total={remainingYears}
        lostCount={lostYears}
        testID="year-grid-lost"
      />
      <Text style={styles.footer}>{VISUAL_LOST_COPY.footer}</Text>
    </View>
  );
}

export default VisualLostScreen;
