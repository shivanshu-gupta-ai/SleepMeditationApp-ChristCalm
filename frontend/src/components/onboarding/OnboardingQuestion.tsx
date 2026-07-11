import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  /** Small uppercase label above the question (e.g. "YOUR FAITH") */
  overline?: string;
  title: string;
  /** Helper under the title — keep tone soft and optional */
  subtitle?: string;
  /** multi | single hint line */
  hint?: string;
  center?: boolean;
};

/**
 * Canonical question header for every knowledge-capture step.
 * Same hierarchy: overline → title → subtitle → optional hint.
 */
export function OnboardingQuestion({
  overline,
  title,
  subtitle,
  hint,
  center = false,
}: Props) {
  const { colors, fonts, spacing } = useTheme();
  const align = center ? ("center" as const) : ("left" as const);

  return (
    <View style={{ marginBottom: spacing.lg }}>
      {overline ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 11,
            letterSpacing: 2.4,
            color: colors.primary,
            marginBottom: spacing.sm,
            textAlign: align,
            textTransform: "uppercase",
          }}
        >
          {overline}
        </Text>
      ) : null}
      <Text
        style={{
          fontFamily: fonts.headingBold,
          fontSize: 26,
          color: colors.textPrimary,
          letterSpacing: -0.6,
          lineHeight: 34,
          textAlign: align,
          marginBottom: subtitle || hint ? spacing.sm : 0,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 16,
            color: colors.textSecondary,
            lineHeight: 24,
            textAlign: align,
            marginBottom: hint ? spacing.sm : 0,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {hint ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.textMuted,
            textAlign: align,
            letterSpacing: 0.2,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
