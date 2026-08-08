import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { SOCIAL_PROOF_COPY } from "../copy";
import { GRACE_DISPLAY } from "../mascot/graceAssets";

/**
 * Screen 20 — Social Proof
 * Rating + multiple short reviews (scrollable via parent layout).
 */
export function SocialProofScreen() {
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
          alignItems: "center",
        },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 24,
          lineHeight: 32,
          letterSpacing: -0.4,
          color: colors.textPrimary,
          textAlign: "center",
          marginTop: spacing.md,
          marginBottom: spacing.lg,
          maxWidth: 320,
        },
        ratingBlock: {
          alignItems: "center",
          marginBottom: spacing.lg,
        },
        ratingRow: {
          flexDirection: "row",
          alignItems: "baseline",
          gap: 10,
        },
        rating: {
          fontFamily: fonts.headingBold,
          fontSize: 36,
          letterSpacing: -1,
          color: colors.textPrimary,
        },
        stars: {
          fontSize: 18,
          color: isDark ? colors.premium : colors.premiumDark,
          letterSpacing: 2,
        },
        community: {
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textSecondary,
          marginTop: spacing.sm,
          textAlign: "center",
        },
        list: {
          width: "100%",
          maxWidth: 360,
          gap: spacing.sm,
        },
        quoteCard: {
          width: "100%",
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.soft,
        },
        cardStars: {
          fontSize: 12,
          letterSpacing: 1.5,
          color: isDark ? colors.premium : colors.premiumDark,
          marginBottom: 6,
        },
        quote: {
          fontFamily: fonts.body,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textPrimary,
          letterSpacing: -0.1,
        },
        footerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: spacing.sm,
          gap: 8,
        },
        attribution: {
          fontFamily: fonts.bodyBold,
          fontSize: 13,
          color: colors.primary,
        },
        meta: {
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
          flexShrink: 1,
          textAlign: "right",
        },
      }),
    [colors, fonts, spacing, radius, shadows, isDark]
  );

  const starLabel = (n: number) => "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));

  return (
    <View style={styles.root} testID="onboarding-screen-socialProof">
      <GraceMoodImage
        mood="review"
        glowTone="gold"
        size={GRACE_DISPLAY.question}
        testID="grace-social-proof"
      />
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

      <View style={styles.list}>
        {SOCIAL_PROOF_COPY.reviews.map((r) => (
          <View key={`${r.name}-${r.quote.slice(0, 24)}`} style={styles.quoteCard}>
            <Text
              style={styles.cardStars}
              accessibilityLabel={`${r.stars} out of 5 stars`}
            >
              {starLabel(r.stars)}
            </Text>
            <Text style={styles.quote}>“{r.quote}”</Text>
            <View style={styles.footerRow}>
              <Text style={styles.attribution}>— {r.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {r.meta}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default SocialProofScreen;
