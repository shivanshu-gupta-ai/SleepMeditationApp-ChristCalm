import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { colors, fonts, spacing, radius } from "@/src/theme";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

type Meditation = {
  id: string;
  title: string;
  subtitle: string;
  duration_min: number;
  cover: string;
  scripture: string;
  verse: string;
  audio_url: string;
  premium: boolean;
};

export default function MeditationPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [med, setMed] = useState<Meditation | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  const player = useAudioPlayer(med?.audio_url ? { uri: med.audio_url } : null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    (async () => {
      try {
        const m = await api.meditationById(id as string);
        setMed(m);
        if (m.premium && !user?.is_premium) {
          router.replace("/paywall");
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user?.is_premium, router]);

  useEffect(() => {
    if (status?.playing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [status?.playing, pulse]);

  useEffect(() => {
    if (
      med &&
      status?.duration &&
      status?.currentTime > 0 &&
      status.currentTime >= status.duration - 0.5 &&
      !completed
    ) {
      setCompleted(true);
      api.completeMeditation(med.id, med.duration_min).catch(() => {});
    }
  }, [status?.currentTime, status?.duration, med, completed]);

  const togglePlay = () => {
    if (!player) return;
    if (status?.playing) player.pause();
    else player.play();
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  if (loading || !med) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const progress = status?.duration ? status.currentTime / status.duration : 0;

  return (
    <ImageBackground source={{ uri: med.cover }} style={{ flex: 1 }} blurRadius={30}>
      <LinearGradient
        colors={["rgba(31,41,55,0.35)", "rgba(31,41,55,0.75)"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} testID="med-close-btn">
              <Ionicons name="chevron-down" size={30} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerLabel}>Now Playing</Text>
            <View style={{ width: 30 }} />
          </View>

          <View style={styles.body}>
            <Animated.View style={[styles.artWrap, { transform: [{ scale: pulse }] }]}>
              <ImageBackground
                source={{ uri: med.cover }}
                style={styles.art}
                imageStyle={{ borderRadius: 140 }}
              />
            </Animated.View>

            <Text style={styles.title}>{med.title}</Text>
            <Text style={styles.subtitle}>{med.subtitle}</Text>

            <View style={styles.verseWrap}>
              <Text style={styles.verse}>"{med.verse}"</Text>
              <Text style={styles.verseRef}>— {med.scripture}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.progressWrap}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(status?.currentTime || 0)}</Text>
                <Text style={styles.timeText}>{formatTime(status?.duration || 0)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.playBtn} onPress={togglePlay} testID="med-play-btn">
              <Ionicons
                name={status?.playing ? "pause" : "play"}
                size={38}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            {completed && (
              <Text style={styles.completedText} testID="med-completed">
                ✓ Session complete
              </Text>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  headerLabel: {
    color: colors.white,
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 2,
  },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  artWrap: {
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  art: { width: "100%", height: "100%" },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: 28,
    color: colors.white,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
    textAlign: "center",
  },
  verseWrap: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  verse: {
    fontFamily: fonts.scriptureItalic,
    fontSize: 18,
    color: colors.white,
    textAlign: "center",
    lineHeight: 28,
  },
  verseRef: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
  },
  controls: { padding: spacing.lg, alignItems: "center" },
  progressWrap: { width: "100%", marginBottom: spacing.lg },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.white },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  timeText: { color: "rgba(255,255,255,0.75)", fontFamily: fonts.body, fontSize: 12 },
  playBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  completedText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    marginTop: spacing.md,
    fontSize: 13,
  },
});
