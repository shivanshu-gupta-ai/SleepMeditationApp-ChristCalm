import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GracePlaceholder } from "./GracePlaceholder";
import type { GraceExpression } from "../types";

type Props = {
  screenIndex: number;
  title: string;
  subtitle?: string;
  expression?: GraceExpression;
  testID?: string;
  children?: React.ReactNode;
};

/**
 * Shared empty-state chrome for skeleton screens.
 * Real UI will replace body content per design copy later.
 */
export function ScreenSkeleton({
  screenIndex,
  title,
  subtitle = "UI coming soon — navigation is wired.",
  expression = "welcome",
  testID,
  children,
}: Props) {
  const { colors, fonts, spacing } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          alignItems: "center",
          justifyContent: "center",
        },
        meta: {
          fontFamily: fonts.bodyMedium,
          fontSize: 12,
          color: colors.textMuted,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          marginBottom: spacing.md,
        },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 22,
          lineHeight: 30,
          color: colors.textPrimary,
          textAlign: "center",
          marginTop: spacing.lg,
          marginBottom: spacing.sm,
        },
        subtitle: {
          fontFamily: fonts.body,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: "center",
          maxWidth: 320,
        },
      }),
    [colors, fonts, spacing]
  );

  return (
    <View style={styles.root} testID={testID}>
      <Text style={styles.meta}>Screen {screenIndex}</Text>
      <GracePlaceholder expression={expression} size={112} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

export default ScreenSkeleton;
