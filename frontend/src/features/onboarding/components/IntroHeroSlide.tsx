import React, { useMemo } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { IntroVisual, type IntroVisualVariant } from "./IntroVisual";

export type IntroSlideContent = {
  overline: string;
  headline: string;
  /** Optional scripture line under the welcome headline */
  scripture?: string;
  reference?: string;
  supporting: string;
  variant: IntroVisualVariant;
};

type Props = {
  content: IntroSlideContent;
  /** 0–3 for the four intro screens */
  pageIndex: number;
  pageCount?: number;
  testID?: string;
};

/**
 * Brainrot-style full-screen intro frame:
 * large visual ~55–60%, dots, overline, bold headline, supporting line.
 * CTA lives in OnboardingNavigator footer.
 */
export function IntroHeroSlide({
  content,
  pageIndex,
  pageCount = 4,
  testID,
}: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const visualH = Math.max(280, Math.round(height * 0.52));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          width: "100%",
        },
        visual: {
          height: visualH,
          width: "100%",
          maxHeight: "58%",
        },
        copy: {
          flex: 1,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          alignItems: "center",
        },
        dots: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: spacing.lg,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: isDark ? colors.surfaceAlt : colors.borderSoft,
        },
        dotActive: {
          width: 24,
          backgroundColor: colors.primary,
        },
        overline: {
          fontFamily: fonts.bodyMedium,
          fontSize: 13,
          letterSpacing: 0.35,
          color: colors.primary,
          textAlign: "center",
          marginBottom: spacing.sm,
        },
        headline: {
          fontFamily: fonts.headingBold,
          fontSize: 26,
          lineHeight: 34,
          letterSpacing: -0.55,
          color: colors.textPrimary,
          textAlign: "center",
          maxWidth: 340,
        },
        scripture: {
          fontFamily: fonts.scriptureItalic || fonts.headingBold,
          fontStyle: "italic",
          fontSize: 16,
          lineHeight: 24,
          letterSpacing: -0.2,
          color: colors.textPrimary,
          textAlign: "center",
          marginTop: spacing.md,
          maxWidth: 320,
        },
        reference: {
          fontFamily: fonts.bodyMedium,
          fontSize: 12,
          letterSpacing: 0.35,
          color: colors.premium,
          textAlign: "center",
          marginTop: spacing.xs,
        },
        supporting: {
          fontFamily: fonts.body,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.md,
          maxWidth: 320,
        },
      }),
    [colors, fonts, spacing, isDark, visualH]
  );

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.visual}>
        <IntroVisual variant={content.variant} testID={`${testID}-visual`} />
      </View>

      <View style={styles.copy}>
        <View
          style={styles.dots}
          accessibilityRole="tablist"
          accessibilityLabel={`Intro page ${pageIndex + 1} of ${pageCount}`}
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === pageIndex && styles.dotActive]}
              accessibilityState={{ selected: i === pageIndex }}
            />
          ))}
        </View>

        <Text style={styles.overline}>{content.overline}</Text>
        <Text style={styles.headline}>{content.headline}</Text>
        {content.scripture ? (
          <Text style={styles.scripture}>“{content.scripture}”</Text>
        ) : null}
        {content.reference ? (
          <Text style={styles.reference}>{content.reference}</Text>
        ) : null}
        <Text style={styles.supporting}>{content.supporting}</Text>
      </View>
    </View>
  );
}

export default IntroHeroSlide;
