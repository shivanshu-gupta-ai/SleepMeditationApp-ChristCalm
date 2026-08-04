import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { FadeIn } from "@/src/components/ui/FadeIn";
import { layout } from "@/src/theme/layout";

type Props = {
  minutes: number;
  streak: number;
  sessions: number;
};

/**
 * Home glance strip for engaged users.
 * Same theology as Journey: no flame, hide weak/broken rhythm (&lt;2), soft labels.
 */
export function JourneyStats({ minutes, streak, sessions }: Props) {
  const { colors, fonts, spacing, shadows, isDark } = useTheme();
  const showRhythm = streak >= 2;

  const items: Array<{
    value: number;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }> = [
    {
      value: minutes,
      label: "Minutes",
      icon: "time-outline",
      color: colors.primary,
    },
    {
      value: sessions,
      label: "Sessions",
      icon: "leaf-outline",
      color: isDark ? colors.secondary : colors.primaryDark,
    },
  ];

  if (showRhythm) {
    items.push({
      value: streak,
      label: "Day rhythm",
      icon: "leaf-outline",
      color: isDark ? colors.premium : colors.primaryDark,
    });
  }

  return (
    <FadeIn delay={10}>
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginBottom: layout.sectionGap,
        }}
        testID="journey-stats"
        accessibilityLabel={
          showRhythm
            ? `${minutes} minutes, ${sessions} sessions, ${streak} day rhythm`
            : `${minutes} minutes, ${sessions} sessions`
        }
      >
        {items.map((it) => (
          <View
            key={it.label}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: layout.surfaceRadius - 4,
              borderWidth: isDark ? 0 : 1,
              borderColor: colors.borderSoft,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.sm,
              alignItems: "center",
              ...(isDark ? null : shadows.soft),
            }}
          >
            <Ionicons name={it.icon} size={16} color={it.color} />
            <Text
              style={{
                fontFamily: fonts.headingBold,
                fontSize: 22,
                color: colors.textPrimary,
                marginTop: 6,
                letterSpacing: -0.5,
              }}
            >
              {it.value}
            </Text>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                color: colors.textMuted,
                marginTop: 2,
              }}
            >
              {it.label}
            </Text>
          </View>
        ))}
      </View>
    </FadeIn>
  );
}
