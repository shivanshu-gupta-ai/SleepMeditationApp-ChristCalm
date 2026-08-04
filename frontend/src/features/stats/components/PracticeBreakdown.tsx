import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { Surface } from "@/src/components/ui/Surface";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import type { PracticeSlice } from "@/src/features/stats/types";

type Props = { slices: PracticeSlice[] };

export function PracticeBreakdown({ slices }: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();
  if (!slices.length) return null;
  const max = Math.max(1, ...slices.map((s) => s.minutes));

  return (
    <View style={{ marginBottom: spacing.lg }} testID="stats-practice">
      <SectionHeader title="Where minutes went" subtitle="Paths you returned to" />
      <Surface>
        {slices.map((s, i) => (
          <View
            key={s.key}
            style={{ marginBottom: i === slices.length - 1 ? 0 : spacing.md }}
            accessibilityLabel={`${s.label}, ${s.minutes} minutes`}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bodyMedium,
                  fontSize: 14,
                  color: colors.textPrimary,
                  flex: 1,
                  paddingRight: 8,
                }}
                numberOfLines={1}
              >
                {s.label}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textMuted }}>
                {s.minutes} min
              </Text>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: isDark ? colors.surfaceAlt : colors.surfaceMuted,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${Math.max(6, (s.minutes / max) * 100)}%`,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                  opacity: 0.85,
                }}
              />
            </View>
          </View>
        ))}
      </Surface>
    </View>
  );
}
