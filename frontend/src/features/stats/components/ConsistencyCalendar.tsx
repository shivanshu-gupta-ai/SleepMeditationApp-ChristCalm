import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { Surface } from "@/src/components/ui/Surface";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import type { DayBar } from "@/src/features/stats/types";

type Props = { days: DayBar[]; rangeLabel?: string };

export function ConsistencyCalendar({ days, rangeLabel }: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();
  const active = days.filter((d) => d.sessions > 0 || d.minutes > 0).length;
  const rest = days.length - active;
  const subtitle =
    rangeLabel ||
    (days.length <= 7
      ? "This week — rest days are part of the journey"
      : days.length <= 31
        ? "This month — rest days are part of the journey"
        : "Recent weeks — rest days are part of the journey");

  return (
    <View style={{ marginBottom: spacing.lg }} testID="stats-calendar">
      <SectionHeader title="Consistency" subtitle={subtitle} />
      <Surface>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {days.map((d) => {
            const practiced = d.minutes > 0 || d.sessions > 0;
            return (
              <View
                key={d.date}
                accessibilityLabel={`${d.date}${practiced ? `, ${d.minutes} minutes` : ", rest day"}`}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  backgroundColor: practiced
                    ? colors.primary
                    : isDark
                      ? colors.surfaceAlt
                      : colors.surfaceMuted,
                  opacity: practiced ? Math.min(1, 0.45 + d.minutes / 40) : 1,
                }}
              />
            );
          })}
        </View>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
            marginTop: spacing.lg,
          }}
        >
          {active === 0
            ? "No marked days yet. When you return, a soft light will appear."
            : `${active} days of practice, ${rest} days of rest. Both belong.`}
        </Text>
      </Surface>
    </View>
  );
}
