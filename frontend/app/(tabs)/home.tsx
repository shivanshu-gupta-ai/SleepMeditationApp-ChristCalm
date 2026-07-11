import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import { usePremium } from "@/src/hooks/use-premium";
import { useResponsive } from "@/src/hooks/use-responsive";
import { api } from "@/src/api/client";
import { layout } from "@/src/theme/layout";
import {
  Screen,
  LoadingState,
  ErrorState,
  PremiumBadge,
  PageHeader,
  Surface,
  FadeIn,
  PressableScale,
  FirstStepsChecklist,
  markFirstStep,
} from "@/src/components/ui";
import { TodaysPath } from "@/src/components/ui/TodaysPath";
import { emotionIcon } from "@/src/constants/emotion-icons";
import { iconSize } from "@/src/theme/primitives";
import { track } from "@/src/utils/analytics";
import { storage } from "@/src/utils/storage";

type Emotion = { id: string; label: string; color: string; emoji?: string };
type Devotional = { verse: string; reference: string; reflection: string };

export default function Home() {
  const router = useRouter();
  const { width, pagePadding } = useResponsive();
  const { user, refreshUser } = useAuth();
  const { isPremium } = usePremium();
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [e, d] = await Promise.all([api.emotions(), api.devotional()]);
      setEmotions(e.emotions || []);
      setDevotional(d);
    } catch (err: any) {
      setError(err?.message || "Unable to load your home feed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const selectEmotion = async (em: Emotion) => {
    try {
      await api.logMood(em.id);
    } catch {
      // non-blocking
    }
    void storage.setItem("cc_last_emotion", em.id);
    void markFirstStep("emotion");
    void track("emotion_selected", { emotion: em.id });
    router.push({ pathname: "/(tabs)/meditate", params: { emotion: em.id } });
  };

  // 2 compact columns — FadeIn wrappers must own width or each tile becomes a full row
  const cols = 2;
  const gap = 10;
  const contentW = Math.max(width - pagePadding * 2, 280);
  const cardW = (contentW - gap * (cols - 1)) / cols;

  if (loading) return <LoadingState message="Gathering calm…" />;

  if (error && !emotions.length) {
    return (
      <ErrorState
        title="Home is resting"
        message={error}
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );
  }

  return (
    <Screen
      scroll
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      contentStyle={{ paddingTop: layout.pageTop, paddingBottom: layout.pageBottom }}
    >
      <FadeIn>
        <PageHeader
          overline={greeting()}
          title={user?.name || "Friend"}
          testID="home-greeting"
          right={
            <PremiumBadge
              isPremium={isPremium}
              onPressUpgrade={() => router.push("/paywall")}
              testID="home-upgrade-btn"
              compact
            />
          }
        />
      </FadeIn>

      <FirstStepsChecklist />

      <TodaysPath emotions={emotions} />

      {/* KEY: Emotion grid — same visual DNA as Meditate filters */}
      <FadeIn delay={40}>
        <Text
          style={{
            fontFamily: fonts.headingBold,
            fontSize: 22,
            color: colors.textPrimary,
            letterSpacing: -0.4,
            marginBottom: 6,
          }}
        >
          How are you feeling?
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: layout.subtitleSize,
            lineHeight: layout.subtitleLineHeight,
            color: colors.textSecondary,
            marginBottom: spacing.lg,
            maxWidth: 360,
          }}
        >
          Choose an emotion for Scripture-guided meditation — your session continues on Meditate.
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap,
            marginBottom: layout.sectionGap,
            // Keep row width stable so 2-col math holds
            width: contentW,
            alignSelf: "center",
          }}
        >
          {emotions.map((em, index) => {
            const tint = isDark ? "28" : "30";
            const icon = emotionIcon(em.id);
            return (
              <FadeIn
                key={em.id}
                delay={40 + index * 24}
                style={{ width: cardW }}
              >
                <PressableScale
                  scaleTo={0.97}
                  haptic="light"
                  onPress={() => selectEmotion(em)}
                  testID={`emotion-chip-${em.id}`}
                  accessibilityLabel={`${em.label}. Open meditations for this feeling`}
                  style={{
                    width: "100%",
                    minHeight: 64,
                    borderRadius: layout.surfaceRadius,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderSoft,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    ...shadows.soft,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: em.color + tint,
                      borderWidth: 1,
                      borderColor: em.color + "55",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Ionicons name={icon} size={iconSize.md} color={em.color} />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontFamily: fonts.headingBold,
                      fontSize: 15,
                      color: colors.textPrimary,
                      letterSpacing: -0.2,
                      paddingRight: 2,
                    }}
                  >
                    {em.label}
                  </Text>
                </PressableScale>
              </FadeIn>
            );
          })}
        </View>
      </FadeIn>

      <FadeIn delay={180}>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: layout.overlineSize,
            letterSpacing: layout.overlineTracking,
            textTransform: "uppercase",
            color: colors.textMuted,
            marginBottom: spacing.md,
          }}
        >
          More support
        </Text>

        <View style={{ gap: layout.listGap, marginBottom: layout.sectionGap }}>
          <PressableScale
            haptic="medium"
            onPress={() => {
              void markFirstStep("sos");
              router.push("/sos");
            }}
            testID="home-sos-btn"
            accessibilityLabel="Need calm now. Open SOS breathing"
            style={{ borderRadius: layout.surfaceRadius, overflow: "hidden", ...shadows.soft }}
          >
            <LinearGradient
              colors={isDark ? ["#3A2A2A", "#2A2224"] : [colors.accentSOSSoft, colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                paddingHorizontal: 18,
                gap: 14,
                borderWidth: 1,
                borderColor: isDark ? "rgba(232,160,155,0.25)" : colors.accentSOS + "33",
                borderRadius: layout.surfaceRadius,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: colors.accentSOS,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="heart" size={20} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.headingBold, fontSize: 16, color: colors.textPrimary }}>
                  Need calm now
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  4-7-8 breathing · SOS
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </LinearGradient>
          </PressableScale>

          <PressableScale
            haptic="medium"
            onPress={() => {
              void markFirstStep("wisdom");
              router.push("/(tabs)/wisdom");
            }}
            testID="home-wisdom-btn"
            accessibilityLabel="What would Jesus say? Open wisdom chat"
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderRadius: layout.surfaceRadius,
              gap: 14,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              ...shadows.soft,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 16, color: colors.textPrimary }}>
                What would Jesus say?
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                Share a concern · wisdom chat
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </PressableScale>
        </View>
      </FadeIn>

      {devotional ? (
        <FadeIn delay={260}>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: layout.overlineSize,
              letterSpacing: layout.overlineTracking,
              textTransform: "uppercase",
              color: colors.textMuted,
              marginBottom: spacing.md,
            }}
          >
            Today’s word
          </Text>
          <Surface testID="devotional-card" style={{ padding: spacing.xl }}>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                letterSpacing: 2.2,
                color: colors.primary,
                marginBottom: spacing.md,
              }}
            >
              {devotional.reference}
            </Text>
            <Text
              style={{
                fontFamily: fonts.scriptureItalic,
                fontSize: 22,
                color: colors.textPrimary,
                lineHeight: 34,
                marginBottom: spacing.lg,
              }}
            >
              “{devotional.verse}”
            </Text>
            {devotional.reflection ? (
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 15,
                  color: colors.textSecondary,
                  lineHeight: 24,
                }}
              >
                {devotional.reflection}
              </Text>
            ) : null}
          </Surface>
        </FadeIn>
      ) : null}
    </Screen>
  );
}
