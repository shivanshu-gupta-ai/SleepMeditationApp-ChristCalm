import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { useTheme } from "@/src/context/ThemeContext";
import { markFirstStep } from "@/src/components/ui/FirstStepsChecklist";
import { track } from "@/src/utils/analytics";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ACTIONS: {
  id: string;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: "primary" | "sos" | "wisdom";
  href: string;
  step?: "emotion" | "sos" | "wisdom";
}[] = [
  {
    id: "feel",
    title: "How I feel",
    sub: "Emotion-based Scripture meditation",
    icon: "heart-outline",
    tone: "primary",
    href: "/(tabs)/home",
    step: "emotion",
  },
  {
    id: "sos",
    title: "Need calm now",
    sub: "4-7-8 breathing with a gentle verse",
    icon: "pulse-outline",
    tone: "sos",
    href: "/sos",
    step: "sos",
  },
  {
    id: "wisdom",
    title: "What would Jesus say?",
    sub: "Share a concern — type or speak",
    icon: "chatbubbles-outline",
    tone: "wisdom",
    href: "/(tabs)/wisdom",
    step: "wisdom",
  },
];

/**
 * FAB primary sheet — one place to start calm (video principle: FAB for create/start).
 */
export function StartCalmSheet({ visible, onClose }: Props) {
  const router = useRouter();
  const { colors, fonts, spacing } = useTheme();

  const go = (item: (typeof ACTIONS)[0]) => {
    void track("start_calm_action", { action: item.id });
    if (item.step) void markFirstStep(item.step);
    onClose();
    // Small delay so sheet close animation isn't cut off mid-nav on web
    setTimeout(() => {
      router.push(item.href as any);
    }, 80);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Start calm"
      subtitle="One gentle step — choose what you need right now."
      testID="start-calm-sheet"
    >
      <View style={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
        {ACTIONS.map((item) => {
          const accent =
            item.tone === "sos"
              ? colors.accentSOS
              : item.tone === "wisdom"
                ? colors.primary
                : colors.primary;
          const soft =
            item.tone === "sos" ? colors.accentSOSSoft : colors.primarySoft;
          return (
            <PressableScale
              key={item.id}
              haptic="medium"
              onPress={() => go(item)}
              testID={`start-calm-${item.id}`}
              accessibilityLabel={`${item.title}. ${item.sub}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                paddingVertical: 16,
                paddingHorizontal: 14,
                borderRadius: 18,
                backgroundColor: colors.backgroundElevated,
                borderWidth: 1,
                borderColor: colors.borderSoft,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: soft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={item.icon} size={22} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.headingBold,
                    fontSize: 16,
                    color: colors.textPrimary,
                  }}
                >
                  {item.title}
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
                  {item.sub}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </PressableScale>
          );
        })}
      </View>
    </BottomSheet>
  );
}
