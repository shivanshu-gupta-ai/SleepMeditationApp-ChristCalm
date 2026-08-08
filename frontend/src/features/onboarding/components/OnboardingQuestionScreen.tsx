import React from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useResponsive } from "@/src/hooks/use-responsive";
import {
  OnboardingQuestion,
  type OnboardingQuestionVariant,
} from "./OnboardingQuestion";
import type { ReactKind } from "../mascot/motionProfiles";

type Props = {
  variant: OnboardingQuestionVariant;
  title: string;
  subtitle?: string;
  overline?: string;
  hint?: string;
  showGrace?: boolean;
  graceReactToken?: number;
  graceReactKind?: ReactKind;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/** Shared adaptive shell for onboarding prompts and their controls. */
export function OnboardingQuestionScreen({
  variant,
  title,
  subtitle,
  overline,
  hint,
  showGrace = true,
  graceReactToken,
  graceReactKind,
  testID,
  style,
  children,
}: Props) {
  const { spacing } = useTheme();
  const { height, isTablet } = useResponsive();
  const shortPhone = !isTablet && height < 720;

  return (
    <View
      style={[
        styles.root,
        {
          paddingHorizontal: spacing.md,
          paddingTop:
            variant === "focus"
              ? shortPhone
                ? spacing.sm
                : isTablet
                  ? spacing.xl
                  : spacing.lg
              : 4,
          paddingBottom: spacing.sm,
        },
        style,
      ]}
      testID={testID}
    >
      <OnboardingQuestion
        variant={variant}
        title={title}
        subtitle={subtitle}
        overline={overline}
        hint={hint}
        showGrace={showGrace}
        graceReactToken={graceReactToken}
        graceReactKind={graceReactKind}
      />
      {children != null ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignItems: "center",
    alignSelf: "stretch",
  },
  body: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
});

export default OnboardingQuestionScreen;
