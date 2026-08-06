import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import type { GraceExpression } from "../types";

type Props = {
  expression?: GraceExpression;
  size?: number;
  testID?: string;
};

const EXPRESSION_LABEL: Record<GraceExpression, string> = {
  welcome: "Grace · Welcome",
  listening: "Grace · Listening",
  thoughtful: "Grace · Thoughtful",
  heavy: "Grace · Heavy",
  hopeful: "Grace · Hopeful",
  committed: "Grace · Committed",
  peaceful: "Grace · Peaceful",
  notification: "Grace · Notification",
  smile: "Grace · Smile",
  anxiety: "Grace · Anxiety",
  fact: "Grace · Fact",
  thinking: "Grace · Thinking",
};

/**
 * Temporary mascot stand-in until illustration assets ship.
 */
export function GracePlaceholder({
  expression = "welcome",
  size = 120,
  testID = "grace-placeholder",
}: Props) {
  const { colors, fonts, radius, shadows } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ring: {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
          ...shadows.soft,
        },
        label: {
          fontFamily: fonts.bodyMedium,
          fontSize: Math.max(11, size * 0.1),
          color: colors.primary,
          textAlign: "center",
        },
      }),
    [colors, fonts, size, shadows]
  );

  return (
    <View style={styles.ring} testID={testID} accessibilityLabel={EXPRESSION_LABEL[expression]}>
      <Text style={styles.label}>{EXPRESSION_LABEL[expression]}</Text>
    </View>
  );
}

export default GracePlaceholder;
