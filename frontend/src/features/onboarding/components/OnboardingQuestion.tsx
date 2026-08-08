import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useResponsive } from "@/src/hooks/use-responsive";
import { OnboardingGrace } from "./OnboardingGrace";
import { GRACE_DISPLAY } from "../mascot/graceAssets";
import type { ReactKind } from "../mascot/motionProfiles";

export type OnboardingQuestionVariant = "choice" | "focus";

const QUESTION_GRACE_SCALE = 3;

type Props = {
  variant: OnboardingQuestionVariant;
  overline?: string;
  title: string;
  subtitle?: string;
  hint?: string;
  showGrace?: boolean;
  graceReactToken?: number;
  graceReactKind?: ReactKind;
  testID?: string;
};

/**
 * All onboarding prompts use a centered Grace + prompt stack.
 */
export function OnboardingQuestion({
  variant,
  overline,
  title,
  subtitle,
  hint,
  showGrace = true,
  graceReactToken,
  graceReactKind,
  testID = "onboarding-question",
}: Props) {
  const { colors, fonts, spacing } = useTheme();
  const { width, height, isTablet } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const shortPhone = !isTablet && height < 720;
  const forceStack = variant === "focus" || width < 350 || fontScale >= 1.3;

  const choiceWidth = shortPhone
    ? GRACE_DISPLAY.questionCompact
    : isTablet
      ? GRACE_DISPLAY.questionTablet
      : GRACE_DISPLAY.question;
  const focusWidth = shortPhone
    ? GRACE_DISPLAY.focusCompact
    : isTablet
      ? GRACE_DISPLAY.focusTablet
      : GRACE_DISPLAY.focus;
  const mascotWidth =
    variant === "focus"
      ? focusWidth
      : forceStack
        ? Math.min(168, choiceWidth + 36)
        : choiceWidth;
  const graceWidth = mascotWidth * QUESTION_GRACE_SCALE;
  const helper = subtitle || hint;
  const textAlign = "center" as const;

  return (
    <View
      style={[
        styles.root,
        {
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          marginBottom:
            variant === "choice"
              ? shortPhone
                ? spacing.sm
                : spacing.md
              : spacing.lg,
        },
      ]}
      testID={testID}
    >
      {showGrace ? (
        <OnboardingGrace
          size={graceWidth}
          testID="onboarding-question-grace"
          reactToken={graceReactToken}
          reactKind={graceReactKind}
          decorative
        />
      ) : null}

      <View
        style={[
          styles.copy,
          {
            alignItems: "center",
            maxWidth: 350,
          },
        ]}
      >
        {overline ? (
          <Text
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: variant === "choice" ? 12 : 13,
              letterSpacing: 0.2,
              color: colors.primary,
              marginBottom: 4,
              textAlign,
              width: "100%",
            }}
          >
            {overline}
          </Text>
        ) : null}

        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fonts.headingBold,
            fontSize: variant === "choice" ? 22 : 26,
            color: colors.textPrimary,
            letterSpacing: -0.5,
            lineHeight: variant === "choice" ? 28 : 34,
            textAlign,
            width: "100%",
            marginBottom: helper ? 4 : 0,
          }}
        >
          {title}
        </Text>

        {helper ? (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: variant === "choice" ? 14 : 16,
              color: colors.textSecondary,
              lineHeight: variant === "choice" ? 20 : 24,
              textAlign,
              width: "100%",
            }}
          >
            {helper}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  copy: {
    justifyContent: "center",
  },
});

export default OnboardingQuestion;
