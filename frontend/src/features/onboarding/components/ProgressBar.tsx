import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

export type ProgressBarProps = {
  /** 0-based current step index */
  step: number;
  /** Total steps in the flow */
  total: number;
  testID?: string;
};

/**
 * Continuous thin progress bar spanning the full onboarding flow.
 * Spec §10: continuous thin bar; calm primary fill.
 */
export function ProgressBar({ step, total, testID = "onboarding-progress" }: ProgressBarProps) {
  const { colors, radius } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { flex: 1, justifyContent: "center" },
        track: {
          height: 4,
          backgroundColor: colors.borderSoft,
          borderRadius: radius.full,
          overflow: "hidden",
        },
        fill: {
          height: "100%",
          backgroundColor: colors.primary,
          borderRadius: radius.full,
        },
      }),
    [colors, radius]
  );

  const safeTotal = Math.max(1, total);
  const pct = Math.min(100, Math.max(0, ((step + 1) / safeTotal) * 100));

  return (
    <View
      style={styles.wrap}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: safeTotal, now: Math.min(step + 1, safeTotal) }}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

export default ProgressBar;
