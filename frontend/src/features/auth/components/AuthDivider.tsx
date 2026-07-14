import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

export function AuthDivider({ text = "or" }: { text?: string }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginVertical: spacing.md,
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSoft }} />
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
          letterSpacing: 1,
        }}
      >
        {text}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSoft }} />
    </View>
  );
}
