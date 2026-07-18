import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { FadeIn } from "@/src/components/ui/FadeIn";
import { layout } from "@/src/theme/layout";
import { getLastEmotionId } from "@/src/utils/session-progress";
import { emotionIcon } from "@/src/constants/emotion-icons";
import type { UserStage } from "@/src/utils/user-stage";

type Props = {
  emotions: { id: string; label: string; color: string }[];
  stage?: UserStage;
  completed?: number;
  streak?: number;
};

function timeOfDayPath(): {
  title: string;
  sub: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  const h = new Date().getHours();
  if (h < 11) {
    return {
      title: "Morning stillness awaits",
      sub: "A short Scripture session before the day gets loud",
      href: "/(tabs)/meditate",
      icon: "sunny-outline",
    };
  }
  if (h < 17) {
    return {
      title: "Midday reset with Him",
      sub: "A few minutes to cast your cares and breathe",
      href: "/(tabs)/meditate",
      icon: "partly-sunny-outline",
    };
  }
  if (h < 21) {
    return {
      title: "Evening unwind",
      sub: "Let His Word quiet what the day stirred",
      href: "/(tabs)/meditate",
      icon: "moon-outline",
    };
  }
  return {
    title: "Night rest under His care",
    sub: "Gentle breathing or one honest journal line",
    href: "/sos",
    icon: "bed-outline",
  };
}

/**
 * Personalized path card + simple visual progress timeline.
 * Adapts for new / returning / engaged (behavior-based personalization).
 */
export function TodaysPath({ emotions, stage = "new", completed = 0, streak = 0 }: Props) {
  const router = useRouter();
  const { colors, fonts, spacing, shadows, isDark } = useTheme();
  const [lastEmotionId, setLastEmotionId] = useState<string | null>(null);

  useEffect(() => {
    getLastEmotionId().then(setLastEmotionId);
  }, []);

  const path = timeOfDayPath();
  const lastEm = lastEmotionId ? emotions.find((e) => e.id === lastEmotionId) : null;

  // Timeline stages — reduce uncertainty like order-tracking UX
  const steps = [
    { id: "feel", label: "Feel", done: Boolean(lastEmotionId) || completed > 0 },
    { id: "rest", label: "Rest", done: completed > 0 },
    { id: "grow", label: "Grow", done: completed >= 3 || streak >= 2 },
  ];

  const title = lastEm
    ? stage === "engaged"
      ? `Deepen · ${lastEm.label}`
      : `Continue · ${lastEm.label}`
    : path.title;

  const sub = lastEm
    ? stage === "engaged"
      ? "Return to what met you — or pick a new feeling below"
      : "Scripture-guided calm for this feeling"
    : path.sub;

  const ctaLabel = lastEm ? "Open session" : "Start now";

  return (
    <FadeIn delay={20}>
      <View style={{ marginBottom: layout.sectionGap }}>
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 13,
            letterSpacing: 0.15,
            color: colors.textMuted,
            marginBottom: spacing.md,
          }}
        >
          {stage === "new" ? "Your first path" : stage === "engaged" ? "Today’s focus" : "Today’s path"}
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
            borderWidth: isDark ? 0 : 1,
            borderColor: isDark ? "transparent" : colors.borderSoft,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.lg,
            ...(isDark ? null : shadows.soft),
          }}
          testID="todays-path-card"
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 20,
                backgroundColor: lastEm
                  ? lastEm.color + (isDark ? "28" : "33")
                  : colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={lastEm ? emotionIcon(lastEm.id) : path.icon}
                size={26}
                color={lastEm ? lastEm.color : colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.headingBold,
                  fontSize: 18,
                  color: colors.textPrimary,
                  letterSpacing: -0.35,
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: 4,
                  lineHeight: 19,
                }}
              >
                {sub}
              </Text>
            </View>
          </View>

          {/* Confident status strip — “everything is under control” */}
          <View
            style={{
              marginTop: spacing.lg,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.borderSoft,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
              {steps.map((s, i) => (
                <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: s.done
                        ? isDark
                          ? colors.premium
                          : colors.primary
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : colors.surfaceAlt,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {s.done ? (
                      <Ionicons name="checkmark" size={12} color={isDark ? "#1A1525" : "#fff"} />
                    ) : (
                      <Text
                        style={{
                          fontFamily: fonts.bodyBold,
                          fontSize: 10,
                          color: colors.textMuted,
                        }}
                      >
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{
                      fontFamily: s.done ? fonts.bodyBold : fonts.body,
                      fontSize: 12,
                      color: s.done ? colors.textPrimary : colors.textMuted,
                    }}
                  >
                    {s.label}
                  </Text>
                  {i < steps.length - 1 ? (
                    <View
                      style={{
                        width: 12,
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: steps[i + 1]?.done
                          ? isDark
                            ? colors.premium + "88"
                            : colors.primary + "55"
                          : colors.borderSoft,
                        marginLeft: 2,
                      }}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          <View
            style={{
              marginTop: spacing.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              {streak > 1
                ? `${streak}-day rhythm of rest`
                : completed > 0
                  ? `${completed} session${completed === 1 ? "" : "s"} completed`
                  : "You’re safe to start slowly"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: isDark ? colors.premiumSoft : colors.primarySoft,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bodyBold,
                  fontSize: 13,
                  color: isDark ? colors.premium : colors.primary,
                }}
              >
                {ctaLabel}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={isDark ? colors.premium : colors.primary}
              />
            </View>
          </View>
        </PressableScale>
      </View>
    </FadeIn>
  );
}
