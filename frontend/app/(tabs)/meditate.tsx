import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, FlatList, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { useResponsive } from "@/src/hooks/use-responsive";
import { api } from "@/src/api/client";
import { layout } from "@/src/theme/layout";
import {
  Screen,
  LoadingState,
  ErrorState,
  EmptyState,
  PremiumTag,
  PageHeader,
  EmotionFilter,
  PressableScale,
  FadeIn,
} from "@/src/components/ui";
import { emotionIcon } from "@/src/constants/emotion-icons";
import { meditationCoverSource } from "@/src/constants/meditation-covers";
import { track } from "@/src/utils/analytics";
import { storage } from "@/src/utils/storage";

type Emotion = { id: string; label: string; color: string; emoji?: string };
type Meditation = {
  id: string;
  emotion: string;
  title: string;
  subtitle: string;
  duration_min: number;
  cover?: string;
  cover_file?: string;
  scripture: string;
  verse: string;
  premium: boolean;
};

export default function Meditate() {
  const router = useRouter();
  const params = useLocalSearchParams<{ emotion?: string }>();
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();
  const { pagePadding, bottomClearance, isCompact } = useResponsive();
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [meds, setMeds] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .emotions()
      .then((e) => setEmotions(e.emotions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (params.emotion && typeof params.emotion === "string") {
      setSelected(params.emotion);
      void storage.setItem("cc_last_emotion", params.emotion);
      void track("meditate_open", { emotion: params.emotion, from: "home" });
    } else {
      void track("meditate_open", { from: "tab" });
    }
  }, [params.emotion]);

  const loadMeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.meditations(selected || undefined);
      setMeds(r.meditations || []);
    } catch (err: any) {
      setError(err?.message || "Could not load meditations.");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    loadMeds();
  }, [loadMeds]);

  const activeEmotion = useMemo(
    () => emotions.find((e) => e.id === selected) || null,
    [emotions, selected]
  );

  const headerTitle = activeEmotion ? activeEmotion.label : "Meditations";
  const headerSubtitle = activeEmotion
    ? "Same feeling you chose on Home — Scripture-guided rest for this moment."
    : "Scripture-guided calm for every emotion. Filter to find your moment.";

  const onSelectEmotion = (id: string | null) => {
    setSelected(id);
    if (id) {
      void storage.setItem("cc_last_emotion", id);
      void track("emotion_selected", { emotion: id, surface: "meditate_filter" });
    }
  };

  return (
    <Screen
      edges={["top"]}
      // Avoid clipping horizontal emotion row (overflow hidden on constrained parents)
      contentStyle={{ paddingTop: layout.pageTop, flex: 1, overflow: "visible" }}
      style={{ overflow: "visible" }}
    >
      <FadeIn>
        <PageHeader
          overline="Emotion · Scripture · Rest"
          title={headerTitle}
          subtitle={headerSubtitle}
        />
      </FadeIn>

      {/* Full-bleed filter row so first/last chips aren't cut by page padding */}
      <View
        style={{
          marginHorizontal: -pagePadding,
          overflow: "visible",
          zIndex: 2,
        }}
      >
        <EmotionFilter
          emotions={emotions}
          selected={selected}
          onSelect={onSelectEmotion}
          contentPadding={pagePadding}
        />
      </View>

      {activeEmotion ? (
        <FadeIn key={activeEmotion.id} delay={40}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              marginBottom: spacing.md,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: radius.lg,
              alignSelf: "stretch",
              backgroundColor: activeEmotion.color + (isDark ? "22" : "28"),
              borderWidth: 1.5,
              borderColor: activeEmotion.color + "55",
              // Continuity bar — same accent language as Home emotion tiles
              borderLeftWidth: 4,
              borderLeftColor: activeEmotion.color,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: activeEmotion.color + (isDark ? "33" : "40"),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={emotionIcon(activeEmotion.id)}
                size={18}
                color={activeEmotion.color}
              />
            </View>
            <View style={{ flex: 1, minWidth: 120 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary }}>
                From Home · Showing
              </Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textPrimary }}>
                {activeEmotion.label}
              </Text>
            </View>
            <PressableScale
              onPress={() => onSelectEmotion(null)}
              scaleTo={0.95}
              haptic="light"
              accessibilityLabel="Clear emotion filter"
              hitSlop={8}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary }}>
                Clear
              </Text>
            </PressableScale>
          </View>
        </FadeIn>
      ) : null}

      {loading ? (
        <LoadingState fullScreen={false} message="Loading sessions…" />
      ) : error ? (
        <ErrorState fullScreen={false} message={error} onRetry={loadMeds} />
      ) : (
        <FlatList
          data={meds}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: bottomClearance,
            gap: isCompact ? 10 : layout.listGap,
            flexGrow: 1,
          }}
          renderItem={({ item, index }) => (
            <FadeIn delay={Math.min(index * 35, 180)}>
              <PressableScale
                scaleTo={0.985}
                onPress={() =>
                  router.push({ pathname: "/meditation/[id]", params: { id: item.id } })
                }
                testID={`meditation-card-${item.id}`}
                accessibilityLabel={`${item.title}, ${item.duration_min} minutes${item.premium ? ", premium" : ""}`}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: layout.surfaceRadius + 2,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.borderSoft,
                  ...shadows.soft,
                }}
              >
                {/* Hero cover — travel-board language */}
                <View style={{ height: isCompact ? 148 : 168, position: "relative" }}>
                  <Image
                    source={meditationCoverSource(item.id, item.cover)}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={[
                      "transparent",
                      isDark ? "rgba(10,12,16,0.88)" : "rgba(20,28,36,0.55)",
                    ]}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 88,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: 14,
                      right: 14,
                      bottom: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 999,
                      }}
                    >
                      <Ionicons name="time-outline" size={12} color="#fff" />
                      <Text style={{ color: "#fff", fontFamily: fonts.bodyBold, fontSize: 12 }}>
                        {item.duration_min} min
                      </Text>
                    </View>
                    {item.premium ? <PremiumTag /> : null}
                  </View>
                </View>
                {/* Soft meta sheet under image */}
                <View
                  style={{
                    padding: layout.cardPad,
                    backgroundColor: isDark ? colors.surface : colors.white,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.bodyMedium,
                      fontSize: 13,
                      letterSpacing: 0.2,
                      color: colors.primary,
                      marginBottom: 6,
                    }}
                  >
                    {item.scripture}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.headingBold,
                      fontSize: isCompact ? 17 : 18,
                      color: colors.textPrimary,
                      letterSpacing: -0.3,
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 14,
                      color: colors.textSecondary,
                      lineHeight: 20,
                    }}
                    numberOfLines={2}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </PressableScale>
            </FadeIn>
          )}
          ListEmptyComponent={
            <EmptyState
              withGrace
              title="Grace is resting here"
              message="No sessions for this feeling yet. Try another emotion — or clear the filter to see everything."
              actionLabel="Show all sessions"
              onAction={() => setSelected(null)}
            />
          }
        />
      )}
    </Screen>
  );
}
