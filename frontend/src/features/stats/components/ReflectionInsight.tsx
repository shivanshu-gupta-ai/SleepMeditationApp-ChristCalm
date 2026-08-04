import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { Surface } from "@/src/components/ui/Surface";

type Props = { text: string | null };

export function ReflectionInsight({ text }: Props) {
  const { colors, fonts, spacing } = useTheme();
  if (!text) return null;

  return (
    <Surface style={{ marginBottom: spacing.lg }} testID="stats-reflection">
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <Ionicons name="heart-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 13,
              color: colors.textMuted,
              marginBottom: 6,
            }}
          >
            A quiet notice
          </Text>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              lineHeight: 24,
              color: colors.textPrimary,
              letterSpacing: -0.2,
            }}
          >
            {text}
          </Text>
        </View>
      </View>
    </Surface>
  );
}
