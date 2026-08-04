import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { Surface } from "@/src/components/ui/Surface";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { PressableScale } from "@/src/components/ui/PressableScale";
import type { DayBar, StatsRange } from "@/src/features/stats/types";
import { chartCopy } from "@/src/features/stats/deriveJourney";

type Props = {
  days: DayBar[];
  range: StatsRange;
};

/**
 * Sole rhythm visual — practice + rest as belonging.
 * Day tap is the only deep interaction (gentle inspection).
 */
export function WeekActivityChart({ days, range }: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const { title, subtitle } = chartCopy(range);

  useEffect(() => {
    setSelected(null);
  }, [range, days]);

  const maxMinutes = Math.max(0, ...days.map((d) => d.minutes));
  const picked = days.find((d) => d.date === selected) || null;
  const active = days.filter((d) => d.minutes > 0 || d.sessions > 0).length;
  const rest = days.length - active;

  const dense = days.length > 10;
  const barMaxH = dense ? 72 : 88;
  const chartH = dense ? 100 : 120;
  // Presence floor: any practice day gets a clear mark even with low minutes
  const presenceFloor = dense ? 14 : 20;

  let reflection =
    active === 0
      ? range === "week"
        ? "A quiet stretch — rest is holy too."
        : range === "month"
          ? "A quiet month so far — presence can begin again gently."
          : "A quiet field ready for presence."
      : active >= Math.ceil(days.length * 0.6)
        ? "You returned often. That faithfulness is enough."
        : active >= 2
          ? "A few gentle returns. God meets you in small steps."
          : "One day of stillness still matters.";

  if (picked) {
    const practiced = picked.minutes > 0 || picked.sessions > 0;
    reflection = practiced
      ? picked.minutes > 0
        ? `${picked.minutes} min with Him · ${picked.sessions} session${picked.sessions === 1 ? "" : "s"}`
        : `A quiet return · ${picked.sessions} session${picked.sessions === 1 ? "" : "s"}`
      : "Rest day — a quiet gift.";
  }

  const belongingLine =
    active === 0
      ? "Every day here can hold rest or return."
      : `${active} day${active === 1 ? "" : "s"} of practice, ${rest} of rest. Both belong.`;

  return (
    <View style={{ marginBottom: spacing.lg }} testID="stats-week-chart">
      <SectionHeader title={title} subtitle={subtitle} />
      <Surface>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            height: chartH,
            gap: dense ? 2 : 6,
            width: "100%",
          }}
        >
          {days.map((d, index) => {
            const hasData = d.minutes > 0 || d.sessions > 0;
            const ratio = maxMinutes > 0 ? d.minutes / maxMinutes : hasData ? 0.45 : 0;
            const h = hasData
              ? Math.max(presenceFloor, Math.round(ratio * barMaxH))
              : dense
                ? 5
                : 6;
            const isOn = selected === d.date;
            const showLabel =
              !dense || index % 5 === 0 || isOn || index === days.length - 1;
            return (
              <View key={d.date} style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
                <PressableScale
                  onPress={() => setSelected((cur) => (cur === d.date ? null : d.date))}
                  haptic="light"
                  accessibilityLabel={
                    hasData
                      ? `${d.date}, ${d.minutes} minutes, ${d.sessions} sessions`
                      : `${d.date}, rest day`
                  }
                  style={{
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    minHeight: chartH - 20,
                  }}
                >
                  <View
                    style={{
                      width: dense ? "90%" : "72%",
                      maxWidth: dense ? 12 : 28,
                      height: h,
                      borderRadius: dense ? 3 : 8,
                      backgroundColor: isOn
                        ? colors.primary
                        : hasData
                          ? colors.primarySoft
                          : isDark
                            ? colors.surfaceAlt
                            : colors.surfaceMuted,
                      // Rest days: soft, intentional baseline — not error/disabled
                      opacity: hasData ? 1 : isDark ? 0.85 : 0.9,
                    }}
                  />
                  {showLabel ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fonts.body,
                        fontSize: dense ? 9 : 11,
                        color: isOn ? colors.primary : colors.textMuted,
                        marginTop: 6,
                      }}
                    >
                      {d.label}
                    </Text>
                  ) : (
                    <View style={{ height: 17 }} />
                  )}
                </PressableScale>
              </View>
            );
          })}
        </View>

        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: spacing.md,
            lineHeight: 18,
          }}
          testID="stats-chart-belonging"
        >
          {belongingLine}
        </Text>

        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
            marginTop: spacing.sm,
          }}
          testID="stats-chart-detail"
        >
          {reflection}
        </Text>
      </Surface>
    </View>
  );
}
