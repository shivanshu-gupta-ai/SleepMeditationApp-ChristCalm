import React from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { Surface } from "@/src/components/ui/Surface";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { PressableScale } from "@/src/components/ui/PressableScale";
import type { RecentSession } from "@/src/features/stats/types";

type Props = { sessions: RecentSession[] };

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function RecentSessions({ sessions }: Props) {
  const router = useRouter();
  const { colors, fonts, spacing } = useTheme();
  if (!sessions.length) return null;

  return (
    <View style={{ marginBottom: spacing.lg }} testID="stats-recent">
      <SectionHeader title="Recent stillness" subtitle="Tap to return when ready" />
      <Surface padded={false} style={{ overflow: "hidden" }}>
        {sessions.map((s, i) => (
          <PressableScale
            key={s.id}
            onPress={() => router.push("/(tabs)/meditate")}
            haptic="light"
            accessibilityLabel={`${s.title}, ${s.minutes} minutes, ${formatWhen(s.created_at)}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 14,
              paddingHorizontal: spacing.md,
              borderBottomWidth: i === sessions.length - 1 ? 0 : 1,
              borderBottomColor: colors.borderSoft,
              minHeight: 52,
            }}
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
              <Ionicons name="play-outline" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fonts.bodyBold,
                  fontSize: 15,
                  color: colors.textPrimary,
                }}
              >
                {s.title}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {s.minutes > 0 ? `${s.minutes} min · ` : ""}
                {formatWhen(s.created_at)}
                {typeof s.stars === "number" ? ` · ${s.stars}★` : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </PressableScale>
        ))}
      </Surface>
    </View>
  );
}
