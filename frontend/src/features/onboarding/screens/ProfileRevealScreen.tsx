import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { useOnboarding } from "../OnboardingContext";
import { PROFILE_REVEAL } from "../copy";
import { deriveSpiritualProfile } from "../deriveProfile";

/**
 * Screen 15 — Spiritual Profile Reveal
 * Shows derived season from answers; CTA: "This feels true"
 */
export function ProfileRevealScreen() {
  const { draft } = useOnboarding();
  const { colors, fonts, spacing, radius, shadows } = useTheme();
  const profile = useMemo(() => deriveSpiritualProfile(draft), [draft]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
          alignItems: "center",
        },
        overline: {
          fontFamily: fonts.bodyMedium,
          fontSize: 13,
          letterSpacing: 0.3,
          color: colors.primary,
          textAlign: "center",
          marginTop: spacing.md,
          marginBottom: spacing.sm,
        },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 28,
          lineHeight: 36,
          letterSpacing: -0.6,
          color: colors.textPrimary,
          textAlign: "center",
          marginBottom: spacing.md,
        },
        description: {
          fontFamily: fonts.body,
          fontSize: 16,
          lineHeight: 24,
          color: colors.textSecondary,
          textAlign: "center",
          maxWidth: 340,
          marginBottom: spacing.lg,
        },
        metrics: {
          width: "100%",
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          gap: spacing.md,
          ...shadows.soft,
        },
        metricRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        metricLabel: {
          fontFamily: fonts.body,
          fontSize: 15,
          color: colors.textSecondary,
        },
        metricValue: {
          fontFamily: fonts.bodyBold,
          fontSize: 15,
          color: colors.textPrimary,
        },
        metricHigh: { color: colors.primary },
      }),
    [colors, fonts, spacing, radius, shadows]
  );

  const metrics: { label: string; value: string }[] = [
    { label: "Mental noise", value: profile.mentalNoise },
    { label: "Rest capacity", value: profile.restCapacity },
    { label: "Desire for God's presence", value: profile.desireForGod },
  ];

  return (
    <View style={styles.root} testID="onboarding-screen-profileReveal">
      <GraceMoodImage mood="thoughtful" size={128} testID="grace-profile" />
      <Text style={styles.overline}>{PROFILE_REVEAL.overline}</Text>
      <Text style={styles.title}>{profile.title}</Text>
      <Text style={styles.description}>{profile.description}</Text>
      <View style={styles.metrics}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text
              style={[
                styles.metricValue,
                (m.value === "High" || m.value === "Strong") && styles.metricHigh,
              ]}
            >
              {m.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default ProfileRevealScreen;
