import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  /** Small label above the question (e.g. "Your heart") */
  overline?: string;
  title: string;
  /** Helper under the title — keep short */
  subtitle?: string;
  /** multi | single hint line */
  hint?: string;
  center?: boolean;
  /**
   * compact (default): denser hierarchy for option lists.
   * roomy: welcome-style screens that need more air.
   */
  density?: "compact" | "roomy";
};

/**
 * Question header — compact by default so options own the screen.
 * Hierarchy: overline → title → optional one-line helper (subtitle or hint, not both tall).
 */
export function OnboardingQuestion({
  overline,
  title,
  subtitle,
  hint,
  center = false,
  density = "compact",
}: Props) {
  const { colors, fonts, spacing } = useTheme();
  const align = center ? ("center" as const) : ("left" as const);
  const compact = density === "compact";

  // Compact: show subtitle OR hint (prefer subtitle); avoids 3 stacked text blocks
  const helper = compact ? subtitle || hint : subtitle;
  const showHint = compact ? false : Boolean(hint);

  return (
    <View style={{ marginBottom: compact ? spacing.md : spacing.lg }}>
      {overline ? (
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: compact ? 12 : 13,
            letterSpacing: 0.2,
            color: colors.primary,
            marginBottom: compact ? 4 : spacing.sm,
            textAlign: align,
          }}
        >
          {overline}
        </Text>
      ) : null}
      <Text
        style={{
          fontFamily: fonts.headingBold,
          fontSize: compact ? 22 : 26,
          color: colors.textPrimary,
          letterSpacing: -0.5,
          lineHeight: compact ? 28 : 34,
          textAlign: align,
          marginBottom: helper || showHint ? (compact ? 4 : spacing.sm) : 0,
        }}
      >
        {title}
      </Text>
      {helper ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: compact ? 14 : 16,
            color: colors.textSecondary,
            lineHeight: compact ? 20 : 24,
            textAlign: align,
            marginBottom: showHint ? spacing.sm : 0,
          }}
          numberOfLines={compact ? 2 : undefined}
        >
          {helper}
        </Text>
      ) : null}
      {showHint && hint ? (
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
