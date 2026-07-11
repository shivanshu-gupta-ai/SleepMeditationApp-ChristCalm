import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "@/src/components/BackButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { useResponsive } from "@/src/hooks/use-responsive";
import { Button } from "@/src/components/ui";
import { playHaptic } from "@/src/utils/haptics";
import { track } from "@/src/utils/analytics";

const PATTERN: { phase: "Breathe in" | "Hold" | "Breathe out"; duration: number }[] = [
  { phase: "Breathe in", duration: 4000 },
  { phase: "Hold", duration: 7000 },
  { phase: "Breathe out", duration: 8000 },
];

const SCRIPTURES = [
  { verse: "Be still, and know that I am God.", ref: "Psalm 46:10" },
  { verse: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
  { verse: "Do not be anxious about anything.", ref: "Philippians 4:6" },
  { verse: "The Lord is my shepherd, I lack nothing.", ref: "Psalm 23:1" },
];

export default function SOS() {
  const { colors, fonts, spacing, radius, isDark } = useTheme();
  const { scale } = useResponsive();
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [verse, setVerse] = useState(SCRIPTURES[0]);
  const animScale = useRef(new Animated.Value(0.6)).current;
  const phaseOpacity = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVerse(SCRIPTURES[Math.floor(Math.random() * SCRIPTURES.length)]);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const crossfadePhaseLabel = (nextIdx: number) => {
    Animated.sequence([
      Animated.timing(phaseOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(phaseOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    // Soft haptic on each phase change (light — frequent)
    void playHaptic(PATTERN[nextIdx].phase === "Hold" ? "light" : "light");
  };

  const runPhase = (idx: number) => {
    const { phase, duration } = PATTERN[idx];
    const toValue = phase === "Breathe in" ? 1 : phase === "Breathe out" ? 0.55 : 1;
    Animated.timing(animScale, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    }).start();
    timer.current = setTimeout(() => {
      const next = (idx + 1) % PATTERN.length;
      if (next === 0) {
        setCycle((c) => c + 1);
        setVerse(SCRIPTURES[Math.floor(Math.random() * SCRIPTURES.length)]);
      }
      crossfadePhaseLabel(next);
      setPhaseIdx(next);
      runPhase(next);
    }, duration);
  };

  const start = () => {
    setRunning(true);
    setPhaseIdx(0);
    setCycle(0);
    phaseOpacity.setValue(1);
    void playHaptic("medium");
    void track("sos_start");
    runPhase(0);
  };

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setRunning(false);
    void playHaptic("light");
    void track("sos_stop", { cycle });
    Animated.timing(animScale, {
      toValue: 0.6,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const circleSize = scale(250);

  return (
    <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: spacing.md,
          }}
        >
          <BackButton
            fallback="/(tabs)/profile"
            icon="close"
            size={24}
            style={{ padding: spacing.sm }}
            testID="sos-close-btn"
          />
          <Text style={{ fontFamily: fonts.headingBold, fontSize: 17, color: colors.textPrimary }}>
            Panic Relief
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: spacing.lg,
          }}
        >
          <Animated.Text
            style={{
              fontFamily: fonts.headingBold,
              fontSize: scale(32),
              color: colors.textPrimary,
              letterSpacing: -0.5,
              opacity: phaseOpacity,
            }}
          >
            {running ? PATTERN[phaseIdx].phase : "Ready?"}
          </Animated.Text>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 15,
              color: colors.textSecondary,
              marginTop: 6,
              marginBottom: spacing.sm,
            }}
          >
            {running ? `Cycle ${cycle + 1} · 4-7-8 breathing` : "Follow the circle. You're safe."}
          </Text>
          {running ? (
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: spacing.xl,
              }}
            >
              {PATTERN.map((p, i) => (
                <View
                  key={p.phase}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor:
                      i === phaseIdx ? colors.accentSOSSoft : colors.surface,
                    borderWidth: 1,
                    borderColor:
                      i === phaseIdx ? colors.accentSOS + "66" : colors.borderSoft,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: i === phaseIdx ? fonts.bodyBold : fonts.body,
                      fontSize: 11,
                      color: i === phaseIdx ? colors.accentSOSDark : colors.textMuted,
                    }}
                  >
                    {p.phase.replace("Breathe ", "")}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ height: spacing.xl }} />
          )}

          <View
            style={{
              width: circleSize + 20,
              height: circleSize + 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Animated.View
              style={{
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isDark
                  ? "rgba(232,160,155,0.12)"
                  : "rgba(210,125,120,0.15)",
                transform: [{ scale: animScale }],
              }}
            >
              <LinearGradient
                colors={[colors.accentSOS, colors.primary]}
                style={{
                  width: circleSize * 0.72,
                  height: circleSize * 0.72,
                  borderRadius: (circleSize * 0.72) / 2,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={running ? "heart" : "play"}
                  size={44}
                  color={colors.white}
                />
              </LinearGradient>
            </Animated.View>
          </View>

          <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg, alignItems: "center" }}>
            <Text
              style={{
                fontFamily: fonts.scriptureItalic,
                fontSize: 20,
                color: colors.textPrimary,
                textAlign: "center",
                lineHeight: 30,
              }}
            >
              “{verse.verse}”
            </Text>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 13,
                color: colors.textMuted,
                marginTop: 8,
              }}
            >
              — {verse.ref}
            </Text>
          </View>
        </View>

        <View style={{ padding: spacing.lg }}>
          {!running ? (
            <Button
              label="Begin Breathing"
              variant="sos"
              icon="play"
              onPress={start}
              testID="sos-start-btn"
            />
          ) : (
            <TouchableOpacity
              onPress={stop}
              testID="sos-stop-btn"
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 18,
                borderRadius: radius.full,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                borderWidth: 1.5,
                borderColor: colors.accentSOS,
              }}
            >
              <Ionicons name="pause" size={20} color={colors.accentSOSDark} />
              <Text
                style={{
                  color: colors.accentSOSDark,
                  fontFamily: fonts.bodyBold,
                  fontSize: 17,
                }}
              >
                Pause
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
