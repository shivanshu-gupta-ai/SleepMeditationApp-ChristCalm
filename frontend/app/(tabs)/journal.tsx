import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, radius, shadows } from "@/src/theme";
import { api } from "@/src/api/client";

type Entry = { id: string; mood?: string; content: string; created_at: string };
const MOODS = ["😊 Grateful", "😔 Sad", "😰 Anxious", "😌 Peaceful", "😤 Overwhelmed", "🙏 Hopeful"];

export default function Journal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.listJournal();
      setEntries(r.entries || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await api.createJournal(content.trim(), mood || undefined);
      setContent("");
      setMood(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.sub}>Cast your cares. He cares for you.</Text>

          {/* Composer */}
          <View style={styles.composer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodRow}
            >
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.moodChip, mood === m && styles.moodChipActive]}
                  onPress={() => setMood(mood === m ? null : m)}
                  testID={`mood-chip-${m}`}
                >
                  <Text style={[styles.moodText, mood === m && styles.moodTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.textArea}
              placeholder="What is on your heart today?"
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              testID="journal-content-input"
            />

            <TouchableOpacity
              style={[styles.saveBtn, (!content.trim() || saving) && styles.saveBtnDisabled]}
              onPress={save}
              disabled={!content.trim() || saving}
              testID="journal-save-btn"
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                  <Text style={styles.saveBtnText}>Save Entry</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Past Entries</Text>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
          ) : entries.length === 0 ? (
            <Text style={styles.empty}>No entries yet. Start your journey above.</Text>
          ) : (
            entries.map((e) => (
              <View key={e.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  {e.mood && <Text style={styles.entryMood}>{e.mood}</Text>}
                  <Text style={styles.entryDate}>
                    {new Date(e.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Text style={styles.entryContent}>{e.content}</Text>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  composer: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
  },
  moodRow: { gap: 8, paddingRight: spacing.md },
  moodChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    flexShrink: 0,
  },
  moodChipActive: { backgroundColor: colors.primary },
  moodText: { fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary },
  moodTextActive: { color: colors.white, fontFamily: fonts.bodyBold },
  textArea: {
    marginTop: spacing.md,
    minHeight: 120,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  saveBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 15 },
  sectionTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  empty: { textAlign: "center", color: colors.textSecondary, fontFamily: fonts.body, marginTop: 20 },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  entryMood: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary },
  entryDate: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  entryContent: { fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
});
