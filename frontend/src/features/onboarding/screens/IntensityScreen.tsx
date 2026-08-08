import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { useTheme } from "@/src/context/ThemeContext";
import { IntensityMascot } from "../components/IntensityMascot";
import { OnboardingQuestionScreen } from "../components/OnboardingQuestionScreen";
import { useOnboarding } from "../OnboardingContext";
import { INTENSITY_QUESTION } from "../copy";
import { playHaptic } from "@/src/utils/haptics";
import { useResponsive } from "@/src/hooks/use-responsive";
import { GRACE_DISPLAY } from "../mascot/graceAssets";

/**
 * Screen 13 — Intensity slider with interactive mascot.
 * Every integer score from 0–10 has its own Grace emotion state.
 */
export function IntensityScreen() {
  const { draft, setSingle } = useOnboarding();
  const { colors, fonts, spacing, radius } = useTheme();
  const { height, isTablet } = useResponsive();

  const value = draft.dailyLoad ?? 5;
  const mascotSize =
    !isTablet && height < 720
      ? GRACE_DISPLAY.stageCompact
      : isTablet
        ? GRACE_DISPLAY.stageTablet
        : GRACE_DISPLAY.stage;

  useEffect(() => {
    if (draft.dailyLoad == null) {
      setSingle("dailyLoad", 5);
    }
  }, [draft.dailyLoad, setSingle]);

  const trackColor =
    value <= 4
      ? colors.primary
      : value <= 6
        ? colors.secondary
        : colors.danger;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ translateY: -spacing.lg * 6 }],
        },
        mascotPlacement: {
          marginTop: spacing.sm,
          marginBottom: spacing.md,
        },
        sliderBlock: {
          width: "100%",
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          marginTop: spacing.md,
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
        bandHint: {
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
          textAlign: "center",
          marginTop: spacing.md,
        },
      }),
    [colors, fonts, spacing, radius]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-intensity">
      <View style={styles.mascotPlacement}>
        <IntensityMascot value={value} size={mascotSize} testID="grace-intensity" />
      </View>

      <OnboardingQuestionScreen
        variant="focus"
        title={INTENSITY_QUESTION.title}
        subtitle={INTENSITY_QUESTION.sub}
        showGrace={false}
        style={{
          flex: 0,
          marginTop: spacing.xl * 5,
          paddingHorizontal: 0,
          paddingTop: 0,
        }}
      >
        <View style={styles.sliderBlock}>
          <View style={styles.valueRow}>
            <Text style={styles.valueText}>{value}</Text>
            <Text style={styles.ofTen}>/ 10</Text>
          </View>
          <Slider
            style={{ width: "100%", height: 44 }}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={value}
            onValueChange={(v) => {
              const next = Math.round(v);
              if (next !== value) {
                void playHaptic(next >= 8 ? "medium" : "light");
              }
              setSingle("dailyLoad", next);
            }}
            minimumTrackTintColor={trackColor}
            maximumTrackTintColor={colors.borderSoft}
            thumbTintColor={trackColor}
            testID="onboarding-intensity-slider"
            accessibilityLabel={INTENSITY_QUESTION.title}
          />
          <View style={styles.labels}>
            <Text style={styles.endLabel}>{INTENSITY_QUESTION.lowLabel}</Text>
            <Text style={styles.endLabel}>{INTENSITY_QUESTION.highLabel}</Text>
          </View>
        </View>
        <Text style={styles.bandHint}>Drag — watch how Grace feels with you</Text>
      </OnboardingQuestionScreen>
    </View>
  );
}

export default IntensityScreen;
