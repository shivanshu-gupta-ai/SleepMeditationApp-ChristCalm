import React, { useEffect, useState, useCallback } from "react";
import { View, Text } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import { usePremium } from "@/src/features/subscriptions";
import { useResponsive } from "@/src/hooks/use-responsive";
import { api } from "@/src/api/client";
import { layout } from "@/src/theme/layout";
import {
  Screen,
  LoadingState,
  ErrorState,
  GridSkeleton,
  PremiumBadge,
  PageHeader,
  Surface,
  FadeIn,
  PressableScale,
  FirstStepsChecklist,
  markFirstStep,
  JourneyStats,
} from "@/src/components/ui";
import { TodaysPath } from "@/src/components/ui/TodaysPath";
import { emotionIcon } from "@/src/constants/emotion-icons";
import { iconSize } from "@/src/theme/primitives";
import { track } from "@/src/utils/analytics";
import { storage } from "@/src/utils/storage";
import {
  getUserStage,
  stageEmotionPrompt,
  stageHomeOverline,
  type UserStage,
} from "@/src/utils/user-stage";

type Emotion = { id: string; label: string; color: string; emoji?: string };
type Devotional = { verse: string; reference: string; reflection: string };

export default function Home() {
  const router = useRouter();
  const { width, pagePadding, isCompact, isTablet, bottomClearance, columns } = useResponsive();
  const { user, refreshUser } = useAuth();
  const { isPremium } = usePremium();
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<UserStage>("new");
  const [localCompleted, setLocalCompleted] = useState(0);
  const [localStreak, setLocalStreak] = useState(0);

  const load = useCallback(async (force = false) => {
    try {
      setError(null);
      const [e, d, stageSnap] = await Promise.all([
        api.emotions(force),
        api.devotional(),
        getUserStage(),
      ]);
      setEmotions(e.emotions || []);
      setDevotional(d);
      setStage(stageSnap.stage);
      setLocalCompleted(stageSnap.completed);
      setLocalStreak(stageSnap.streak);
    } catch (err: any) {
      setError(err?.message || "Unable to load your home feed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Force refresh so new catalog feelings are not stuck in the 5‑min cache
    load(true);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
      getUserStage().then((s) => {
        setStage(s.stage);
        setLocalCompleted(s.completed);
        setLocalStreak(s.streak);
      });
    }, [refreshUser])
  );

  const overline = stageHomeOverline(stage, new Date().getHours());
  const emotionCopy = stageEmotionPrompt(stage);
  const minutes = user?.minutes_meditated ?? 0;
  const sessions = Math.max(user?.prayers_completed ?? 0, localCompleted);
  const streak = Math.max(user?.streak ?? 0, localStreak);

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

  // 2 cols phone · 3 iPad · 4 wide iPad — Nest roomy gaps
  const cols = columns({ phone: 2, tablet: 3, tabletWide: 4 });
  const gap = isCompact ? 12 : isTablet ? 16 : 14;
  // Screen already pads; width is content column — subtract pad for card math
  const contentW = Math.max(width - pagePadding * 2, 0);
  const cardW = contentW > 0 ? (contentW - gap * (cols - 1)) / cols : 0;

  if (loading && !emotions.length) {
    return (
      <Screen contentStyle={{ paddingTop: isCompact ? 12 : layout.pageTop }}>
        <LoadingState
          fullScreen={false}
          emblem="grace"
          message="Gathering calm…"
          slowMessage="Still gathering your home — connection may be slow…"
        />
        <GridSkeleton cells={6} cols={cols} />
      </Screen>
    );
  }

  if (error && !emotions.length) {
    return (
      <ErrorState
        title="Home is resting"
        message={error}
        onRetry={() => {
          setLoading(true);
          load(true);
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
        load(true);
      }}
      contentStyle={{
        paddingTop: isCompact ? 12 : layout.pageTop,
        paddingBottom: bottomClearance,
      }}
    >
      <FadeIn>
        <PageHeader
          overline={overline}
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

      {/* Stage: new → first steps; engaged → stats to optimize */}
      {stage === "new" ? <FirstStepsChecklist /> : null}
      {stage === "engaged" ? (
        <JourneyStats minutes={minutes} streak={streak} sessions={sessions} />
      ) : null}

      <TodaysPath
        emotions={emotions}
        stage={stage}
        completed={localCompleted}
        streak={streak}
      />

      {/* Emotion categories — color-coded tiles, clear hierarchy, scan in seconds */}
      <FadeIn delay={40}>
        <Text
          style={{
            fontFamily: fonts.headingBold,
            fontSize: isCompact ? 24 : isTablet ? 32 : 28,
            color: colors.textPrimary,
            letterSpacing: -0.7,
            marginBottom: 8,
          }}
        >
          {emotionCopy.title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: isTablet ? 16 : 14,
            lineHeight: isTablet ? 24 : 20,
            color: colors.textMuted,
            marginBottom: spacing.lg,
            maxWidth: isTablet ? 480 : 340,
          }}
        >
          {emotionCopy.sub}
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap,
            marginBottom: layout.sectionGap,
            width: contentW,
            alignSelf: "center",
          }}
        >
          {emotions.map((em, index) => {
            const tint = isDark ? "22" : "30";
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
                    minHeight: isCompact ? 80 : isTablet ? 100 : 88,
                    borderRadius: layout.surfaceRadius,
                    // Soft solid well from emotion color — category rhythm, not stock chaos
                    backgroundColor: isDark
                      ? colors.surface
                      : em.color + "18",
                    borderWidth: isDark ? 0 : 1,
                    borderColor: isDark ? "transparent" : em.color + "33",
                    borderLeftWidth: 4,
                    borderLeftColor: em.color,
                    paddingVertical: 16,
                    paddingHorizontal: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    ...(isDark ? null : shadows.soft),
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      backgroundColor: em.color + tint,
                      borderWidth: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Ionicons name={icon} size={iconSize.md} color={em.color} />
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      flex: 1,
                      fontFamily: fonts.headingBold,
                      fontSize: isCompact ? 14 : 15,
                      lineHeight: isCompact ? 18 : 20,
                      color: colors.textPrimary,
                      letterSpacing: -0.3,
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

      {/* Scripture — Nest sparse secondary block */}
      {devotional ? (
        <FadeIn delay={160}>
          <Text
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 13,
              letterSpacing: 0.15,
              color: colors.textMuted,
              marginBottom: spacing.md,
            }}
          >
            Today’s word
          </Text>
          <Surface
            testID="devotional-card"
            style={{ padding: spacing.xl, marginBottom: layout.sectionGap }}
          >
            <Text
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: 13,
                letterSpacing: 0.15,
                color: isDark ? colors.premium : colors.primary,
                marginBottom: spacing.md,
              }}
            >
              {devotional.reference}
            </Text>
            <Text
              style={{
                fontFamily: fonts.scripture,
                fontSize: 22,
                color: colors.textPrimary,
                lineHeight: 32,
                marginBottom: spacing.md,
                letterSpacing: -0.3,
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

      {/*
        Quick paths — fewer for new users (less overwhelm); full grid when returning+
      */}
      <FadeIn delay={200}>
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 13,
            letterSpacing: 0.15,
            color: colors.textMuted,
            marginBottom: spacing.md,
          }}
        >
          {stage === "new" ? "Start here" : "Quick paths"}
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap,
            width: contentW,
            alignSelf: "center",
            marginBottom: spacing.lg,
          }}
        >
          {(
            [
              {
                id: "meditate",
                title: "Meditate",
                sub: stage === "new" ? "Begin gently" : "Sessions",
                icon: "leaf-outline" as const,
                bg: isDark ? colors.surface : colors.tileA,
                color: colors.primary,
                inverted: false,
                onPress: () => router.push("/(tabs)/meditate"),
                testID: "home-tile-meditate",
                newOnly: false,
              },
              {
                id: "sos",
                title: "SOS",
                sub: "Breathe now",
                icon: "heart-outline" as const,
                bg: isDark ? colors.surface : colors.tileD,
                color: colors.accentSOS,
                inverted: false,
                onPress: () => {
                  void markFirstStep("sos");
                  router.push("/sos");
                },
                testID: "home-sos-btn",
                newOnly: false,
              },
              {
                id: "wisdom",
                title: "Wisdom",
                sub: "Talk it through",
                icon: "chatbubbles-outline" as const,
                bg: isDark ? colors.surface : colors.tileB,
                color: isDark ? colors.premium : colors.primaryDark,
                inverted: false,
                onPress: () => {
                  void markFirstStep("wisdom");
                  router.push("/(tabs)/wisdom");
                },
                testID: "home-tile-wisdom",
                newOnly: false,
              },
              {
                id: "journal",
                title: "Journal",
                sub: "Write freely",
                icon: "create-outline" as const,
                // Light: ink card (white on dark). Dark: elevated charcoal + gold
                // so the tile never collapses into pure black background.
                bg: isDark ? colors.surfaceAlt : colors.tileC,
                color: colors.premium,
                inverted: !isDark,
                onPress: () => {
                  void markFirstStep("journal");
                  router.push("/(tabs)/journal");
                },
                testID: "home-journal-btn",
                newOnly: false,
              },
            ] as const
          )
            .filter((tile) => stage !== "new" || !tile.newOnly)
            .map((tile) => {
            // Inverted = light-mode ink card (white type on dark fill).
            // Dark mode always uses light type on elevated charcoal — never white-on-white
            // or dark-on-dark for title/subcopy.
            const titleColor = tile.inverted ? colors.white : colors.textPrimary;
            const subColor = tile.inverted
              ? "rgba(255,255,255,0.72)"
              : colors.textSecondary;
            const iconWellBg = tile.inverted
              ? "rgba(255,255,255,0.12)"
              : isDark
                ? tile.id === "journal"
                  ? colors.premiumSoft
                  : "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.72)";
            return (
              <PressableScale
                key={tile.id}
                haptic="medium"
                onPress={tile.onPress}
                testID={tile.testID}
                style={{
                  width: cardW,
                  minHeight: isCompact ? 108 : 120,
                  borderRadius: layout.surfaceRadius,
                  backgroundColor: tile.bg,
                  // Dark: whisper border so charcoal tiles separate from pure black canvas
                  borderWidth: tile.inverted ? 0 : 1,
                  borderColor: tile.inverted
                    ? "transparent"
                    : isDark
                      ? "rgba(255,255,255,0.10)"
                      : colors.borderSoft,
                  padding: spacing.lg,
                  justifyContent: "space-between",
                  ...shadows.soft,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: iconWellBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={tile.icon} size={20} color={tile.color} />
                </View>
                <View style={{ marginTop: 16 }}>
                  <Text
                    style={{
                      fontFamily: fonts.headingBold,
                      fontSize: 17,
                      color: titleColor,
                      letterSpacing: -0.3,
                    }}
                  >
                    {tile.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 13,
                      color: subColor,
                      marginTop: 4,
                    }}
                  >
                    {tile.sub}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </View>
      </FadeIn>
    </Screen>
  );
}
