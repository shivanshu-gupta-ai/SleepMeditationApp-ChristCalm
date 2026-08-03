import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { SOCIAL_PROOF_COPY } from "../copy";

/**
 * Screen 20 — Social Proof
 * Rating, community size, testimonial. Exact design copy.
 */
export function SocialProofScreen() {
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();

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
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 24,
          lineHeight: 32,
          letterSpacing: -0.4,
          color: colors.textPrimary,
          textAlign: "center",
          marginTop: spacing.lg,
          marginBottom: spacing.xl,
          maxWidth: 320,
        },
        ratingBlock: {
          alignItems: "center",
          marginBottom: spacing.xl,
        },
        ratingRow: {
          flexDirection: "row",
          alignItems: "baseline",
          gap: 10,
        },
        rating: {
          fontFamily: fonts.headingBold,
          fontSize: 40,
          letterSpacing: -1,
          color: colors.textPrimary,
        },
        stars: {
          fontSize: 22,
          color: isDark ? colors.premium : colors.premiumDark,
          letterSpacing: 2,
        },
        community: {
          fontFamily: fonts.body,
          fontSize: 15,
          color: colors.textSecondary,
          marginTop: spacing.sm,
          textAlign: "center",
        },
        quoteCard: {
          width: "100%",
          maxWidth: 340,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.soft,
        },
        quote: {
          fontFamily: fonts.scriptureItalic,
          fontStyle: "italic",
          fontSize: 17,
          lineHeight: 26,
          color: colors.textPrimary,
          textAlign: "center",
        },
        attribution: {
          fontFamily: fonts.bodyMedium,
          fontSize: 14,
          color: colors.primary,
          textAlign: "center",
          marginTop: spacing.md,
        },
      }),
    [colors, fonts, spacing, radius, shadows, isDark]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-socialProof">
      <GraceMoodImage mood="hopeful" size={120} testID="grace-social-proof" />
      <Text style={styles.title}>{SOCIAL_PROOF_COPY.title}</Text>

      <View style={styles.ratingBlock}>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>{SOCIAL_PROOF_COPY.rating}</Text>
          <Text style={styles.stars} accessibilityLabel="4.8 out of 5 stars">
            {SOCIAL_PROOF_COPY.stars}
          </Text>
        </View>
        <Text style={styles.community}>{SOCIAL_PROOF_COPY.community}</Text>
      </View>

      <View style={styles.quoteCard}>
        <Text style={styles.quote}>“{SOCIAL_PROOF_COPY.quote}”</Text>
        <Text style={styles.attribution}>{SOCIAL_PROOF_COPY.attribution}</Text>
      </View>
    </View>
  );
}

export default SocialProofScreen;
