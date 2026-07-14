import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { usePremium } from "@/src/features/subscriptions";
import { api } from "@/src/api/client";
import {
  Screen,
  LoadingState,
  ErrorState,
  EmptyState,
  Chip,
  PremiumTag,
  SectionHeader,
  PressableScale,
  FadeIn,
} from "@/src/components/ui";

type Prayer = {
  id: string;
  category: string;
  title: string;
  body: string;
  premium: boolean;
};
type Category = { id: string; label: string; cover: string };

export default function Prayers() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { colors, fonts, spacing, radius, shadows } = useTheme();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.prayers(selected || undefined);
      setPrayers(r.prayers || []);
      if (r.categories?.length) setCats(r.categories);
    } catch (e: any) {
      setError(e?.message || "Could not load prayers.");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    load();
  }, [load]);

  const onPrayerPress = (p: Prayer) => {
    if (p.premium && !isPremium) {
      router.push("/paywall");
      return;
    }
    setExpanded(expanded === p.id ? null : p.id);
  };

  return (
    <Screen scroll contentStyle={{ paddingTop: spacing.sm }}>
      <FadeIn>
        <SectionHeader
          title="Prayer Library"
          subtitle="Curated prayers for every moment."
          large
        />
      </FadeIn>

      <FadeIn delay={50}>
        <PressableScale
          onPress={() => router.push("/ai-prayer")}
          testID="prayers-ai-btn"
          style={{
            borderRadius: radius.lg,
            overflow: "hidden",
            marginBottom: spacing.lg,
            ...shadows.medium,
          }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="sparkles" size={22} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 16, color: colors.white }}>
                Personal Prayer Generator
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.9)",
                  marginTop: 2,
                }}
              >
                Share how you feel — receive a scripture-based prayer
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </LinearGradient>
        </PressableScale>
      </FadeIn>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 8, paddingRight: 8 }}
        style={{ marginBottom: spacing.md }}
      >
        <Chip
          label="All"
          selected={!selected}
          onPress={() => setSelected(null)}
          testID="prayer-chip-all"
        />
        {cats.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            selected={selected === c.id}
            onPress={() => setSelected(c.id)}
            testID={`prayer-chip-${c.id}`}
          />
        ))}
      </ScrollView>

      {loading ? (
        <LoadingState fullScreen={false} message="Opening the library…" />
      ) : error ? (
        <ErrorState fullScreen={false} message={error} onRetry={load} />
      ) : prayers.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="No prayers in this category"
          message="Try another filter or generate a personal prayer."
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {prayers.map((p) => {
            const isOpen = expanded === p.id;
            const locked = p.premium && !isPremium;
            return (
              <PressableScale
                key={p.id}
                onPress={() => onPrayerPress(p)}
                testID={`prayer-card-${p.id}`}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSoft,
                  ...shadows.soft,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: colors.primarySoft,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: radius.full,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.bodyBold,
                        fontSize: 10,
                        color: colors.primary,
                        letterSpacing: 1.5,
                      }}
                    >
                      {p.category.toUpperCase()}
                    </Text>
                  </View>
                  {p.premium ? <PremiumTag /> : null}
                </View>
                <Text
                  style={{
                    fontFamily: fonts.headingBold,
                    fontSize: 18,
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {p.title}
                </Text>
                {isOpen && !locked ? (
                  <Text
                    style={{
                      fontFamily: fonts.scriptureItalic,
                      fontSize: 17,
                      color: colors.textPrimary,
                      lineHeight: 28,
                    }}
                  >
                    {p.body}
                  </Text>
                ) : (
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 14,
                      color: colors.textSecondary,
                      lineHeight: 22,
                    }}
                    numberOfLines={2}
                  >
                    {locked ? "Tap to unlock premium prayer" : p.body}
                  </Text>
                )}
              </PressableScale>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
