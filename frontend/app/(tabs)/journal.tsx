import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { useResponsive } from "@/src/hooks/use-responsive";
import { api } from "@/src/api/client";
import { layout } from "@/src/theme/layout";
import { emotionIcon, type IonIconName } from "@/src/constants/emotion-icons";
import {
  Screen,
  LoadingState,
  ErrorState,
  EmptyState,
  markFirstStep,
  ErrorBanner,
  Button,
  PageHeader,
  Surface,
  PressableScale,
  FadeIn,
} from "@/src/components/ui";
import { track } from "@/src/utils/analytics";
import { storage } from "@/src/utils/storage";

type Entry = { id: string; mood?: string; content: string; created_at: string };

/** Structured moods — vector icons + stable slug testIDs (no emoji as icons). */
const MOODS: { id: string; label: string; icon: IonIconName }[] = [
  { id: "grateful", label: "Grateful", icon: emotionIcon("grateful") },
  { id: "sad", label: "Sad", icon: emotionIcon("sad") },
  { id: "anxious", label: "Anxious", icon: emotionIcon("anxious") },
  { id: "peaceful", label: "Peaceful", icon: emotionIcon("peaceful") },
  { id: "overwhelmed", label: "Overwhelmed", icon: emotionIcon("overwhelmed") },
  { id: "hopeful", label: "Hopeful", icon: emotionIcon("hopeful") },
];

export default function Journal() {
  const router = useRouter();
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();
  const { bottomClearance, isCompact } = useResponsive();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const shareWithWisdom = async (text: string) => {
    const trimmed = text.trim().slice(0, 1800);
    if (!trimmed) return;
    await storage.setItem("cc_wisdom_draft", trimmed);
    void track("journal_to_wisdom");
    router.push("/(tabs)/wisdom");
  };

  const load = useCallback(async () => {
    try {
      setError(null);
      const r = await api.listJournal();
      setEntries(r.entries || []);
    } catch (e: any) {
      setError(e?.message || "Could not load journal entries.");
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
    setSaveError(null);
    try {
      const saved = content.trim();
      await api.createJournal(saved, mood || undefined);
      void markFirstStep("journal");
      void track("journal_save", { has_mood: Boolean(mood) });
      setContent("");
      setMood(null);
      await load();
      // P1: success morph
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1200);
    } catch (e: any) {
      setSaveError(e?.message || "Could not save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      scroll
      keyboard
      contentStyle={{
        paddingTop: isCompact ? 12 : layout.pageTop,
        paddingBottom: bottomClearance,
      }}
    >
      <FadeIn>
        <PageHeader
          overline="Private · Safe"
          title="Journal"
          subtitle="Cast your cares on Him. Write freely — this space is yours."
        />
      </FadeIn>

      <FadeIn delay={40}>
        <Surface style={{ marginBottom: layout.sectionGap }}>
          <Text
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 13,
              letterSpacing: 0.2,
              color: colors.textMuted,
              marginBottom: spacing.sm,
            }}
          >
            Mood
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 16, marginBottom: spacing.md }}
          >
            {MOODS.map((m) => {
              const active = mood === m.label;
              return (
                <PressableScale
                  key={m.id}
                  scaleTo={0.97}
                  onPress={() => setMood(mood === m.label ? null : m.label)}
                  testID={`mood-chip-${m.id}`}
                  accessibilityLabel={`Mood ${m.label}${active ? ", selected" : ""}`}
                  style={{
                    minHeight: layout.filterHeight,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: active ? colors.primarySoft : colors.surfaceAlt,
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : colors.borderSoft,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name={m.icon}
                    size={16}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={{
                      fontFamily: active ? fonts.bodyBold : fonts.body,
                      fontSize: 13,
                      color: active ? colors.primary : colors.textPrimary,
                    }}
                  >
                    {m.label}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>

          <TextInput
            style={{
              minHeight: 120,
              backgroundColor: isDark ? colors.inputFill : colors.background,
              borderRadius: radius.md,
              padding: spacing.md,
              fontFamily: fonts.body,
              fontSize: 15,
              color: colors.textPrimary,
              textAlignVertical: "top",
              borderWidth: 1,
              borderColor: colors.borderSoft,
              lineHeight: 22,
            }}
            placeholder="What is on your heart today?"
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            testID="journal-content-input"
          />

          {saveError ? (
            <View style={{ marginTop: spacing.md }}>
              <ErrorBanner message={saveError} onDismiss={() => setSaveError(null)} />
            </View>
          ) : null}

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Button
              label={saveFlash ? "Saved" : "Save entry"}
              icon={saveFlash ? "checkmark-circle" : "checkmark"}
              variant={saveFlash ? "premium" : "primary"}
              onPress={save}
              loading={saving}
              disabled={!content.trim() && !saveFlash}
              testID="journal-save-btn"
            />
            <Button
              label="Share with Wisdom"
              icon="chatbubbles-outline"
              variant="secondary"
              onPress={() => shareWithWisdom(content)}
              disabled={!content.trim() || saving}
              testID="journal-to-wisdom-btn"
            />
          </View>
        </Surface>
      </FadeIn>

      <FadeIn delay={80}>
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 13,
            letterSpacing: 0.2,
            color: colors.textMuted,
            marginBottom: spacing.md,
          }}
        >
          Past entries
        </Text>

        {loading ? (
          <LoadingState fullScreen={false} message="Opening your pages…" />
        ) : error ? (
          <ErrorState
            fullScreen={false}
            message={error}
            onRetry={() => {
              setLoading(true);
              load();
            }}
          />
        ) : entries.length === 0 ? (
          <EmptyState
            withGrace
            title="Grace is listening"
            message="Nothing written yet — cast one care here. This is a safe place for whatever you're carrying."
          />
        ) : (
          entries.map((e) => (
            <Surface
              key={e.id}
              elevated={false}
              style={{
                marginBottom: layout.listGap,
                padding: spacing.md,
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
                {e.mood ? (
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary }}>
                    {e.mood}
                  </Text>
                ) : (
                  <View />
                )}
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted }}>
                  {new Date(e.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 15,
                  color: colors.textPrimary,
                  lineHeight: 22,
                }}
              >
                {e.content}
              </Text>
              <PressableScale
                haptic="light"
                onPress={() => shareWithWisdom(e.content)}
                style={{
                  marginTop: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "flex-start",
                  paddingVertical: 6,
                }}
                testID={`journal-share-wisdom-${e.id}`}
              >
                <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 13,
                    color: colors.primary,
                  }}
                >
                  Share with Wisdom
                </Text>
              </PressableScale>
            </Surface>
          ))
        )}
      </FadeIn>
    </Screen>
  );
}
