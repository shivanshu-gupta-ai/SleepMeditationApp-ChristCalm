import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingGrace } from "./OnboardingGrace";
import { GRACE_DISPLAY } from "../mascot/graceAssets";
import type { ReactKind } from "../mascot/motionProfiles";

type Props = {
  /** Small label above the question (e.g. "Your heart") */
  overline?: string;
  title: string;
  /** Helper under the title — keep short */
  subtitle?: string;
  /** multi | single hint line */
  hint?: string;
  /**
   * compact (default): denser hierarchy for option lists.
   * roomy: welcome-style screens that need more air.
   */
  density?: "compact" | "roomy";
  /** Route-aware Grace above the question (default true) */
  showGrace?: boolean;
  graceSize?: number;
  /** Optional Grace react (e.g. typing nod on name) */
  graceReactToken?: number;
  graceReactKind?: ReactKind;
  testID?: string;
};

/**
 * Centered question header for all onboarding Q screens.
 * Hierarchy: Grace → overline → title → optional helper — always centered.
 */
export function OnboardingQuestion({
  overline,
  title,
  subtitle,
  hint,
  density = "compact",
  showGrace = true,
  graceSize,
  graceReactToken,
  graceReactKind,
  testID = "onboarding-question",
}: Props) {
  const { colors, fonts, spacing } = useTheme();
  const compact = density === "compact";
  const mascotSize = graceSize ?? (compact ? GRACE_DISPLAY.question : GRACE_DISPLAY.roomy);

  const helper = compact ? subtitle || hint : subtitle;
  const showHint = compact ? false : Boolean(hint);

  return (
    <View style={[styles.wrap, { marginBottom: compact ? spacing.md : spacing.lg }]} testID={testID}>
      {showGrace ? (
        <View style={{ marginBottom: compact ? spacing.sm : spacing.md }}>
          <OnboardingGrace
            size={mascotSize}
            testID="onboarding-question-grace"
            reactToken={graceReactToken}
            reactKind={graceReactKind}
          />
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
            textAlign: "center",
            width: "100%",
            maxWidth: 340,
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
          textAlign: "center",
          width: "100%",
          maxWidth: 340,
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
            textAlign: "center",
            width: "100%",
            maxWidth: 320,
            marginBottom: showHint ? spacing.sm : 0,
          }}
          numberOfLines={compact ? 3 : undefined}
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
            textAlign: "center",
            letterSpacing: 0.2,
            width: "100%",
            maxWidth: 320,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    alignSelf: "center",
  },
});

export default OnboardingQuestion;
