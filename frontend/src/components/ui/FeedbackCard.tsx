import React, { useState } from "react";
import { View, Text, TextInput, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { api } from "@/src/api/client";
import { track } from "@/src/utils/analytics";
import { playHaptic } from "@/src/utils/haptics";
import { Button } from "@/src/components/ui/Button";
import { Chip } from "@/src/components/ui/Chip";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { Surface } from "@/src/components/ui/Surface";
import { FadeIn } from "@/src/components/ui/FadeIn";
import { layout } from "@/src/theme/layout";

type Category = "praise" | "suggestion" | "bug" | "spiritual" | "other";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "praise", label: "Praise" },
  { id: "suggestion", label: "Idea" },
  { id: "bug", label: "Bug" },
  { id: "spiritual", label: "Spiritual" },
  { id: "other", label: "Other" },
];

/**
 * Me-tab product feedback — free-text + optional stars.
 * Stored in DynamoDB user-feedback (durable domain table).
 * Analytics only receives category/stars (never the message body).
 */
export function FeedbackCard() {
  const { colors, fonts, spacing, radius, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("suggestion");
  const [message, setMessage] = useState("");
  const [stars, setStars] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      void track("feedback_open");
      setSent(false);
      setError(null);
    }
  };

  const submit = async () => {
    const text = message.trim();
    if (text.length < 3) {
      setError("A few more words help us understand.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await api.submitFeedback({
        category,
        message: text,
        stars: stars > 0 ? stars : undefined,
        platform: Platform.OS,
      });
      // Scalar-only analytics — never send free-text into usage-events
      void track("feedback_submit", {
        category,
        stars: stars > 0 ? stars : null,
      });
      void playHaptic("success");
      setSent(true);
      setMessage("");
      setStars(0);
      setCategory("suggestion");
    } catch (e: any) {
      setError(e?.message || "Could not send feedback. Try again in a moment.");
      void playHaptic("warning");
    } finally {
      setSending(false);
    }
  };

  return (
    <Surface style={{ marginBottom: layout.sectionGap }}>
      <PressableScale
        onPress={toggle}
        haptic="light"
        testID="feedback-toggle"
        accessibilityLabel={open ? "Collapse feedback form" : "Share feedback"}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: colors.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.headingBold,
              fontSize: 16,
              color: colors.textPrimary,
              letterSpacing: -0.2,
            }}
          >
            Share feedback
          </Text>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 13,
              color: colors.textMuted,
              marginTop: 2,
            }}
          >
            Ideas, bugs, or a quiet word of thanks
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </PressableScale>

      {open ? (
        <View style={{ marginTop: spacing.lg }}>
          {sent ? (
            <FadeIn>
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: spacing.md,
                  gap: 8,
                }}
                testID="feedback-success"
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: colors.successSoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="heart" size={26} color={colors.success} />
                </View>
                <Text
                  style={{
                    fontFamily: fonts.headingBold,
                    fontSize: 17,
                    color: colors.textPrimary,
                    textAlign: "center",
                  }}
                >
                  Received with gratitude
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 20,
                  }}
                >
                  Your note helps us shape ChristCalm with care.
                </Text>
                <Button
                  label="Send another"
                  variant="secondary"
                  onPress={() => setSent(false)}
                  style={{ marginTop: spacing.sm }}
                  testID="feedback-again-btn"
                />
              </View>
            </FadeIn>
          ) : (
            <>
              <Text
                style={{
                  fontFamily: fonts.bodyMedium,
                  fontSize: 13,
                  color: colors.textMuted,
                  marginBottom: spacing.sm,
                }}
              >
                What is this about?
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: spacing.md,
                }}
              >
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.label}
                    selected={category === c.id}
                    onPress={() => setCategory(c.id)}
                    testID={`feedback-cat-${c.id}`}
                  />
                ))}
              </View>

              <Text
                style={{
                  fontFamily: fonts.bodyMedium,
                  fontSize: 13,
                  color: colors.textMuted,
                  marginBottom: spacing.sm,
                }}
              >
                Overall experience (optional)
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 6,
                  marginBottom: spacing.md,
                }}
                testID="feedback-stars"
              >
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = n <= stars;
                  return (
                    <PressableScale
                      key={n}
                      haptic="light"
                      onPress={() => setStars(n === stars ? 0 : n)}
                      accessibilityLabel={`${n} star${n === 1 ? "" : "s"}`}
                      testID={`feedback-star-${n}`}
                      style={{ padding: 4 }}
                    >
                      <Ionicons
                        name={filled ? "star" : "star-outline"}
                        size={28}
                        color={filled ? colors.premium : colors.textMuted}
                      />
                    </PressableScale>
                  );
                })}
              </View>

              <TextInput
                style={{
                  minHeight: 110,
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
                  marginBottom: spacing.sm,
                }}
                placeholder="What would you like us to know?"
                placeholderTextColor={colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={2000}
                testID="feedback-message"
              />

              {error ? (
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 13,
                    color: colors.danger,
                    marginBottom: spacing.sm,
                  }}
                  testID="feedback-error"
                >
                  {error}
                </Text>
              ) : null}

              <Button
                label="Send feedback"
                icon="send"
                onPress={submit}
                loading={sending}
                disabled={sending || message.trim().length < 3}
                testID="feedback-submit-btn"
              />
            </>
          )}
        </View>
      ) : null}
    </Surface>
  );
}
