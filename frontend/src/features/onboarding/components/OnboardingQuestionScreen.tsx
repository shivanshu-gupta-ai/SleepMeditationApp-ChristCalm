import React from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingQuestion } from "./OnboardingQuestion";
import type { ReactKind } from "../mascot/motionProfiles";

type Props = {
  title: string;
  subtitle?: string;
  overline?: string;
  hint?: string;
  density?: "compact" | "roomy";
  showGrace?: boolean;
  graceSize?: number;
  graceReactToken?: number;
  graceReactKind?: ReactKind;
  /** When true, pin the block toward the vertical middle (short screens: name, age). */
  verticallyCenter?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Shared shell for every onboarding question screen:
 * centered Grace + question copy, full-width options below.
 */
export function OnboardingQuestionScreen({
  title,
  subtitle,
  overline,
  hint,
  density = "compact",
  showGrace = true,
  graceSize,
  graceReactToken,
  graceReactKind,
  verticallyCenter = false,
  testID,
  style,
  children,
}: Props) {
  const { spacing } = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          paddingHorizontal: spacing.md,
          paddingTop: verticallyCenter ? spacing.md : 4,
          paddingBottom: spacing.sm,
          justifyContent: verticallyCenter ? "center" : "flex-start",
          // With parent ScrollView contentContainerStyle flexGrow:1, centers short Q screens
          flexGrow: verticallyCenter ? 1 : undefined,
        },
        style,
      ]}
      testID={testID}
    >
      <OnboardingQuestion
        title={title}
        subtitle={subtitle}
        overline={overline}
        hint={hint}
        density={density}
        showGrace={showGrace}
        graceSize={graceSize}
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
