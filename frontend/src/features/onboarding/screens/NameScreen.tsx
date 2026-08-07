import React, { useMemo, useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingGrace } from "../components/OnboardingGrace";
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
  const [reactToken, setReactToken] = useState(0);
  const lastNod = useRef(0);

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
          marginBottom: spacing.lg,
          width: "100%",
        },
        headerText: { width: "100%" },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 24,
          lineHeight: 32,
          letterSpacing: -0.4,
          color: colors.textPrimary,
          marginBottom: spacing.xs,
          textAlign: "left",
        },
        sub: {
          fontFamily: fonts.body,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: "left",
        },
        input: {
          width: "100%",
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingVertical: 16,
          paddingHorizontal: spacing.md,
          fontSize: 17,
          fontFamily: fonts.body,
          color: colors.textPrimary,
          borderWidth: 1.5,
          borderColor: colors.borderSoft,
          textAlign: "left",
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
          textAlign: "center",
        },
      }),
    [colors, fonts, spacing, radius]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-name">
      <GraceMoodImage
        mood="thinkname"
        size={110}
        showGlow={false}
        testID="grace-name"
        reactToken={reactToken}
        reactKind="nod"
        style={{ alignSelf: "center", marginBottom: spacing.md }}
      />
      <View style={styles.headerRow}>
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
        onChangeText={(name) => {
          patch({ name });
          const now = Date.now();
          if (now - lastNod.current > 900) {
            lastNod.current = now;
            setReactToken((t) => t + 1);
          }
        }}
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
