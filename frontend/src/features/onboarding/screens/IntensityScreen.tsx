import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { OnboardingQuestion } from "../components/OnboardingQuestion";
import { useOnboarding } from "../OnboardingContext";
import { INTENSITY_QUESTION } from "../copy";

/**
 * Screen 13 — Intensity slider (0–10)
 * Light → Overwhelming. Stores draft.dailyLoad.
 * Grace mood softens/heavies with value (idle vs wave as stand-in).
 */
export function IntensityScreen() {
  const { draft, setSingle } = useOnboarding();
  const { colors, fonts, spacing, radius } = useTheme();

  // Default to mid if unset so first render is honest middle ground
  const value = draft.dailyLoad ?? 5;

  useEffect(() => {
    if (draft.dailyLoad == null) {
      setSingle("dailyLoad", 5);
    }
  }, [draft.dailyLoad, setSingle]);

  const mood = value <= 4 ? ("hopeful" as const) : value <= 7 ? ("listening" as const) : ("heavy" as const);
  const weightLabel =
    value <= 2 ? "Light" : value <= 5 ? "Manageable" : value <= 7 ? "Heavy" : "Overwhelming";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          alignItems: "center",
        },
        graceWrap: { marginBottom: spacing.md, marginTop: spacing.sm },
        weight: {
          fontFamily: fonts.bodyBold,
          fontSize: 18,
          color: colors.primary,
          marginBottom: spacing.lg,
          letterSpacing: -0.2,
        },
        sliderBlock: {
          width: "100%",
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSoft,
        },
        labels: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: spacing.sm,
        },
        endLabel: {
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.textSecondary,
        },
        valueRow: {
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: spacing.sm,
        },
        valueText: {
          fontFamily: fonts.headingBold,
          fontSize: 32,
          color: colors.textPrimary,
          letterSpacing: -0.8,
        },
        ofTen: {
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textMuted,
          alignSelf: "flex-end",
          marginBottom: 6,
          marginLeft: 4,
        },
      }),
    [colors, fonts, spacing, radius]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-intensity">
      <OnboardingQuestion
        title={INTENSITY_QUESTION.title}
        subtitle={INTENSITY_QUESTION.sub}
        center
        density="roomy"
      />
      <View style={styles.graceWrap}>
        <GraceMoodImage mood={mood} size={120} testID="grace-intensity" />
      </View>
      <Text style={styles.weight}>{weightLabel}</Text>

      <View style={styles.sliderBlock}>
        <View style={styles.valueRow}>
          <Text style={styles.valueText}>{value}</Text>
          <Text style={styles.ofTen}>/ 10</Text>
        </View>
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={value}
          onValueChange={(v) => setSingle("dailyLoad", Math.round(v))}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.borderSoft}
          thumbTintColor={colors.primary}
          testID="onboarding-intensity-slider"
          accessibilityLabel={INTENSITY_QUESTION.title}
        />
        <View style={styles.labels}>
          <Text style={styles.endLabel}>{INTENSITY_QUESTION.lowLabel}</Text>
          <Text style={styles.endLabel}>{INTENSITY_QUESTION.highLabel}</Text>
        </View>
      </View>
    </View>
  );
}

export default IntensityScreen;
