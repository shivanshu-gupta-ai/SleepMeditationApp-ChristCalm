import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { WELCOME_COPY } from "../copy";

/** Screen 1 — Welcome: Grace first, scripture, one short sub. */
export function WelcomeScreen() {
  const { colors, fonts, spacing } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
        },
        overline: {
          fontFamily: fonts.bodyMedium,
          fontSize: 13,
          letterSpacing: 0.4,
          color: colors.primary,
          textAlign: "center",
          marginTop: spacing.xl,
        },
        headline: {
          fontFamily: fonts.scriptureItalic,
          fontStyle: "italic",
          fontSize: 22,
          lineHeight: 32,
          letterSpacing: -0.3,
          color: colors.textPrimary,
          textAlign: "center",
          marginTop: spacing.md,
          maxWidth: 320,
        },
        reference: {
          fontFamily: fonts.bodyMedium,
          fontSize: 12,
          color: colors.primary,
          textAlign: "center",
          marginTop: spacing.sm,
          letterSpacing: 0.4,
        },
        sub: {
          fontFamily: fonts.body,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.xl,
        },
      }),
    [colors, fonts, spacing]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-welcome">
      <GraceMoodImage mood="welcome" size={160} testID="grace-welcome" />
      <Text style={styles.overline}>{WELCOME_COPY.overline}</Text>
      <Text style={styles.headline}>“{WELCOME_COPY.headline}”</Text>
      <Text style={styles.reference}>{WELCOME_COPY.reference}</Text>
      <Text style={styles.sub}>{WELCOME_COPY.sub}</Text>
    </View>
  );
}

export default WelcomeScreen;
