import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, radius, shadows } from "@/src/theme";
import { api } from "@/src/api/client";

type Emotion = { id: string; label: string; color: string; emoji: string };
type Meditation = {
  id: string;
  emotion: string;
  title: string;
  subtitle: string;
  duration_min: number;
  cover: string;
  scripture: string;
  verse: string;
  premium: boolean;
};

export default function Meditate() {
  const router = useRouter();
  const params = useLocalSearchParams<{ emotion?: string }>();
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [meds, setMeds] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmotions = useCallback(async () => {
    const e = await api.emotions();
    setEmotions(e.emotions || []);
  }, []);

  useEffect(() => {
    loadEmotions();
  }, [loadEmotions]);

  useEffect(() => {
    if (params.emotion && typeof params.emotion === "string") {
      setSelected(params.emotion);
    }
  }, [params.emotion]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await api.meditations(selected || undefined);
        setMeds(r.meditations || []);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [selected]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Meditations</Text>
        <Text style={styles.sub}>Scripture-guided calm for every emotion.</Text>
      </View>

      <View style={styles.chipRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <TouchableOpacity
            style={[styles.chip, !selected && styles.chipActive]}
            onPress={() => setSelected(null)}
            testID="meditate-chip-all"
          >
            <Text style={[styles.chipText, !selected && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {emotions.map((em) => (
            <TouchableOpacity
              key={em.id}
              style={[
                styles.chip,
                selected === em.id && styles.chipActive,
                { borderColor: selected === em.id ? em.color : colors.borderSoft },
              ]}
              onPress={() => setSelected(em.id)}
              testID={`meditate-chip-${em.id}`}
            >
              <Text style={styles.chipEmoji}>{em.emoji}</Text>
              <Text style={[styles.chipText, selected === em.id && styles.chipTextActive]}>
                {em.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={meds}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({ pathname: "/meditation/[id]", params: { id: item.id } })
              }
              testID={`meditation-card-${item.id}`}
            >
              <Image source={{ uri: item.cover }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardScripture}>{item.scripture}</Text>
                  {item.premium && (
                    <View style={styles.premiumTag}>
                      <Ionicons name="star" size={11} color={colors.premium} />
                      <Text style={styles.premiumTagText}>Premium</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.cardMetaText}>{item.duration_min} min</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No meditations found for this emotion.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: 4 },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  chipRowWrap: { height: 60 },
  chipRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    height: 40,
    flexShrink: 0,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipActive: { backgroundColor: "#EEF6F7", borderColor: colors.primary },
  chipEmoji: { fontSize: 15 },
  chipText: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 14 },
  chipTextActive: { fontFamily: fonts.bodyBold, color: colors.primary },
  list: { padding: spacing.lg, paddingTop: 8, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  cardImage: { width: "100%", height: 130 },
  cardContent: { padding: spacing.lg },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardScripture: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.primary,
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
  premiumTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.premiumDark,
  },
  cardTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 19,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSub: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginBottom: 10 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  empty: {
    textAlign: "center",
    marginTop: spacing.xl,
    color: colors.textSecondary,
    fontFamily: fonts.body,
  },
});
