import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
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
import { Button, ErrorBanner, PressableScale, PageHeader } from "@/src/components/ui";
import { markFirstStep } from "@/src/components/ui/FirstStepsChecklist";
import { playHaptic } from "@/src/utils/haptics";
import { track } from "@/src/utils/analytics";
import { storage } from "@/src/utils/storage";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTERS = [
  "I feel anxious and can't rest",
  "I'm grieving and feel alone",
  "I keep failing and feel ashamed",
  "I'm angry at someone I love",
  "I doubt God is near",
];

function mediaMetaFromUri(uri: string): { ext: string; contentType: string; format: string } {
  const lower = (uri || "").toLowerCase();
  if (lower.includes(".webm") || lower.startsWith("blob:")) {
    return { ext: "webm", contentType: "audio/webm", format: "webm" };
  }
  if (lower.includes(".wav")) {
    return { ext: "wav", contentType: "audio/wav", format: "wav" };
  }
  if (lower.includes(".mp3")) {
    return { ext: "mp3", contentType: "audio/mpeg", format: "mp3" };
  }
  return { ext: "m4a", contentType: "audio/mp4", format: "mp4" };
}

export default function WisdomTab() {
  const { colors, fonts, spacing, shadows } = useTheme();
  const { pagePadding } = useResponsive();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Share what’s on your heart — type or tap the mic to speak. I’m here for emotional and spiritual concerns only (not coding or other tasks). You have 100 Wisdom messages per month.",
    },
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [sendFlash, setSendFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number } | null>(
    null
  );
  const listRef = useRef<FlatList>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const isRecording = recorderState.isRecording;
  const quotaExhausted = quota != null && quota.remaining <= 0;

  // Recording pulse ring
  const pulse = useSharedValue(0);
  // Mic icon scale on start
  const micScale = useSharedValue(1);
  useEffect(() => {
    if (isRecording) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      micScale.value = withSpring(1.06, { damping: 12, stiffness: 200 });
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
      micScale.value = withSpring(1);
    }
  }, [isRecording, pulse, micScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.35]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0]),
  }));

  const micAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  useEffect(() => {
    api
      .wisdomQuota()
      .then((q) => setQuota({ used: q.used, limit: q.limit, remaining: q.remaining }))
      .catch(() => {});
    // Prefill from journal "Share with Wisdom"
    storage.getItem<string>("cc_wisdom_draft", "").then((draft) => {
      if (draft) {
        setInput(draft);
        void storage.removeItem("cc_wisdom_draft");
      }
    });
  }, []);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages, loading, transcribing]);

  const applyQuota = (q?: { used: number; limit: number; remaining: number } | null) => {
    if (q && typeof q.remaining === "number") {
      setQuota({ used: q.used, limit: q.limit, remaining: q.remaining });
    }
  };

  const flashSendSuccess = () => {
    setSendFlash(true);
    void playHaptic("success");
    setTimeout(() => setSendFlash(false), 900);
  };

  const send = useCallback(
    async (text?: string) => {
      const message = (text ?? input).trim();
      if (!message || loading || transcribing) return;
      if (quotaExhausted) {
        setError(
          "You've used all Wisdom messages for this month. Your allowance resets next month."
        );
        return;
      }
      setError(null);
      setInput("");
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", content: message },
      ]);
      setLoading(true);
      void markFirstStep("wisdom");
      try {
        const res = await api.wisdomChat(message, conversationId || undefined);
        if (res.conversation_id) setConversationId(res.conversation_id);
        applyQuota(res.ai_quota);
        setMessages((prev) => [
          ...prev,
          {
            id: res.message_id || `a-${Date.now()}`,
            role: "assistant",
            content: res.reply,
          },
        ]);
        if (res.blocked) {
          void track("wisdom_blocked");
        } else {
          void track("wisdom_send");
          flashSendSuccess();
        }
      } catch (e: any) {
        setError(e?.message || "Could not get wisdom right now. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, transcribing, conversationId, quotaExhausted]
  );

  const startRecording = async () => {
    if (loading || transcribing || isRecording) return;
    setError(null);
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError("Microphone permission is needed to speak your concern.");
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
      setError(e?.message || "Could not start recording. Try typing instead.");
    }
  };

  const stopAndTranscribe = async () => {
    if (!isRecording) return;
    setError(null);
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
      applyQuota(result.ai_quota);
      const text = (result.text || "").trim();
      if (!text) {
        throw new Error("No speech detected. Please try again closer to the mic.");
      }
      setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      void playHaptic("success");
      void track("wisdom_voice");
    } catch (e: any) {
      setError(e?.message || "Could not convert speech to text. Please try again.");
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
    if (transcribing || loading) return;
    if (isRecording) {
      void stopAndTranscribe();
    } else {
      void startRecording();
    }
  };

  const newChat = () => {
    setConversationId(null);
    setError(null);
    setInput("");
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "New conversation. What’s weighing on you? Type or speak — this is a safe place.",
      },
    ]);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.role === "user";
    return (
      <View
        style={{
          alignSelf: mine ? "flex-end" : "flex-start",
          maxWidth: "88%",
          backgroundColor: mine ? colors.primary : colors.surface,
          borderRadius: layout.surfaceRadius,
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginBottom: spacing.sm,
          borderWidth: mine ? 0 : 1,
          borderColor: colors.borderSoft,
          ...(mine ? null : shadows.soft),
        }}
      >
        {!mine ? (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 11,
              letterSpacing: 1.4,
              color: colors.primary,
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            Wisdom
          </Text>
        ) : null}
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            lineHeight: 23,
            color: mine ? colors.textOnPrimary : colors.textPrimary,
          }}
        >
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={{ paddingHorizontal: pagePadding, paddingTop: layout.pageTop }}>
          <PageHeader
            overline="Conversational · Scripture-rooted"
            title="Wisdom"
            subtitle="Emotional concerns only — not code or other tasks. Type or speak from the heart."
            right={
              <Button
                label="New"
                variant="secondary"
                fullWidth={false}
                onPress={newChat}
                style={{ minHeight: 40, paddingHorizontal: 14 }}
              />
            }
          />
          {quota ? (
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: quotaExhausted ? colors.accentSOS : colors.textMuted,
                marginTop: -spacing.sm,
                marginBottom: spacing.sm,
              }}
              testID="wisdom-quota"
            >
              {quotaExhausted
                ? `Monthly limit reached (${quota.used}/${quota.limit})`
                : `${quota.remaining} of ${quota.limit} messages left this month`}
            </Text>
          ) : null}
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: pagePadding,
            paddingBottom: spacing.md,
            flexGrow: 1,
          }}
          ListFooterComponent={
            loading || transcribing ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginVertical: 8,
                }}
              >
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 }}>
                  {transcribing ? "Turning your voice into text…" : "Listening with you…"}
                </Text>
              </View>
            ) : null
          }
        />

        <View
          style={{
            paddingHorizontal: pagePadding,
            paddingBottom: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.borderSoft,
            paddingTop: spacing.sm,
            backgroundColor: colors.background,
          }}
        >
          {error ? (
            <View style={{ marginBottom: spacing.sm }}>
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </View>
          ) : null}

          {isRecording ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: spacing.sm,
                paddingHorizontal: 4,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.accentSOS,
                }}
              />
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary }}>
                Listening… tap the mic when you’re done
              </Text>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: spacing.sm,
            }}
          >
            {STARTERS.map((s) => (
              <PressableScale
                key={s}
                scaleTo={0.97}
                haptic="light"
                onPress={() => send(s)}
                disabled={loading || transcribing || isRecording}
                style={{
                  height: 36,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSoft,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                  numberOfLines={1}
                >
                  {s}
                </Text>
              </PressableScale>
            ))}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 8,
              backgroundColor: colors.surface,
              borderRadius: layout.surfaceRadius,
              borderWidth: 1,
              borderColor: isRecording ? colors.accentSOS : colors.borderSoft,
              padding: 8,
            }}
          >
            <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
              {isRecording ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: "absolute",
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.accentSOS,
                    },
                    pulseStyle,
                  ]}
                />
              ) : null}
              <PressableScale
                onPress={onMicPress}
                disabled={loading || transcribing}
                haptic="none"
                accessibilityLabel={
                  isRecording
                    ? "Stop recording and convert to text"
                    : "Record voice note of your concern"
                }
                testID="wisdom-mic"
                hitSlop={6}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isRecording
                    ? colors.accentSOS
                    : transcribing
                      ? colors.surfaceAlt
                      : colors.primarySoft,
                }}
              >
                <Animated.View style={micAnimStyle}>
                  {transcribing ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Ionicons
                      name={isRecording ? "stop" : "mic"}
                      size={22}
                      color={isRecording ? colors.white : colors.primary}
                    />
                  )}
                </Animated.View>
              </PressableScale>
            </View>

            <TextInput
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 120,
                paddingHorizontal: 10,
                paddingVertical: 10,
                fontFamily: fonts.body,
                fontSize: 15,
                color: colors.textPrimary,
              }}
              placeholder={
                isRecording
                  ? "Listening…"
                  : transcribing
                    ? "Converting speech…"
                    : "What’s on your heart?"
              }
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              editable={!loading && !transcribing && !isRecording}
              testID="wisdom-input"
            />
            <Button
              label={sendFlash ? "Sent" : "Send"}
              icon={sendFlash ? "checkmark" : "send"}
              onPress={() => send()}
              loading={loading}
              disabled={!input.trim() || transcribing || isRecording || quotaExhausted}
              fullWidth={false}
              haptic="medium"
              style={{ minHeight: 44, paddingHorizontal: 16 }}
              testID="wisdom-send"
            />
          </View>
          <Text
            style={{
              marginTop: 8,
              fontFamily: fonts.body,
              fontSize: 11,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            Heart concerns only · Speak → review text → Send · 100 AI actions / month
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
