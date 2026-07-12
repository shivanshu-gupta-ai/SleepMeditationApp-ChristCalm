import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
  const { width, pagePadding, isCompact, isTablet, bottomClearance, columns } = useResponsive();
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

  // 2 cols phone · 3 iPad · 4 wide iPad — Nest roomy gaps
  const cols = columns({ phone: 2, tablet: 3, tabletWide: 4 });
  const gap = isCompact ? 12 : isTablet ? 16 : 14;
  // Screen already pads; width is content column — subtract pad for card math
  const contentW = Math.max(width - pagePadding * 2, 0);
  const cardW = contentW > 0 ? (contentW - gap * (cols - 1)) / cols : 0;

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
      contentStyle={{
        paddingTop: isCompact ? 12 : layout.pageTop,
        paddingBottom: bottomClearance,
      }}
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

      {/* Emotion grid — Nest: sparse labels, borderless cards, roomy cells */}
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
          How are you feeling?
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: isTablet ? 16 : 14,
            lineHeight: isTablet ? 24 : 20,
            color: colors.textMuted,
            marginBottom: spacing.lg,
            maxWidth: isTablet ? 480 : 320,
          }}
        >
          Choose a feeling for a guided session
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
                    minHeight: isCompact ? 76 : isTablet ? 96 : 84,
                    borderRadius: layout.surfaceRadius,
                    backgroundColor: colors.surface,
                    // Nest: no borders — pure elevated fill
                    borderWidth: isDark ? 0 : 1,
                    borderColor: isDark ? "transparent" : colors.borderSoft,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
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
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontFamily: fonts.headingBold,
                      fontSize: 16,
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
        Quick paths —
        Dark Nest: quiet charcoal wells + gold/violet icon accents
        Light Cooper: soft pastel tiles + one ink contrast tile
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
          Quick paths
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
                sub: "Sessions",
                icon: "leaf-outline" as const,
                bg: isDark ? colors.surface : colors.tileA,
                color: colors.primary,
                inverted: false,
                onPress: () => router.push("/(tabs)/meditate"),
                testID: "home-tile-meditate",
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
              },
              {
                id: "journal",
                title: "Journal",
                sub: "Write freely",
                icon: "create-outline" as const,
                bg: isDark ? colors.surface : colors.tileC,
                color: isDark ? colors.secondary : colors.premium,
                inverted: !isDark,
                onPress: () => {
                  void markFirstStep("journal");
                  router.push("/(tabs)/journal");
                },
                testID: "home-journal-btn",
              },
            ] as const
          ).map((tile) => {
            const titleColor = tile.inverted ? colors.white : colors.textPrimary;
            const subColor = tile.inverted
              ? "rgba(255,255,255,0.72)"
              : colors.textMuted;
            const iconWellBg = tile.inverted
              ? "rgba(255,255,255,0.12)"
              : isDark
                ? "rgba(255,255,255,0.06)"
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
                  borderWidth: isDark || tile.inverted ? 0 : 1,
                  borderColor: tile.inverted ? "transparent" : colors.borderSoft,
                  padding: spacing.lg,
                  justifyContent: "space-between",
                  ...(isDark ? null : shadows.soft),
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
