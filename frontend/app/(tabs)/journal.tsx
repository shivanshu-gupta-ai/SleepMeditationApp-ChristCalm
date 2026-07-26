import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, TextInput, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
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
  ListSkeleton,
  SuccessInline,
  markFirstStep,
  ErrorBanner,
  Button,
  PageHeader,
  Surface,
  PressableScale,
  FadeIn,
  ListeningWave,
} from "@/src/components/ui";
import { track } from "@/src/utils/analytics";
import { storage } from "@/src/utils/storage";
import { playHaptic } from "@/src/utils/haptics";
import { mediaMetaFromUri } from "@/src/utils/voice-media";

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
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const contentRef = useRef<TextInput>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const isRecording = recorderState.isRecording;

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
      void playHaptic("success");
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1800);
    } catch (e: any) {
      void playHaptic("warning");
      setSaveError(e?.message || "Could not save entry.");
    } finally {
      setSaving(false);
    }
  };

  const startRecording = async () => {
    if (saving || transcribing || isRecording) return;
    setVoiceError(null);
    setSaveError(null);
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setVoiceError("Microphone permission is needed to speak your journal entry.");
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      void playHaptic("medium");
    } catch (e: any) {
      setVoiceError(e?.message || "Could not start recording. Try typing instead.");
    }
  };

  const stopAndTranscribe = async () => {
    if (!isRecording) return;
    setVoiceError(null);
    setTranscribing(true);
    void playHaptic("light");
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        throw new Error("Recording failed — no audio captured.");
      }

      const meta = mediaMetaFromUri(uri);
      const isWeb = Platform.OS === "web";
      const ext = isWeb ? "webm" : meta.ext;
      const contentType = isWeb ? "audio/webm" : meta.contentType;
      const format = isWeb ? "webm" : meta.format;

      const presign = await api.wisdomVoicePresign(ext, contentType);

      const audioRes = await fetch(uri);
      const blob = await audioRes.blob();
      const putRes = await fetch(presign.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: blob,
      });
      if (!putRes.ok) {
        throw new Error("Could not upload your voice note. Please try again.");
      }

      const result = await api.wisdomVoiceTranscribe(presign.s3_key, format);
      const text = (result.text || "").trim();
      if (!text) {
        throw new Error("No speech detected. Please try again closer to the mic.");
      }
      setContent((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      void playHaptic("success");
      void track("journal_voice");
      // Keep focus on the editor so the user can keep writing
      setTimeout(() => contentRef.current?.focus(), 80);
    } catch (e: any) {
      setVoiceError(e?.message || "Could not convert speech to text. Please try again.");
    } finally {
      setTranscribing(false);
      try {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      } catch {
        // ignore
      }
    }
  };

  const onMicPress = () => {
    if (transcribing || saving) return;
    if (isRecording) {
      void stopAndTranscribe();
    } else {
      void startRecording();
    }
  };

  const busy = saving || transcribing || isRecording;

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
          subtitle="Cast your cares on Him. Type or speak — this space is yours."
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

          {isRecording ? (
            <View
              style={{
                marginBottom: spacing.sm,
                borderRadius: 16,
                backgroundColor: colors.primarySoft,
                borderWidth: 1,
                borderColor: colors.primary + "44",
                overflow: "hidden",
              }}
              testID="journal-listening-panel"
            >
              <ListeningWave active label="Listening — speak freely" compact />
            </View>
          ) : null}

          {transcribing && !isRecording ? (
            <View
              style={{
                marginBottom: spacing.sm,
                borderRadius: 16,
                backgroundColor: colors.primarySoft,
                borderWidth: 1,
                borderColor: colors.primary + "44",
                overflow: "hidden",
              }}
              testID="journal-transcribing-panel"
            >
              <ListeningWave active label="Turning speech into words…" compact />
            </View>
          ) : null}

          <View
            style={{
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: isRecording
                ? colors.primary
                : transcribing
                  ? colors.primary + "66"
                  : colors.borderSoft,
              backgroundColor: isDark ? colors.inputFill : colors.background,
              overflow: "hidden",
            }}
          >
            <TextInput
              style={{
                minHeight: 120,
                padding: spacing.md,
                paddingBottom: 8,
                fontFamily: fonts.body,
                fontSize: 15,
                color: colors.textPrimary,
                textAlignVertical: "top",
                lineHeight: 22,
              }}
              ref={contentRef}
              placeholder="What is on your heart today? Type or tap the mic to speak."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              editable={!isRecording}
              testID="journal-content-input"
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: spacing.sm,
                paddingBottom: spacing.sm,
                gap: 8,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: colors.textMuted,
                  paddingLeft: spacing.xs,
                }}
              >
                {isRecording
                  ? "Tap stop when you're done speaking"
                  : transcribing
                    ? "Almost ready…"
                    : "Voice is private — only you see this entry"}
              </Text>
              <PressableScale
                onPress={onMicPress}
                disabled={saving || transcribing}
                haptic="none"
                accessibilityLabel={isRecording ? "Stop recording" : "Record journal by voice"}
                testID="journal-mic"
                hitSlop={6}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isRecording ? colors.primary : colors.primarySoft,
                  opacity: saving || transcribing ? 0.55 : 1,
                }}
              >
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={20}
                  color={isRecording ? colors.textOnPrimary : colors.primary}
                />
              </PressableScale>
            </View>
          </View>

          {voiceError ? (
            <View style={{ marginTop: spacing.md }}>
              <ErrorBanner message={voiceError} onDismiss={() => setVoiceError(null)} />
            </View>
          ) : null}
          {saveError ? (
            <View style={{ marginTop: spacing.md }}>
              <ErrorBanner message={saveError} onDismiss={() => setSaveError(null)} />
            </View>
          ) : null}
          {saveFlash ? (
            <View style={{ marginTop: spacing.md }}>
              <SuccessInline message="Saved with care" testID="journal-save-success" />
            </View>
          ) : null}

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Button
              label={saveFlash ? "Saved" : "Save entry"}
              icon={saveFlash ? "checkmark-circle" : "checkmark"}
              variant={saveFlash ? "premium" : "primary"}
              onPress={save}
              loading={saving}
              disabled={(!content.trim() && !saveFlash) || busy}
              testID="journal-save-btn"
            />
            <Button
              label="Share with Wisdom"
              icon="chatbubbles-outline"
              variant="secondary"
              onPress={() => shareWithWisdom(content)}
              disabled={!content.trim() || busy}
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
          <FadeIn>
            <LoadingState
              fullScreen={false}
              message="Opening your pages…"
              slowMessage="Still opening your journal…"
            />
            <ListSkeleton rows={3} />
          </FadeIn>
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
            message="Nothing written yet — type or speak one care here. This is a safe place for whatever you're carrying."
            actionLabel="Begin writing"
            onAction={() => contentRef.current?.focus()}
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
