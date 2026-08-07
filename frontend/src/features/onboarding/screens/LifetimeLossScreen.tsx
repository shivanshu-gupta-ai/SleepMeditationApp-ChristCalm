import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { useOnboarding } from "../OnboardingContext";
import { LIFETIME_LOSS_COPY } from "../copy";
import { deriveLifetimeStats } from "../lifetimeStats";
import { GRACE_DISPLAY } from "../mascot/graceAssets";

/**
 * Screen 16 — Lifetime Loss (shock)
 * Spacious: lead + big number + one punch line.
 */
export function LifetimeLossScreen() {
  const { draft } = useOnboarding();
  const { colors, fonts, spacing, isDark } = useTheme();
  const { lostYears } = useMemo(() => deriveLifetimeStats(draft), [draft]);

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
          fontFamily: fonts.body,
          fontSize: 16,
          lineHeight: 24,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.xl,
        },
        years: {
          fontFamily: fonts.headingBold,
          fontSize: 80,
          lineHeight: 88,
          letterSpacing: -2.5,
          color: isDark ? "#E89B6E" : "#C45C3A",
          textAlign: "center",
          marginTop: spacing.md,
        },
        yearsUnit: {
          fontFamily: fonts.headingBold,
          fontSize: 26,
          letterSpacing: -0.5,
          color: isDark ? "#E89B6E" : "#C45C3A",
        },
        ofLife: {
          fontFamily: fonts.bodyBold,
          fontSize: 17,
          lineHeight: 24,
          color: colors.textPrimary,
          textAlign: "center",
          marginTop: spacing.sm,
          maxWidth: 280,
        },
        line: {
          fontFamily: fonts.scriptureItalic,
          fontStyle: "italic",
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.xl,
          maxWidth: 280,
        },
      }),
    [colors, fonts, spacing, isDark]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-lifetimeLoss">
      <GraceMoodImage
        mood="tracktospend"
        profile="idleHeavy"
        glowTone="muted"
        size={GRACE_DISPLAY.question}
        testID="grace-lifetime-loss"
      />
      <Text style={styles.lead}>{LIFETIME_LOSS_COPY.lead}</Text>
      <Text style={styles.years} accessibilityRole="text">
        {lostYears}
        <Text style={styles.yearsUnit}> years</Text>
      </Text>
      <Text style={styles.ofLife}>{LIFETIME_LOSS_COPY.ofLife}</Text>
      <Text style={styles.line}>{LIFETIME_LOSS_COPY.line}</Text>
    </View>
  );
}

export default LifetimeLossScreen;
