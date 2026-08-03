import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "./GraceMoodImage";
import { BENEFIT_SLIDES } from "../copy";

type Props = {
  slideIndex: 0 | 1 | 2;
  testID?: string;
};

/** Screens 2–4 — Grace focus + short lead/body. */
export function BenefitSlide({ slideIndex, testID }: Props) {
  const { colors, fonts, spacing } = useTheme();
  const slide = BENEFIT_SLIDES[slideIndex];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
        },
        dots: {
          flexDirection: "row",
          gap: 8,
          marginBottom: spacing.xl,
          alignItems: "center",
        },
        dot: {
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: colors.borderSoft,
        },
        dotActive: {
          width: 22,
          backgroundColor: colors.primary,
        },
        lead: {
          fontFamily: fonts.headingBold,
          fontSize: 28,
          lineHeight: 36,
          letterSpacing: -0.6,
          color: colors.textPrimary,
          textAlign: "center",
          marginTop: spacing.xl,
        },
        body: {
          fontFamily: fonts.body,
          fontSize: 16,
          lineHeight: 24,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.sm,
          maxWidth: 280,
        },
      }),
    [colors, fonts, spacing]
  );

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.dots} accessibilityRole="tablist">
        {BENEFIT_SLIDES.map((s, i) => (
          <View
            key={s.id}
            style={[styles.dot, i === slideIndex && styles.dotActive]}
            accessibilityState={{ selected: i === slideIndex }}
          />
        ))}
      </View>
      <GraceMoodImage mood="welcome" size={150} testID={`${testID}-grace`} />
      <Text style={styles.lead}>{slide.lead}</Text>
      <Text style={styles.body}>{slide.body}</Text>
    </View>
  );
}

export default BenefitSlide;
