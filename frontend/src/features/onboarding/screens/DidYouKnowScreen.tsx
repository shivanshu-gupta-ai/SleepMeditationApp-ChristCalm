import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { DID_YOU_KNOW } from "../copy";

/**
 * Screen 11 — Did You Know?
 * Normalize overthinking, anxiety, and emotional weight — not phone stats.
 */
export function DidYouKnowScreen() {
  const { colors, fonts, spacing, radius, shadows } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
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
        },
        sub: {
          fontFamily: fonts.body,
          fontSize: 14,
          lineHeight: 20,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.sm,
          marginBottom: spacing.lg,
          maxWidth: 320,
        },
        card: {
          width: "100%",
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.soft,
        },
        row: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          paddingVertical: spacing.sm,
        },
        rowBorder: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSoft,
        },
        bullet: {
          width: 28,
          height: 28,
          borderRadius: 10,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        },
        fact: {
          flex: 1,
          fontFamily: fonts.bodyMedium,
          fontSize: 15,
          lineHeight: 21,
          color: colors.textPrimary,
          letterSpacing: -0.15,
        },
      }),
    [colors, fonts, spacing, radius, shadows]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-didYouKnow">
      <GraceMoodImage
        mood="fact"
        profile="idleListen"
        glowTone="muted"
        size={110}
        testID="grace-did-you-know"
      />
      <Text style={styles.title}>{DID_YOU_KNOW.title}</Text>
      <Text style={styles.sub}>{DID_YOU_KNOW.sub}</Text>
      <View style={styles.card}>
        {DID_YOU_KNOW.facts.map((fact, i) => (
          <View
            key={fact.text}
            style={[styles.row, i < DID_YOU_KNOW.facts.length - 1 && styles.rowBorder]}
          >
            <View style={styles.bullet}>
              <Ionicons name={fact.icon} size={14} color={colors.primary} />
            </View>
            <Text style={styles.fact}>{fact.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default DidYouKnowScreen;
