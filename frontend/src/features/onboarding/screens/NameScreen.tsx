import React, { useMemo, useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { OnboardingQuestionScreen } from "../components/OnboardingQuestionScreen";
import { NAME_COPY } from "../copy";
import { useOnboarding } from "../OnboardingContext";

/**
 * Screen 5 — Name (optional)
 * Centered question shell + centered input.
 */
export function NameScreen() {
  const { draft, patch } = useOnboarding();
  const { colors, fonts, spacing, radius } = useTheme();
  const [reactToken, setReactToken] = useState(0);
  const lastNod = useRef(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          textAlign: "center",
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
    <OnboardingQuestionScreen
      title={NAME_COPY.title}
      subtitle={NAME_COPY.sub}
      density="roomy"
      graceSize={112}
      graceReactToken={reactToken}
      graceReactKind="nod"
      verticallyCenter
      testID="onboarding-screen-name"
    >
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
    </OnboardingQuestionScreen>
  );
}

export default NameScreen;
