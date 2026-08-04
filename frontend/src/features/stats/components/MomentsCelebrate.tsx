import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { Surface } from "@/src/components/ui/Surface";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import type { Milestone } from "@/src/features/stats/types";

type Props = { milestones: Milestone[] };

export function MomentsCelebrate({ milestones }: Props) {
  const { colors, fonts, spacing } = useTheme();
  if (!milestones.length) return null;

  return (
    <View style={{ marginBottom: spacing.lg }} testID="stats-milestones">
      <SectionHeader
        title="Moments to Celebrate"
        subtitle="Gifts along the way — never a ladder"
      />
      <Surface padded={false} style={{ overflow: "hidden" }}>
        {milestones.map((m, i) => (
          <View
            key={m.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 14,
              paddingHorizontal: spacing.md,
              borderBottomWidth: i === milestones.length - 1 ? 0 : 1,
              borderBottomColor: colors.borderSoft,
            }}
            accessibilityLabel={`${m.title}. ${m.detail}`}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="leaf-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontFamily: fonts.bodyBold,
                  fontSize: 15,
                  color: colors.textPrimary,
                }}
              >
                {m.title}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.textMuted,
                  marginTop: 2,
                }}
              >
                {m.detail}
              </Text>
            </View>
          </View>
        ))}
      </Surface>
    </View>
  );
}
