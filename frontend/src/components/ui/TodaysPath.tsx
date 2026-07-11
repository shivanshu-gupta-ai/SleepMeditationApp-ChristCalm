import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { FadeIn } from "@/src/components/ui/FadeIn";
import { layout } from "@/src/theme/layout";
import { getLastEmotionId, getStreak } from "@/src/utils/session-progress";
import { emotionIcon } from "@/src/constants/emotion-icons";

type Props = {
  emotions: { id: string; label: string; color: string }[];
};

function timeOfDayPath(): { title: string; sub: string; href: string; icon: keyof typeof Ionicons.glyphMap } {
  const h = new Date().getHours();
  if (h < 11) {
    return {
      title: "Morning stillness",
      sub: "Start with one short Scripture session",
      href: "/(tabs)/meditate",
      icon: "sunny-outline",
    };
  }
  if (h < 17) {
    return {
      title: "Midday reset",
      sub: "A few minutes to cast your cares",
      href: "/(tabs)/meditate",
      icon: "partly-sunny-outline",
    };
  }
  if (h < 21) {
    return {
      title: "Evening unwind",
      sub: "Let His Word quiet the day",
      href: "/(tabs)/meditate",
      icon: "moon-outline",
    };
  }
  return {
    title: "Night rest",
    sub: "SOS breathing or a gentle journal line",
    href: "/sos",
    icon: "bed-outline",
  };
}

/** Personalized “today’s path” — time of day + last emotion continuity. */
export function TodaysPath({ emotions }: Props) {
  const router = useRouter();
  const { colors, fonts, spacing, shadows } = useTheme();
  const [lastEmotionId, setLastEmotionId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    getLastEmotionId().then(setLastEmotionId);
    getStreak().then(setStreak);
  }, []);

  const path = timeOfDayPath();
  const lastEm = lastEmotionId ? emotions.find((e) => e.id === lastEmotionId) : null;

  return (
    <FadeIn delay={20}>
      <View style={{ marginBottom: layout.sectionGap }}>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: layout.overlineSize,
            letterSpacing: layout.overlineTracking,
            textTransform: "uppercase",
            color: colors.textMuted,
            marginBottom: spacing.sm,
          }}
        >
          Today’s path
        </Text>

        <PressableScale
          haptic="medium"
          onPress={() => {
            if (lastEm) {
              router.push({ pathname: "/(tabs)/meditate", params: { emotion: lastEm.id } });
            } else {
              router.push(path.href as any);
            }
          }}
          style={{
            backgroundColor: colors.surface,
            borderRadius: layout.surfaceRadius,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            padding: spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            ...shadows.soft,
          }}
          testID="todays-path-card"
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: lastEm ? lastEm.color + "33" : colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={lastEm ? emotionIcon(lastEm.id) : path.icon}
              size={22}
              color={lastEm ? lastEm.color : colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.headingBold,
                fontSize: 16,
                color: colors.textPrimary,
              }}
            >
              {lastEm ? `Continue with ${lastEm.label}` : path.title}
            </Text>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 2,
                lineHeight: 18,
              }}
            >
              {lastEm
                ? "Pick up Scripture-guided calm for this feeling"
                : path.sub}
              {streak > 1 ? ` · ${streak}-day rhythm` : ""}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </PressableScale>
      </View>
    </FadeIn>
  );
}
