import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  step: number;
  total: number;
};

export default function OnboardingProgress({ step, total }: Props) {
  const { colors, spacing, radius } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { flex: 1, gap: spacing.sm },
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
        dots: {
          flexDirection: "row",
          justifyContent: "center",
          gap: 5,
          flexWrap: "wrap",
        },
        dot: {
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: colors.border,
        },
        dotActive: {
          width: 16,
          backgroundColor: colors.primary,
        },
        dotDone: {
          backgroundColor: colors.secondary,
        },
      }),
    [colors, spacing, radius]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${((step + 1) / total) * 100}%` }]} />
      </View>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
          />
        ))}
      </View>
    </View>
  );
}
