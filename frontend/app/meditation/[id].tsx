import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
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
import { LoadingState, ErrorState } from "@/src/components/ui";
import { meditationCoverSource } from "@/src/constants/meditation-covers";
import {
  openSystemFocusSettings,
  promptSilenceBeforeSession,
} from "@/src/utils/focus-mode";
import { saveMeditationRating } from "@/src/utils/session-rating";
import {
  setActiveMeditationPlayer,
  stopActiveMeditationPlayer,
} from "@/src/utils/meditation-audio";

const SKIP_SEC = 15;
const RATES = [0.75, 1, 1.25] as const;

const ctrlBtnStyle = {
  alignItems: "center" as const,
  justifyContent: "center" as const,
  minWidth: 56,
  minHeight: 48,
  gap: 2,
};

const ctrlLabelStyle = (fonts: { body: string }) => ({
  fontFamily: fonts.body,
  fontSize: 11,
  color: "rgba(255,255,255,0.7)",
  marginTop: 2,
});

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
  const { colors, fonts, spacing, isDark } = useTheme();
  const { scale } = useResponsive();
  const [med, setMed] = useState<Meditation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [rateIndex, setRateIndex] = useState(1); // 1x default
  const pulse = useRef(new Animated.Value(1)).current;
  const celebrateOpacity = useRef(new Animated.Value(0)).current;

  const player = useAudioPlayer(med?.audio_url ? { uri: med.audio_url } : null, {
    updateInterval: 250,
  });
  const status = useAudioPlayerStatus(player);
  const playerRef = useRef(player);
  playerRef.current = player;

  /** Optimal exit: always pause + release before leaving the screen */
  const endSession = useCallback(() => {
    try {
      playerRef.current?.pause();
    } catch {
      // ignore
    }
    stopActiveMeditationPlayer();
  }, []);

  const exitToMeditate = useCallback(() => {
    endSession();
    router.replace("/(tabs)/meditate");
  }, [endSession, router]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await api.meditationById(id as string);
      setMed(m);
      if (m.premium && !isPremium) {
        endSession();
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

  // Register active player; stop on blur/unmount (back, tab change, logout race)
  useFocusEffect(
    useCallback(() => {
      if (player) setActiveMeditationPlayer(player);
      return () => {
        try {
          player?.pause();
        } catch {
          // ignore
        }
        stopActiveMeditationPlayer();
      };
    }, [player])
  );

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.pause();
      } catch {
        // ignore
      }
      stopActiveMeditationPlayer();
    };
  }, []);

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
      try {
        player?.pause();
      } catch {
        // ignore
      }
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
                endSession();
                router.push("/paywall");
              }, 2800);
            }
          });
        }
      });
    }
  }, [
    status?.currentTime,
    status?.duration,
    med,
    completed,
    isPremium,
    router,
    celebrateOpacity,
    player,
    endSession,
  ]);

  const duration = status?.duration && isFinite(status.duration) ? status.duration : 0;
  const currentTime = scrubbing
    ? scrubTime
    : status?.currentTime && isFinite(status.currentTime)
      ? status.currentTime
      : 0;

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
    setActiveMeditationPlayer(player);
    void track("meditation_start", { id: med?.id });
    player.play();
  };

  const seekTo = async (seconds: number) => {
    if (!player || !duration) return;
    const t = Math.max(0, Math.min(duration, seconds));
    try {
      await player.seekTo(t);
      setScrubTime(t);
    } catch {
      // ignore seek failures on unloaded source
    }
  };

  const skipBy = async (delta: number) => {
    const base = status?.currentTime && isFinite(status.currentTime) ? status.currentTime : 0;
    await seekTo(base + delta);
    void playHaptic("light");
  };

  const restart = async () => {
    if (!player) return;
    await seekTo(0);
    setCompleted(false);
    setShowCelebration(false);
    setRating(0);
    setRatingSaved(false);
    setActiveMeditationPlayer(player);
    player.play();
    void playHaptic("light");
  };

  const cycleRate = () => {
    if (!player) return;
    const next = (rateIndex + 1) % RATES.length;
    setRateIndex(next);
    try {
      player.setPlaybackRate(RATES[next]);
    } catch {
      // ignore
    }
    void playHaptic("light");
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const submitRating = async (stars: number) => {
    if (!med || ratingSaved) return;
    setRating(stars);
    try {
      // Local + DynamoDB (per user) — see session-rating / POST /meditations/rate
      await saveMeditationRating(med.id, stars, med.duration_min);
      void track("meditation_rated", {
        id: med.id,
        stars,
        meditation_id: med.id,
      });
      void playHaptic("success");
      setRatingSaved(true);
    } catch {
      // still show thanks locally
      setRatingSaved(true);
    }
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

  // Keep art smaller so title/verse never collide with the fixed player bar
  const artSize = Math.min(scale(200), 200);

  return (
    <ImageBackground
      source={meditationCoverSource(med.id, med.cover, med.cover_file)}
      style={{ flex: 1 }}
      blurRadius={30}
    >
      <LinearGradient colors={[colors.scrim, "rgba(11,13,18,0.88)"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          {/* Fixed header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flexShrink: 0,
            }}
          >
            <BackButton
              fallback="/(tabs)/meditate"
              icon="chevron-down"
              size={30}
              color={colors.white}
              testID="med-close-btn"
              onBeforeBack={endSession}
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

          {/* Middle: scrollable session content (never underlaps player) */}
          {!showCelebration ? (
            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{
                flexGrow: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: spacing.lg,
                paddingBottom: spacing.md,
              }}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Animated.View
                style={{
                  width: artSize,
                  height: artSize,
                  borderRadius: artSize / 2,
                  overflow: "hidden",
                  marginBottom: spacing.md,
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
                  fontSize: 22,
                  color: colors.white,
                  textAlign: "center",
                  letterSpacing: -0.4,
                  paddingHorizontal: spacing.sm,
                }}
                numberOfLines={2}
              >
                {med.title}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.85)",
                  marginTop: 4,
                  textAlign: "center",
                  paddingHorizontal: spacing.md,
                }}
                numberOfLines={2}
              >
                {med.subtitle}
              </Text>

              <View
                style={{
                  marginTop: spacing.md,
                  paddingHorizontal: spacing.sm,
                  alignItems: "center",
                  maxWidth: 360,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.scripture,
                    fontSize: 16,
                    color: colors.white,
                    textAlign: "center",
                    lineHeight: 24,
                  }}
                  numberOfLines={4}
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
            </ScrollView>
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
                alignItems: "center",
                paddingBottom: spacing.sm,
                paddingHorizontal: spacing.md,
              }}
            >
              <Animated.View
                style={{
                  opacity: celebrateOpacity,
                  width: "100%",
                  maxWidth: 300,
                  marginBottom: spacing.sm,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: isDark ? "#161618" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255,255,255,0.12)" : colors.borderSoft,
                  alignItems: "center",
                  alignSelf: "center",
                  zIndex: 20,
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOpacity: 0.28,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 4 },
                    },
                    android: { elevation: 8 },
                    default: {},
                  }),
                }}
                testID="meditation-complete-banner"
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    alignSelf: "stretch",
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={isDark ? colors.premium : colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.headingBold,
                        fontSize: 16,
                        color: isDark ? colors.textPrimary : "#1A1525",
                      }}
                    >
                      Well done
                      {streak > 1 ? ` · ${streak}-day streak` : ""}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 12,
                        color: isDark ? colors.textMuted : "#8E8799",
                        marginTop: 2,
                      }}
                    >
                      {ratingSaved
                        ? "Thanks for the rating"
                        : "How was this session?"}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    marginTop: 10,
                    width: "100%",
                    alignItems: "center",
                  }}
                  testID="meditation-rating"
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 12,
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled = star <= rating;
                      return (
                        <TouchableOpacity
                          key={star}
                          onPress={() => void submitRating(star)}
                          disabled={ratingSaved}
                          accessibilityLabel={`Rate ${star} star${star === 1 ? "" : "s"}`}
                          testID={`med-rate-${star}`}
                          hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                          style={{ padding: 2 }}
                        >
                          <Ionicons
                            name={filled ? "star" : "star-outline"}
                            size={24}
                            color={
                              filled
                                ? colors.premium
                                : isDark
                                  ? "rgba(255,255,255,0.35)"
                                  : "rgba(26,21,37,0.28)"
                            }
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Compact actions — pill fits content, not full-width bar */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    {!ratingSaved ? (
                      <TouchableOpacity
                        onPress={() => setRatingSaved(true)}
                        accessibilityLabel="Skip rating"
                        testID="med-rate-skip"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ paddingVertical: 8, paddingHorizontal: 10 }}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.body,
                            fontSize: 13,
                            color: isDark ? colors.textMuted : "#8E8799",
                          }}
                        >
                          Skip
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={exitToMeditate}
                      accessibilityRole="button"
                      accessibilityLabel="Done"
                      testID="med-back-after-rate"
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 20,
                        minHeight: 36,
                        borderRadius: 999,
                        backgroundColor: isDark ? colors.white : colors.textPrimary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.bodyBold,
                          fontSize: 13,
                          color: isDark ? "#0A0A0A" : "#FFFFFF",
                          letterSpacing: -0.1,
                        }}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </View>
          )}

          {/* Fixed player bar — always below content, never overlapped */}
          <View
            style={{
              flexShrink: 0,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.sm,
              paddingBottom: spacing.md,
              alignItems: "center",
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          >
            <View style={{ width: "100%", marginBottom: 4 }}>
              <Slider
                style={{ width: "100%", height: 32 }}
                minimumValue={0}
                maximumValue={Math.max(duration, 0.1)}
                value={Math.min(currentTime, duration || 0)}
                minimumTrackTintColor={colors.white}
                maximumTrackTintColor="rgba(255,255,255,0.25)"
                thumbTintColor={colors.white}
                disabled={!duration}
                onSlidingStart={() => {
                  setScrubbing(true);
                  setScrubTime(currentTime);
                }}
                onValueChange={(v) => setScrubTime(v)}
                onSlidingComplete={(v) => {
                  setScrubbing(false);
                  void seekTo(v);
                }}
                testID="med-seek-slider"
                accessibilityLabel="Seek position"
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 0,
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.75)", fontFamily: fonts.body, fontSize: 12 }}>
                  {formatTime(currentTime)}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontFamily: fonts.body, fontSize: 12 }}>
                  {formatTime(duration)}
                </Text>
              </View>
            </View>

            {/* Primary row: skip back · play · skip forward */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => void skipBy(-SKIP_SEC)}
                accessibilityLabel={`Skip back ${SKIP_SEC} seconds`}
                testID="med-skip-back"
                style={ctrlBtnStyle}
              >
                <Ionicons name="play-back" size={24} color={colors.white} />
                <Text style={ctrlLabelStyle(fonts)}>-{SKIP_SEC}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.white,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={togglePlay}
                testID="med-play-btn"
                accessibilityLabel={status?.playing ? "Pause" : "Play"}
              >
                <Ionicons
                  name={status?.playing ? "pause" : "play"}
                  size={32}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void skipBy(SKIP_SEC)}
                accessibilityLabel={`Skip forward ${SKIP_SEC} seconds`}
                testID="med-skip-forward"
                style={ctrlBtnStyle}
              >
                <Ionicons name="play-forward" size={24} color={colors.white} />
                <Text style={ctrlLabelStyle(fonts)}>+{SKIP_SEC}</Text>
              </TouchableOpacity>
            </View>

            {/* Secondary row: restart · stop · speed */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                marginTop: spacing.sm,
              }}
            >
              <TouchableOpacity
                onPress={() => void restart()}
                accessibilityLabel="Restart from beginning"
                testID="med-restart"
                style={ctrlBtnStyle}
              >
                <Ionicons name="refresh" size={22} color={colors.white} />
                <Text style={ctrlLabelStyle(fonts)}>Restart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={exitToMeditate}
                accessibilityLabel="Stop and end session"
                testID="med-end-session"
                style={ctrlBtnStyle}
              >
                <Ionicons name="stop" size={22} color={colors.white} />
                <Text style={ctrlLabelStyle(fonts)}>Stop</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={cycleRate}
                accessibilityLabel={`Playback speed ${RATES[rateIndex]}x`}
                testID="med-rate"
                style={ctrlBtnStyle}
              >
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 15,
                    color: colors.white,
                    minWidth: 36,
                    textAlign: "center",
                  }}
                >
                  {RATES[rateIndex]}x
                </Text>
                <Text style={ctrlLabelStyle(fonts)}>Speed</Text>
              </TouchableOpacity>
            </View>

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
