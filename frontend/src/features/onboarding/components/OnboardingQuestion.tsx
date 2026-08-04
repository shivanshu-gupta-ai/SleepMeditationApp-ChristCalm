import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingGrace } from "./OnboardingGrace";

type Props = {
  /** Small label above the question (e.g. "Your heart") */
  overline?: string;
  title: string;
  /** Helper under the title — keep short */
  subtitle?: string;
  /** multi | single hint line */
  hint?: string;
  /** Default true — question copy is centered under Grace */
  center?: boolean;
  /**
   * compact (default): denser hierarchy for option lists.
   * roomy: welcome-style screens that need more air.
   */
  density?: "compact" | "roomy";
  /** Route-aware Grace above the question (default true) */
  showGrace?: boolean;
  graceSize?: number;
};

/**
 * Question header with Grace on top expressing the screen’s feeling.
 * Hierarchy: Grace → overline → title → optional helper.
 */
export function OnboardingQuestion({
  overline,
  title,
  subtitle,
  hint,
  center = true,
  density = "compact",
  showGrace = true,
  graceSize,
}: Props) {
  const { colors, fonts, spacing } = useTheme();
  const align = center ? ("center" as const) : ("left" as const);
  const compact = density === "compact";
  const mascotSize = graceSize ?? (compact ? 100 : 120);

  const helper = compact ? subtitle || hint : subtitle;
  const showHint = compact ? false : Boolean(hint);

  return (
    <View
      style={{
        marginBottom: compact ? spacing.md : spacing.lg,
        alignItems: center ? "center" : "stretch",
        width: "100%",
      }}
    >
      {showGrace ? (
        <View
          style={{
            alignItems: "center",
            marginBottom: compact ? spacing.sm : spacing.md,
          }}
        >
          <OnboardingGrace size={mascotSize} testID="onboarding-question-grace" />
        </View>
      ) : null}

      {overline ? (
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: compact ? 12 : 13,
            letterSpacing: 0.2,
            color: colors.primary,
            marginBottom: compact ? 4 : spacing.sm,
            textAlign: align,
            width: "100%",
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
          width: "100%",
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
            width: "100%",
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
            width: "100%",
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
