import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { storage } from "@/src/utils/storage";
import { layout } from "@/src/theme/layout";
import { FadeIn } from "@/src/components/ui/FadeIn";

function CheckCircle({ done, primary, onPrimary, border }: {
  done: boolean;
  primary: string;
  onPrimary: string;
  border: string;
}) {
  const scale = useSharedValue(done ? 1 : 0.85);
  useEffect(() => {
    if (done) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 220 })
      );
    } else {
      scale.value = withTiming(0.85, { duration: 120 });
    }
  }, [done, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      style={[
        {
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 2,
          borderColor: done ? primary : border,
          backgroundColor: done ? primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {done ? <Ionicons name="checkmark" size={14} color={onPrimary} /> : null}
    </Animated.View>
  );
}

const KEY = "cc_first_steps_v1";

type StepId = "emotion" | "sos" | "wisdom" | "journal";

type StepState = Record<StepId, boolean>;

const DEFAULT: StepState = {
  emotion: false,
  sos: false,
  wisdom: false,
  journal: false,
};

const STEPS: {
  id: StepId;
  label: string;
  hint: string;
  href: string;
}[] = [
  {
    id: "emotion",
    label: "Choose how you feel",
    hint: "Open a Scripture-guided session",
    href: "/(tabs)/meditate",
  },
  {
    id: "sos",
    label: "Try SOS breathing",
    hint: "4-7-8 when panic rises",
    href: "/sos",
  },
  {
    id: "wisdom",
    label: "Share one concern",
    hint: "What would Jesus say?",
    href: "/(tabs)/wisdom",
  },
  {
    id: "journal",
    label: "Write one honest line",
    hint: "Cast a care in your journal",
    href: "/(tabs)/journal",
  },
];

async function loadState(): Promise<StepState | "dismissed"> {
  const raw = await storage.getItem<string>(KEY, "");
  if (!raw) return { ...DEFAULT };
  if (raw === "dismissed") return "dismissed";
  try {
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

async function saveState(state: StepState | "dismissed"): Promise<void> {
  if (state === "dismissed") {
    await storage.setItem(KEY, "dismissed");
    return;
  }
  await storage.setItem(KEY, JSON.stringify(state));
}

/** Mark a first-step complete from anywhere in the app. */
export async function markFirstStep(id: StepId): Promise<void> {
  const current = await loadState();
  if (current === "dismissed") return;
  current[id] = true;
  await saveState(current);
}

/**
 * Soft first-run checklist — stays until dismissed or all done.
 */
export function FirstStepsChecklist() {
  const router = useRouter();
  const { colors, fonts, spacing, shadows, isDark } = useTheme();
  const [state, setState] = useState<StepState>(DEFAULT);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadState().then((s) => {
      if (s === "dismissed") setDismissed(true);
      else setState(s);
      setReady(true);
    });
  }, []);

  const allDone = STEPS.every((s) => state[s.id]);
  if (!ready || dismissed || allDone) return null;

  const doneCount = STEPS.filter((s) => state[s.id]).length;

  const dismiss = async () => {
    setDismissed(true);
    await saveState("dismissed");
  };

  return (
    <FadeIn delay={80}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: layout.surfaceRadius,
          borderWidth: isDark ? 0 : 1,
          borderColor: isDark ? "transparent" : colors.borderSoft,
          padding: spacing.lg,
          marginBottom: layout.sectionGap,
          ...(isDark ? null : shadows.soft),
        }}
        testID="first-steps-checklist"
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing.sm,
          }}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: 13,
                letterSpacing: 0.2,
                color: colors.primary,
                marginBottom: 4,
              }}
            >
              Your first calm steps
            </Text>
            <Text
              style={{
                fontFamily: fonts.headingBold,
                fontSize: 16,
                color: colors.textPrimary,
              }}
            >
              {doneCount} of {STEPS.length} gentle practices
            </Text>
          </View>
          <PressableScale
            onPress={dismiss}
            haptic="light"
            accessibilityLabel="Dismiss checklist"
            hitSlop={8}
            style={{ padding: 6 }}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </PressableScale>
        </View>

        {STEPS.map((step) => {
          const done = state[step.id];
          return (
            <PressableScale
              key={step.id}
              haptic="light"
              onPress={() => router.push(step.href as any)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 10,
                opacity: done ? 0.55 : 1,
              }}
              testID={`first-step-${step.id}`}
            >
              <CheckCircle
                done={done}
                primary={colors.primary}
                onPrimary={colors.textOnPrimary}
                border={colors.border}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 14,
                    color: colors.textPrimary,
                    textDecorationLine: done ? "line-through" : "none",
                  }}
                >
                  {step.label}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: colors.textMuted,
                    marginTop: 1,
                  }}
                >
                  {step.hint}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </PressableScale>
          );
        })}
      </View>
    </FadeIn>
  );
}
