import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, spacing, radius } from "@/src/theme";

// 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s
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
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [verse, setVerse] = useState(SCRIPTURES[0]);
  const scale = useRef(new Animated.Value(0.6)).current;
  const timer = useRef<any>(null);

  useEffect(() => {
    setVerse(SCRIPTURES[Math.floor(Math.random() * SCRIPTURES.length)]);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const runPhase = (idx: number) => {
    const { phase, duration } = PATTERN[idx];
    const toValue = phase === "Breathe in" ? 1 : phase === "Breathe out" ? 0.55 : scale.__getValue ? scale.__getValue() : 1;
    Animated.timing(scale, {
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
      setPhaseIdx(next);
      runPhase(next);
    }, duration);
  };

  const start = () => {
    setRunning(true);
    setPhaseIdx(0);
    setCycle(0);
    runPhase(0);
  };

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setRunning(false);
    Animated.timing(scale, {
      toValue: 0.6,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient
      colors={["#EEF6F7", "#F9F7F1", "#F4EFE6"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} testID="sos-close-btn">
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Panic Relief</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.instruction}>{running ? PATTERN[phaseIdx].phase : "Ready?"}</Text>
          <Text style={styles.sub}>
            {running ? `Cycle ${cycle + 1} · 4-7-8 breathing` : "Follow the circle. You're safe."}
          </Text>

          <View style={styles.circleWrap}>
            <Animated.View
              style={[
                styles.outerCircle,
                { transform: [{ scale }] },
              ]}
            >
              <LinearGradient
                colors={[colors.accentSOS, colors.primary]}
                style={styles.innerCircle}
              >
                <Ionicons
                  name={running ? "heart" : "play"}
                  size={44}
                  color={colors.white}
                />
              </LinearGradient>
            </Animated.View>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseText}>"{verse.verse}"</Text>
            <Text style={styles.verseRef}>— {verse.ref}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {!running ? (
            <TouchableOpacity style={styles.startBtn} onPress={start} testID="sos-start-btn">
              <Ionicons name="play" size={20} color={colors.white} />
              <Text style={styles.startBtnText}>Begin Breathing</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopBtn} onPress={stop} testID="sos-stop-btn">
              <Ionicons name="pause" size={20} color={colors.accentSOSDark} />
              <Text style={styles.stopBtnText}>Pause</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  closeBtn: { padding: spacing.sm },
  headerTitle: { fontFamily: fonts.headingBold, fontSize: 17, color: colors.textPrimary },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  instruction: {
    fontFamily: fonts.headingBold,
    fontSize: 34,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: spacing.xl,
  },
  circleWrap: { width: 280, height: 280, justifyContent: "center", alignItems: "center" },
  outerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(210,125,120,0.15)",
  },
  innerCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    justifyContent: "center",
    alignItems: "center",
  },
  verseCard: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  verseText: {
    fontFamily: fonts.scriptureItalic,
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 30,
  },
  verseRef: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
  footer: { padding: spacing.lg },
  startBtn: {
    backgroundColor: colors.accentSOS,
    paddingVertical: 18,
    borderRadius: radius.full,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  startBtnText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 17 },
  stopBtn: {
    backgroundColor: colors.surface,
    paddingVertical: 18,
    borderRadius: radius.full,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.accentSOS,
  },
  stopBtnText: { color: colors.accentSOSDark, fontFamily: fonts.bodyBold, fontSize: 17 },
});
