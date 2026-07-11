import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  message?: string;
  fullScreen?: boolean;
  testID?: string;
};

export function LoadingState({
  message = "Finding peace…",
  fullScreen = true,
  testID = "loading-state",
}: Props) {
  const { colors, fonts, spacing } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        fullScreen && styles.full,
        { backgroundColor: fullScreen ? colors.background : "transparent" },
      ]}
      testID={testID}
    >
      <View style={[styles.orb, { backgroundColor: colors.primarySoft }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      {message ? (
        <Text
          style={{
            marginTop: spacing.md,
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.textSecondary,
            letterSpacing: 0.2,
          }}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  full: {
    flex: 1,
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
