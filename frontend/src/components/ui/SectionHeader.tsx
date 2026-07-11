import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  title: string;
  subtitle?: string;
  overline?: string;
  large?: boolean;
};

export function SectionHeader({ title, subtitle, overline, large }: Props) {
  const { colors, fonts, spacing } = useTheme();

  return (
    <View style={{ marginBottom: spacing.md }}>
      {overline ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            letterSpacing: 1.8,
            color: colors.textMuted,
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          {overline}
        </Text>
      ) : null}
      <Text
        style={{
          fontFamily: fonts.headingBold,
          fontSize: large ? 30 : 20,
          color: colors.textPrimary,
          letterSpacing: -0.5,
          lineHeight: large ? 36 : 26,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            color: colors.textSecondary,
            marginTop: 8,
            lineHeight: 22,
            maxWidth: 360,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
