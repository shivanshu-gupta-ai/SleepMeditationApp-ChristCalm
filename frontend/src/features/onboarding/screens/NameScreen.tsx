import React, { useMemo } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { NAME_COPY } from "../copy";
import { useOnboarding } from "../OnboardingContext";

/**
 * Screen 5 — Name (optional)
 * Exact copy from Onboarding-Design-Spec §3.5
 * Stores draft.name in OnboardingContext
 */
export function NameScreen() {
  const { draft, patch } = useOnboarding();
  const { colors, fonts, spacing, radius } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
        },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          marginBottom: spacing.lg,
        },
        headerText: { flex: 1 },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 24,
          lineHeight: 32,
          letterSpacing: -0.4,
          color: colors.textPrimary,
          marginBottom: spacing.xs,
        },
        sub: {
          fontFamily: fonts.body,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
        },
        input: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingVertical: 16,
          paddingHorizontal: spacing.md,
          fontSize: 17,
          fontFamily: fonts.body,
          color: colors.textPrimary,
          borderWidth: 1.5,
          borderColor: colors.borderSoft,
        },
        friendLink: {
          marginTop: spacing.md,
          alignSelf: "center",
          paddingVertical: 8,
        },
        friendText: {
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textSecondary,
        },
      }),
    [colors, fonts, spacing, radius]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-name">
      <View style={styles.headerRow}>
        <GraceMoodImage mood="listening" size={72} testID="grace-name" />
        <View style={styles.headerText}>
          <Text style={styles.title}>{NAME_COPY.title}</Text>
          <Text style={styles.sub}>{NAME_COPY.sub}</Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder={NAME_COPY.placeholder}
        placeholderTextColor={colors.textMuted}
        value={draft.name}
        onChangeText={(name) => patch({ name })}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        maxLength={40}
        testID="onboarding-name-input"
        accessibilityLabel={NAME_COPY.title}
      />

      <TouchableOpacity
        style={styles.friendLink}
        onPress={() => patch({ name: "Friend" })}
        testID="onboarding-call-friend"
      >
        <Text style={styles.friendText}>{NAME_COPY.friendLink}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default NameScreen;
