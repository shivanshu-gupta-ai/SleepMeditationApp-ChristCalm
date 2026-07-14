import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  step: number;
  total: number;
};

/**
 * Single progress track — no second row of dots (saves vertical chrome).
 */
export default function OnboardingProgress({ step, total }: Props) {
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

  const pct = Math.min(100, Math.max(0, ((step + 1) / total) * 100));

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: step + 1 }}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}
