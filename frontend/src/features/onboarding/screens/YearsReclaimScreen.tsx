import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { useOnboarding } from "../OnboardingContext";
import { YEARS_RECLAIM_COPY } from "../copy";
import { deriveLifetimeStats } from "../lifetimeStats";
import { GRACE_DISPLAY } from "../mascot/graceAssets";

/**
 * Screen 19 — Years You Can Reclaim (hope)
 * Spacious: lead + mid + big number + one line.
 */
export function YearsReclaimScreen() {
  const { draft } = useOnboarding();
  const { colors, fonts, spacing, isDark } = useTheme();
  const { reclaimYears } = useMemo(() => deriveLifetimeStats(draft), [draft]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          alignItems: "center",
          justifyContent: "center",
        },
        lead: {
          fontFamily: fonts.bodyMedium,
          fontSize: 14,
          letterSpacing: 0.3,
          color: colors.primary,
          textAlign: "center",
          marginTop: spacing.xl,
        },
        mid: {
          fontFamily: fonts.body,
          fontSize: 16,
          lineHeight: 24,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.sm,
        },
        years: {
          fontFamily: fonts.headingBold,
          fontSize: 80,
          lineHeight: 88,
          letterSpacing: -2.5,
          color: isDark ? colors.success : "#3D9B7A",
          textAlign: "center",
          marginTop: spacing.md,
        },
        yearsUnit: {
          fontFamily: fonts.headingBold,
          fontSize: 26,
          letterSpacing: -0.5,
          color: isDark ? colors.success : "#3D9B7A",
        },
        ofPeace: {
          fontFamily: fonts.bodyBold,
          fontSize: 17,
          lineHeight: 24,
          color: colors.textPrimary,
          textAlign: "center",
          marginTop: spacing.sm,
          maxWidth: 280,
        },
        line: {
          fontFamily: fonts.body,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.xl,
          maxWidth: 300,
        },
      }),
    [colors, fonts, spacing, isDark]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-yearsReclaim">
      <GraceMoodImage
        mood="happy1"
        profile="idleHopeful"
        glowTone="gold"
        enterReact="celebrate"
        size={GRACE_DISPLAY.question}
        testID="grace-years-reclaim"
      />
      <Text style={styles.lead}>{YEARS_RECLAIM_COPY.lead}</Text>
      <Text style={styles.mid}>{YEARS_RECLAIM_COPY.mid}</Text>
      <Text style={styles.years} accessibilityRole="text">
        {reclaimYears}
        <Text style={styles.yearsUnit}> years</Text>
      </Text>
      <Text style={styles.ofPeace}>{YEARS_RECLAIM_COPY.ofPeace}</Text>
      <Text style={styles.line}>{YEARS_RECLAIM_COPY.line(reclaimYears)}</Text>
    </View>
  );
}

export default YearsReclaimScreen;
