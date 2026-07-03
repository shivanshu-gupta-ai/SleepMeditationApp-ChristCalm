import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, radius, shadows } from "@/src/theme";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

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
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.prayers(selected || undefined);
      setPrayers(r.prayers || []);
      if (!cats.length) setCats(r.categories || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [selected, cats.length]);

  useEffect(() => {
    load();
  }, [load]);

  const onPrayerPress = (p: Prayer) => {
    if (p.premium && !user?.is_premium) {
      router.push("/paywall");
      return;
    }
    setExpanded(expanded === p.id ? null : p.id);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Prayer Library</Text>
        <Text style={styles.sub}>Curated prayers for every moment.</Text>

        {/* AI Prayer CTA */}
        <TouchableOpacity
          style={styles.aiCta}
          onPress={() => router.push("/ai-prayer")}
          testID="prayers-ai-btn"
        >
          <View style={styles.aiCtaIcon}>
            <Ionicons name="sparkles" size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiCtaTitle}>Personal Prayer Generator</Text>
            <Text style={styles.aiCtaSub}>
              Share how you feel — receive a scripture-based prayer just for you
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.chipRowWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <TouchableOpacity
              style={[styles.chip, !selected && styles.chipActive]}
              onPress={() => setSelected(null)}
              testID="prayer-chip-all"
            >
              <Text style={[styles.chipText, !selected && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {cats.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selected === c.id && styles.chipActive]}
                onPress={() => setSelected(c.id)}
                testID={`prayer-chip-${c.id}`}
              >
                <Text style={[styles.chipText, selected === c.id && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : (
          <View style={styles.list}>
            {prayers.map((p) => {
              const isOpen = expanded === p.id;
              const locked = p.premium && !user?.is_premium;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.prayerCard}
                  onPress={() => onPrayerPress(p)}
                  testID={`prayer-card-${p.id}`}
                >
                  <View style={styles.prayerHeader}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryText}>{p.category.toUpperCase()}</Text>
                    </View>
                    {p.premium && (
                      <View style={styles.premiumTag}>
                        <Ionicons name="star" size={11} color={colors.premium} />
                        <Text style={styles.premiumTagText}>Premium</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.prayerTitle}>{p.title}</Text>
                  {isOpen && !locked ? (
                    <Text style={styles.prayerBody}>{p.body}</Text>
                  ) : (
                    <Text style={styles.prayerPreview} numberOfLines={2}>
                      {locked ? "Tap to unlock premium prayer" : p.body}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  aiCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
    ...shadows.medium,
  },
  aiCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiCtaTitle: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.white },
  aiCtaSub: { fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.9)", marginTop: 2 },
  chipRowWrap: { height: 60, marginTop: spacing.md },
  chipRow: {
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    justifyContent: "center",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: "#EEF6F7", borderColor: colors.primary },
  chipText: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 14 },
  chipTextActive: { fontFamily: fonts.bodyBold, color: colors.primary },
  list: { gap: spacing.md, marginTop: 8 },
  prayerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
  },
  prayerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: "#EEF6F7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  categoryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.5,
  },
  premiumTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FDF7E4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  premiumTagText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.premiumDark },
  prayerTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  prayerPreview: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  prayerBody: {
    fontFamily: fonts.scriptureItalic,
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 28,
  },
});
