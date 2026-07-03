import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, spacing, radius, shadows } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";

type Emotion = { id: string; label: string; color: string; emoji: string };
type Devotional = { verse: string; reference: string; reflection: string };

export default function Home() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, d] = await Promise.all([api.emotions(), api.devotional()]);
      setEmotions(e.emotions || []);
      setDevotional(d);
    } catch (err) {
      console.warn(err);
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

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

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
      // silent
    }
    router.push({ pathname: "/(tabs)/meditate", params: { emotion: em.id } });
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingSmall}>{greeting()},</Text>
            <Text style={styles.greetingName} testID="home-greeting">
              {user?.name || "friend"}
            </Text>
          </View>
          {user?.is_premium ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color={colors.premium} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => router.push("/paywall")}
              testID="home-upgrade-btn"
            >
              <Ionicons name="star-outline" size={16} color={colors.premium} />
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SOS Panic Button */}
        <TouchableOpacity
          style={styles.sosCard}
          onPress={() => router.push("/sos")}
          testID="home-sos-btn"
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.accentSOS, colors.accentSOSDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sosGradient}
          >
            <View style={styles.sosIconWrap}>
              <Ionicons name="heart" size={28} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sosTitle}>I need help now</Text>
              <Text style={styles.sosSub}>
                One-tap breathing & scripture for panic moments
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* How are you feeling */}
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <Text style={styles.sectionSub}>We'll tailor scripture-guided meditation for you.</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.emotionsRow}
        >
          {emotions.map((em) => (
            <TouchableOpacity
              key={em.id}
              style={[styles.emotionChip, { backgroundColor: em.color + "33" }]}
              onPress={() => selectEmotion(em)}
              testID={`emotion-chip-${em.id}`}
            >
              <Text style={styles.emotionEmoji}>{em.emoji}</Text>
              <Text style={styles.emotionLabel}>{em.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Daily Devotional */}
        <Text style={styles.sectionTitle}>Today's Devotional</Text>
        {devotional && (
          <View style={styles.devotionalCard} testID="devotional-card">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80",
              }}
              style={styles.devotionalImage}
            />
            <View style={styles.devotionalContent}>
              <Text style={styles.devotionalRef}>{devotional.reference}</Text>
              <Text style={styles.devotionalVerse}>“{devotional.verse}”</Text>
              <Text style={styles.devotionalReflection}>{devotional.reflection}</Text>
            </View>
          </View>
        )}

        {/* AI Prayer CTA */}
        <TouchableOpacity
          style={styles.aiPrayerCard}
          onPress={() => router.push("/ai-prayer")}
          testID="home-ai-prayer-btn"
        >
          <View style={styles.aiIconWrap}>
            <Ionicons name="sparkles" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiPrayerTitle}>Personal Prayer</Text>
            <Text style={styles.aiPrayerSub}>Tell us how you feel — receive a scripture prayer</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingWrap: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  greetingSmall: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  greetingName: {
    fontFamily: fonts.headingBold,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FDF7E4",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#F0DFA0",
  },
  upgradeBtnText: { color: colors.premiumDark, fontFamily: fonts.bodyBold, fontSize: 13 },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.premium,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
  },
  premiumBadgeText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 12 },
  sosCard: { borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.xl, ...shadows.medium },
  sosGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  sosIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  sosTitle: { color: colors.white, fontFamily: fonts.headingBold, fontSize: 20 },
  sosSub: { color: "rgba(255,255,255,0.9)", fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
  sectionTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  emotionsRow: { paddingVertical: 8, paddingRight: spacing.lg, gap: spacing.sm },
  emotionChip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    flexShrink: 0,
  },
  emotionEmoji: { fontSize: 18 },
  emotionLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textPrimary },
  devotionalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
  },
  devotionalImage: { width: "100%", height: 140 },
  devotionalContent: { padding: spacing.lg },
  devotionalRef: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.primary,
    marginBottom: 8,
  },
  devotionalVerse: {
    fontFamily: fonts.scriptureItalic,
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  devotionalReflection: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  aiPrayerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF6F7",
    justifyContent: "center",
    alignItems: "center",
  },
  aiPrayerTitle: { fontFamily: fonts.headingBold, fontSize: 17, color: colors.textPrimary },
  aiPrayerSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
