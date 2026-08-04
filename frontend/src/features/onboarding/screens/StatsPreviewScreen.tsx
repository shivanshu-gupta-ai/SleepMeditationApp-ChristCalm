import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { STATS_PREVIEW_COPY } from "../copy";

/**
 * Screen 22 — Stats Preview (Before / After)
 * Motivation contrast before paywalls. Exact design copy.
 */
export function StatsPreviewScreen() {
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
        cards: {
          width: "100%",
          maxWidth: 360,
          gap: spacing.md,
          marginTop: spacing.lg,
        },
        card: {
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          ...shadows.soft,
        },
        cardBefore: {
          backgroundColor: isDark ? colors.surface : colors.surfaceAlt,
          borderColor: colors.borderSoft,
        },
        cardAfter: {
          backgroundColor: colors.primarySoft,
          borderColor: colors.primary + "55",
        },
        cardHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: spacing.sm,
        },
        cardTitle: {
          fontFamily: fonts.bodyBold,
          fontSize: 14,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        },
        titleBefore: { color: colors.textMuted },
        titleAfter: { color: colors.primary },
        cardBody: {
          fontFamily: fonts.body,
          fontSize: 16,
          lineHeight: 24,
          color: colors.textPrimary,
        },
        footer: {
          fontFamily: fonts.bodyMedium,
          fontSize: 15,
          lineHeight: 23,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.xl,
          maxWidth: 320,
        },
      }),
    [colors, fonts, spacing, radius, shadows, isDark]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-statsPreview">
      <GraceMoodImage
        mood="peaceful"
        profile="idleCalm"
        glowTone="primary"
        size={110}
        testID="grace-stats-preview"
      />

      <View style={styles.cards}>
        <View style={[styles.card, styles.cardBefore]}>
          <View style={styles.cardHeader}>
            <Ionicons name="remove-circle-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.cardTitle, styles.titleBefore]}>
              {STATS_PREVIEW_COPY.beforeTitle}
            </Text>
          </View>
          <Text style={styles.cardBody}>{STATS_PREVIEW_COPY.beforeLine}</Text>
        </View>

        <View style={[styles.card, styles.cardAfter]}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, styles.titleAfter]}>
              {STATS_PREVIEW_COPY.afterTitle}
            </Text>
          </View>
          <Text style={styles.cardBody}>{STATS_PREVIEW_COPY.afterLine}</Text>
        </View>
      </View>

      <Text style={styles.footer}>{STATS_PREVIEW_COPY.footer}</Text>
    </View>
  );
}

export default StatsPreviewScreen;
