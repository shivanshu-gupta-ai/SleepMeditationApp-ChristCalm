import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
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
import { useFocusEffect } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { useResponsive } from "@/src/hooks/use-responsive";
import { api } from "@/src/api/client";
import { layout } from "@/src/theme/layout";
import { ErrorBanner, PressableScale, FadeIn } from "@/src/components/ui";
import { markFirstStep } from "@/src/components/ui/FirstStepsChecklist";
import { ListeningWave } from "@/src/components/ui/ListeningWave";
import { playHaptic } from "@/src/utils/haptics";
import { track } from "@/src/utils/analytics";
import { storage } from "@/src/utils/storage";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

/** Short prompt chips — only shown before the first real reply */
const STARTERS = ["Anxious", "Grieving", "Ashamed", "Angry", "Doubt"];

const STARTER_PROMPTS: Record<string, string> = {
  Anxious: "I feel anxious and can't rest",
  Grieving: "I'm grieving and feel alone",
  Ashamed: "I keep failing and feel ashamed",
  Angry: "I'm angry at someone I love",
  Doubt: "I doubt God is near",
};

const WELCOME =
  "What's on your heart? Type or speak — spiritual concerns only.";

const WELCOME_NEW = "New chat. Share what's weighing on you.";

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
  const { colors, fonts, spacing, shadows, isDark } = useTheme();
  const { pagePadding, bottomClearance, contentMaxWidth, isTablet } = useResponsive();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
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

  const refreshQuota = useCallback(() => {
    api
      .wisdomQuota()
      .then((q) => setQuota({ used: q.used, limit: q.limit, remaining: q.remaining }))
      .catch(() => {
        // Keep last known quota if fetch fails
      });
  }, []);

  // On focus: refresh quota + pull journal "Share with Wisdom" draft into the query bar
  useFocusEffect(
    useCallback(() => {
      refreshQuota();
      let cancelled = false;
      storage.getItem<string>("cc_wisdom_draft", "").then((draft) => {
        if (cancelled || !draft?.trim()) return;
        setInput(draft.trim());
        void storage.removeItem("cc_wisdom_draft");
      });
      return () => {
        cancelled = true;
      };
    }, [refreshQuota])
  );

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
        setError("Monthly limit reached. Resets next month.");
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
    setMessages([{ id: "welcome", role: "assistant", content: WELCOME_NEW }]);
  };

  // Only show starter chips before the user has sent anything
  const showStarters =
    !isRecording &&
    !transcribing &&
    messages.length <= 1 &&
    messages.every((m) => m.role === "assistant");

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.role === "user";
    return (
      <FadeIn delay={0} offset={10} duration={220}>
        <View
          style={{
            alignSelf: mine ? "flex-end" : "flex-start",
            maxWidth: "86%",
            backgroundColor: mine ? colors.primarySoft : colors.surface,
            borderRadius: 20,
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 12,
            borderWidth: 0,
            borderColor: "transparent",
            ...(mine ? null : shadows.soft),
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 15,
              lineHeight: 22,
              color: colors.textPrimary,
            }}
          >
            {item.content}
          </Text>
        </View>
      </FadeIn>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        {/* Header — title + always-visible remaining messages */}
        <View
          style={{
            paddingHorizontal: pagePadding,
            paddingTop: layout.pageTop,
            paddingBottom: spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontFamily: fonts.headingBold,
                fontSize: isTablet ? 32 : 28,
                letterSpacing: -0.6,
                color: colors.textPrimary,
              }}
            >
              Wisdom
            </Text>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.textMuted,
                marginTop: 2,
              }}
            >
              Scripture-rooted guidance
            </Text>
          </View>
          <PressableScale
            onPress={newChat}
            haptic="light"
            accessibilityLabel="New chat"
            testID="wisdom-new-chat"
            style={{
              minHeight: 36,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bodyBold,
                fontSize: 13,
                color: colors.textPrimary,
              }}
            >
              New
            </Text>
          </PressableScale>
        </View>

        {/* Always show how many messages are left this month */}
        <View
          testID="wisdom-quota"
          style={{
            marginHorizontal: pagePadding,
            marginBottom: spacing.sm,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: quotaExhausted ? colors.accentSOS + "55" : colors.borderSoft,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bodyBold,
                fontSize: 14,
                color: quotaExhausted
                  ? colors.accentSOS
                  : quota
                    ? colors.textPrimary
                    : colors.textMuted,
              }}
            >
              {quotaExhausted
                ? "No messages left this month"
                : quota
                  ? `${quota.remaining} message${quota.remaining === 1 ? "" : "s"} left`
                  : "Checking messages…"}
            </Text>
            {quota ? (
              <Text
                style={{
                  fontFamily: fonts.bodyMedium,
                  fontSize: 13,
                  color: colors.textMuted,
                }}
              >
                {quota.used}/{quota.limit}
              </Text>
            ) : null}
          </View>
          <View
            style={{
              height: 5,
              borderRadius: 3,
              backgroundColor: colors.surfaceAlt,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: quota
                  ? `${Math.min(100, (quota.used / Math.max(1, quota.limit)) * 100)}%`
                  : "0%",
                borderRadius: 3,
                backgroundColor: quotaExhausted
                  ? colors.accentSOS
                  : quota && quota.remaining <= 15
                    ? colors.premium
                    : colors.primary,
              }}
            />
          </View>
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
            paddingTop: 4,
            flexGrow: 1,
          }}
          ListFooterComponent={
            loading ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginVertical: 6,
                }}
              >
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textMuted, fontFamily: fonts.body, fontSize: 13 }}>
                  Reflecting…
                </Text>
              </View>
            ) : null
          }
        />

        {/*
          Sticky composer — must clear the floating tab bar fully.
          Do NOT subtract from bottomClearance (that caused overlap with nav).
        */}
        <View
          style={{
            paddingHorizontal: pagePadding,
            paddingBottom: bottomClearance,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.borderSoft,
            paddingTop: 10,
            backgroundColor: colors.background,
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {error ? (
            <View style={{ marginBottom: 8 }}>
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </View>
          ) : null}

          {/* Single listening strip — avoid double “Listening” chrome */}
          {isRecording ? (
            <View
              style={{
                marginBottom: 8,
                borderRadius: 16,
                backgroundColor: colors.primarySoft,
                borderWidth: 1,
                borderColor: colors.primary + "44",
                overflow: "hidden",
              }}
              testID="wisdom-listening-panel"
            >
              <ListeningWave active label="Listening" compact />
            </View>
          ) : null}

          {transcribing && !isRecording ? (
            <View
              style={{
                marginBottom: 8,
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSoft,
                overflow: "hidden",
              }}
              testID="wisdom-transcribing-panel"
            >
              <ListeningWave active label="Transcribing…" compact />
            </View>
          ) : null}

          {/* Compact starter chips — only on empty chat */}
          {showStarters ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 8,
              }}
            >
              {STARTERS.map((label) => (
                <PressableScale
                  key={label}
                  scaleTo={0.97}
                  haptic="light"
                  onPress={() => send(STARTER_PROMPTS[label] ?? label)}
                  disabled={loading}
                  style={{
                    height: 32,
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
                      fontFamily: fonts.bodyMedium,
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </PressableScale>
              ))}
            </View>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 8,
              backgroundColor: colors.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isRecording
                ? colors.primary
                : transcribing
                  ? colors.primary + "66"
                  : colors.borderSoft,
              padding: 6,
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
                      backgroundColor: colors.primary,
                    },
                    pulseStyle,
                  ]}
                />
              ) : null}
              <PressableScale
                onPress={onMicPress}
                disabled={loading || transcribing}
                haptic="none"
                accessibilityLabel={isRecording ? "Stop recording" : "Record voice"}
                testID="wisdom-mic"
                hitSlop={6}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isRecording ? colors.primary : colors.primarySoft,
                }}
              >
                <Animated.View style={micAnimStyle}>
                  <Ionicons
                    name={isRecording ? "stop" : "mic"}
                    size={20}
                    color={isRecording ? colors.textOnPrimary : colors.primary}
                  />
                </Animated.View>
              </PressableScale>
            </View>

            {isRecording ? (
              <View
                style={{
                  flex: 1,
                  minHeight: 44,
                  justifyContent: "center",
                  paddingHorizontal: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bodyMedium,
                    fontSize: 14,
                    color: colors.primary,
                  }}
                >
                  Tap stop when done
                </Text>
              </View>
            ) : (
              <TextInput
                style={{
                  flex: 1,
                  minHeight: 40,
                  maxHeight: 100,
                  paddingHorizontal: 8,
                  paddingVertical: 10,
                  fontFamily: fonts.body,
                  fontSize: 15,
                  color: colors.textPrimary,
                }}
                placeholder={transcribing ? "Almost there…" : "Share a concern…"}
                placeholderTextColor={colors.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
                editable={!loading && !transcribing}
                testID="wisdom-input"
              />
            )}
            {/* Icon-only send — arrow; spring scale via PressableScale */}
            <PressableScale
              onPress={() => send()}
              disabled={
                loading ||
                !input.trim() ||
                transcribing ||
                isRecording ||
                quotaExhausted
              }
              haptic="medium"
              scaleTo={0.88}
              accessibilityLabel={sendFlash ? "Sent" : "Send"}
              accessibilityRole="button"
              testID="wisdom-send"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  !input.trim() || transcribing || isRecording || quotaExhausted
                    ? colors.surfaceAlt
                    : isDark
                      ? colors.white
                      : colors.textPrimary,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#0A0A0A" : colors.white}
                />
              ) : (
                <Ionicons
                  name={sendFlash ? "checkmark" : "arrow-up"}
                  size={22}
                  color={
                    !input.trim() || transcribing || isRecording || quotaExhausted
                      ? colors.textMuted
                      : isDark
                        ? "#0A0A0A"
                        : colors.white
                  }
                />
              )}
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
