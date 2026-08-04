import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import type { StatsRange } from "@/src/features/stats/types";

const OPTIONS: { id: StatsRange; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All Time" },
];

type Props = {
  value: StatsRange;
  onChange: (r: StatsRange) => void;
};

export function RangeSelector({ value, onChange }: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        backgroundColor: isDark ? colors.surfaceAlt : colors.surfaceMuted,
        borderRadius: 999,
        padding: 4,
        gap: 4,
        marginBottom: spacing.lg,
        width: "100%",
      }}
      testID="stats-range-selector"
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <View key={opt.id} style={{ flex: 1, minWidth: 0 }}>
            <PressableScale
              onPress={() => onChange(opt.id)}
              haptic="light"
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${opt.label} stats`}
              testID={`stats-range-${opt.id}`}
              style={{
                minHeight: 44,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 8,
                backgroundColor: selected
                  ? isDark
                    ? colors.surface
                    : colors.white
                  : "transparent",
                borderWidth: selected && !isDark ? 1 : 0,
                borderColor: colors.borderSoft,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{
                  fontFamily: selected ? fonts.bodyBold : fonts.body,
                  fontSize: 13,
                  color: selected ? colors.textPrimary : colors.textMuted,
                  textAlign: "center",
                }}
              >
                {opt.label}
              </Text>
            </PressableScale>
          </View>
        );
      })}
    </View>
  );
}
