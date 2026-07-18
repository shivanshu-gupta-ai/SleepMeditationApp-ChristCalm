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

/** Engaged-user stats strip — optimize & stay on track (not onboarding). */
export function JourneyStats({ minutes, streak, sessions }: Props) {
  const { colors, fonts, spacing, shadows, isDark } = useTheme();

  const items = [
    {
      value: streak,
      label: "Day streak",
      icon: "flame-outline" as const,
      color: isDark ? colors.premium : colors.primaryDark,
    },
    {
      value: minutes,
      label: "Minutes",
      icon: "time-outline" as const,
      color: colors.primary,
    },
    {
      value: sessions,
      label: "Sessions",
      icon: "leaf-outline" as const,
      color: isDark ? colors.secondary : colors.premium,
    },
  ];

  return (
    <FadeIn delay={10}>
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginBottom: layout.sectionGap,
        }}
        testID="journey-stats"
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
