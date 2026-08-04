import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { Surface } from "@/src/components/ui/Surface";
import type { JourneySnapshot, StatsRange } from "@/src/features/stats/types";
import { rhythmLabel } from "@/src/features/stats/deriveJourney";
import { useResponsive } from "@/src/hooks/use-responsive";

type Props = { snapshot: JourneySnapshot };

function rangeCaption(range: StatsRange): string {
  if (range === "week") return "in the last 7 days";
  if (range === "month") return "in the last 30 days";
  return "all time";
}

/**
 * Hero recognition — minutes lead; streak only when ≥ 2 (day rhythm).
 * No goal ring or X/Y scoreboard (grace over grind).
 */
export function JourneyHero({ snapshot }: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();
  const { isCompact } = useResponsive();
  const rhythm = rhythmLabel(snapshot);
  const showRhythm = snapshot.streak >= 2;

  return (
    <Surface style={{ marginBottom: spacing.lg }} testID="stats-hero">
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: fonts.headingBold,
            fontSize: isCompact ? 36 : 40,
            color: colors.textPrimary,
            letterSpacing: -1.2,
            lineHeight: isCompact ? 40 : 44,
          }}
          accessibilityLabel={`${snapshot.minutes} mindful minutes ${rangeCaption(snapshot.range)}`}
          testID="stats-hero-minutes"
        >
          {snapshot.minutes}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: spacing.md,
          }}
        >
          mindful minutes · {rangeCaption(snapshot.range)}
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.lg, flexWrap: "wrap" }}>
          <View>
            <Text
              style={{
                fontFamily: fonts.headingBold,
                fontSize: 20,
                color: colors.textPrimary,
                letterSpacing: -0.4,
              }}
              testID="stats-hero-sessions"
            >
              {snapshot.sessions}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted }}>
              sessions
            </Text>
          </View>
          <View>
            <Text
              style={{
                fontFamily: fonts.headingBold,
                fontSize: 20,
                color: colors.textPrimary,
                letterSpacing: -0.4,
              }}
              testID="stats-hero-active-days"
            >
              {snapshot.activeDays}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted }}>
              days of return
            </Text>
          </View>
          {showRhythm ? (
            <View>
              <Text
                style={{
                  fontFamily: fonts.headingBold,
                  fontSize: 20,
                  color: colors.textPrimary,
                  letterSpacing: -0.4,
                }}
                testID="stats-hero-streak"
              >
                {snapshot.streak}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted }}>
                day rhythm
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 14,
          lineHeight: 20,
          color: colors.textSecondary,
          marginTop: spacing.lg,
          paddingTop: spacing.md,
          borderTopWidth: isDark ? 0 : 1,
          borderTopColor: colors.borderSoft,
        }}
        testID="stats-hero-rhythm"
      >
        {rhythm}
      </Text>
    </Surface>
  );
}
