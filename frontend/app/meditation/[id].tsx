import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "@/src/components/BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useTheme } from "@/src/context/ThemeContext";
import { useResponsive } from "@/src/hooks/use-responsive";
import { api } from "@/src/api/client";
import { usePremium } from "@/src/features/subscriptions";
import { markSoftPaywallShown, shouldShowSoftPaywall } from "@/src/utils/soft-paywall";
import {
  recordMeditationComplete,
  shouldOfferPaywallAfterCompletes,
} from "@/src/utils/session-progress";
import { track } from "@/src/utils/analytics";
import { playHaptic } from "@/src/utils/haptics";
import { LoadingState, ErrorState, Button } from "@/src/components/ui";
import { meditationCoverSource } from "@/src/constants/meditation-covers";
import {
  openSystemFocusSettings,
  promptSilenceBeforeSession,
} from "@/src/utils/focus-mode";

type Meditation = {
  id: string;
  title: string;
  subtitle: string;
  duration_min: number;
  cover?: string;
  cover_file?: string;
  scripture: string;
  verse: string;
  audio_url: string;
  premium: boolean;
};

export default function MeditationPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isPremium } = usePremium();
  const { colors, fonts, spacing } = useTheme();
  const { scale } = useResponsive();
  const [med, setMed] = useState<Meditation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const celebrateOpacity = useRef(new Animated.Value(0)).current;

  const player = useAudioPlayer(med?.audio_url ? { uri: med.audio_url } : null);
  const status = useAudioPlayerStatus(player);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await api.meditationById(id as string);
      setMed(m);
      if (m.premium && !isPremium) {
        router.replace("/paywall");
      }
    } catch (e: any) {
      setError(e?.message || "Could not load this meditation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isPremium]);

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
      void track("meditation_complete", {
        id: med.id,
        minutes: med.duration_min,
      });
      void playHaptic("success");

      recordMeditationComplete().then(({ completedCount, streak: s, isFirstComplete }) => {
        setStreak(s);
        setShowCelebration(true);
        Animated.timing(celebrateOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }).start();

        // Soft paywall after first complete (and every 3rd) — after user sees celebration
        if (shouldOfferPaywallAfterCompletes(completedCount, isPremium)) {
          shouldShowSoftPaywall().then((show) => {
            if (show || isFirstComplete) {
              setTimeout(() => {
                void markSoftPaywallShown();
                void track("paywall_shown", { after_completes: completedCount });
                router.push("/paywall");
              }, 2800);
            }
          });
        }
      });
    }
  }, [status?.currentTime, status?.duration, med, completed, isPremium, router, celebrateOpacity]);

  const togglePlay = async () => {
    if (!player) return;
    if (status?.playing) {
      player.pause();
      return;
    }
    // First play: offer system Focus / DND so notifications don’t interrupt
    if (!status?.currentTime || status.currentTime < 1) {
      await promptSilenceBeforeSession();
    }
    void track("meditation_start", { id: med?.id });
    player.play();
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  if (loading) {
    return <LoadingState message="Preparing your session…" />;
  }

  if (error || !med) {
    return (
      <ErrorState
        title="Session unavailable"
        message={error || "This meditation could not be found."}
        onRetry={load}
      />
    );
  }

  const progress = status?.duration ? status.currentTime / status.duration : 0;
  const artSize = scale(250);

  return (
    <ImageBackground
      source={meditationCoverSource(med.id, med.cover, med.cover_file)}
      style={{ flex: 1 }}
      blurRadius={30}
    >
      <LinearGradient colors={[colors.scrim, "rgba(11,13,18,0.88)"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: spacing.md,
            }}
          >
            <BackButton
              fallback="/(tabs)/meditate"
              icon="chevron-down"
              size={30}
              color={colors.white}
              testID="med-close-btn"
            />
            <Text
              style={{
                color: colors.white,
                fontFamily: fonts.body,
                fontSize: 12,
                letterSpacing: 2,
              }}
            >
              Now Playing
            </Text>
            <TouchableOpacity
              onPress={() => void openSystemFocusSettings()}
              accessibilityLabel="Silence phone notifications"
              testID="med-silence-notifications"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="notifications-off-outline" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: spacing.xl,
            }}
          >
            <Animated.View
              style={{
                width: artSize,
                height: artSize,
                borderRadius: artSize / 2,
                overflow: "hidden",
                marginBottom: spacing.xl,
                transform: [{ scale: pulse }],
              }}
            >
              <ImageBackground
                source={meditationCoverSource(med.id, med.cover, med.cover_file)}
                style={{ width: "100%", height: "100%" }}
                imageStyle={{ borderRadius: artSize / 2 }}
              />
            </Animated.View>

            <Text
              style={{
                fontFamily: fonts.headingBold,
                fontSize: 28,
                color: colors.white,
                textAlign: "center",
                letterSpacing: -0.5,
              }}
            >
              {med.title}
            </Text>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 15,
                color: "rgba(255,255,255,0.85)",
                marginTop: 6,
                textAlign: "center",
              }}
            >
              {med.subtitle}
            </Text>

            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.md, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: fonts.scripture,
                  fontSize: 18,
                  color: colors.white,
                  textAlign: "center",
                  lineHeight: 28,
                }}
              >
                “{med.verse}”
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.75)",
                  marginTop: 6,
                }}
              >
                — {med.scripture}
              </Text>
            </View>
          </View>

          {showCelebration ? (
            <Animated.View
              style={{
                opacity: celebrateOpacity,
                marginHorizontal: spacing.lg,
                marginBottom: spacing.md,
                padding: spacing.lg,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.12)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.22)",
                alignItems: "center",
              }}
              testID="meditation-complete-banner"
            >
              <Ionicons name="checkmark-circle" size={36} color={colors.white} />
              <Text
                style={{
                  fontFamily: fonts.headingBold,
                  fontSize: 20,
                  color: colors.white,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                Well done
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.85)",
                  marginTop: 6,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                You finished this session.
                {streak > 1 ? ` ${streak}-day rhythm of rest.` : " Peace is a practice."}
              </Text>
              <View style={{ marginTop: spacing.md, width: "100%" }}>
                <Button
                  label="Back to Meditate"
                  variant="secondary"
                  onPress={() => router.replace("/(tabs)/meditate")}
                  fullWidth
                  style={{ backgroundColor: colors.white }}
                />
              </View>
            </Animated.View>
          ) : null}

          <View style={{ padding: spacing.lg, alignItems: "center" }}>
            <View style={{ width: "100%", marginBottom: spacing.lg }}>
              <View
                style={{
                  height: 3,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${progress * 100}%`,
                    backgroundColor: colors.white,
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 6,
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.75)", fontFamily: fonts.body, fontSize: 12 }}>
                  {formatTime(status?.currentTime || 0)}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontFamily: fonts.body, fontSize: 12 }}>
                  {formatTime(status?.duration || 0)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                width: 78,
                height: 78,
                borderRadius: 39,
                backgroundColor: colors.white,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={togglePlay}
              testID="med-play-btn"
            >
              <Ionicons
                name={status?.playing ? "pause" : "play"}
                size={38}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            {completed ? (
              <Text
                style={{
                  color: colors.white,
                  fontFamily: fonts.bodyBold,
                  marginTop: spacing.md,
                  fontSize: 13,
                }}
                testID="med-completed"
              >
                ✓ Session complete
              </Text>
            ) : null}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
