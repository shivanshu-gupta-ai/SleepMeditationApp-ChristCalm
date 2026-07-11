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
            fontFamily: fonts.bodyMedium,
            fontSize: 13,
            letterSpacing: 0.3,
            color: colors.textMuted,
            marginBottom: 6,
            // Sentence case feels more modern than full uppercase print labels
          }}
        >
          {overline}
        </Text>
      ) : null}
      <Text
        style={{
          fontFamily: fonts.headingBold,
          fontSize: large ? 34 : 22,
          color: colors.textPrimary,
          letterSpacing: large ? -1 : -0.6,
          lineHeight: large ? 40 : 28,
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
