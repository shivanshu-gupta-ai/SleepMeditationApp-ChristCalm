import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

/** Screen 0 — First impression: welcome line only. */
export function SplashScreen() {
  const { colors, fonts } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        },
        headline: {
          fontFamily: fonts.headingBold,
          fontSize: 28,
          lineHeight: 36,
          letterSpacing: -0.5,
          color: colors.textPrimary,
          textAlign: "center",
        },
      }),
    [colors, fonts]
  );

  return (
    <View
      style={styles.root}
      testID="onboarding-screen-splash"
      accessibilityLabel="Welcome to ChristCalm"
    >
      <Text style={styles.headline}>Welcome to ChristCalm</Text>
    </View>
  );
}

export default SplashScreen;
