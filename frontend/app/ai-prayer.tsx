import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, spacing, radius, shadows } from "@/src/theme";
import { api } from "@/src/api/client";

const QUICK_FEELINGS = [
  "Anxious",
  "Fearful",
  "Overwhelmed",
  "Grieving",
  "Grateful",
  "Lonely",
  "Doubting",
  "Weary",
];

export default function AIPrayer() {
  const router = useRouter();
  const [feeling, setFeeling] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [prayer, setPrayer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!feeling.trim()) {
      setError("Please share how you're feeling");
      return;
    }
    setError(null);
    setLoading(true);
    setPrayer(null);
    try {
      const r = await api.generatePrayer(feeling.trim(), context.trim() || undefined);
      setPrayer(r.prayer);
    } catch (e: any) {
      setError(e.message || "Prayer generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPrayer(null);
    setFeeling("");
    setContext("");
    setError(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="ai-close-btn">
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Prayer</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!prayer ? (
            <>
              <View style={styles.introRow}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.introIcon}
                >
                  <Ionicons name="sparkles" size={26} color={colors.white} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.introTitle}>Prayer, crafted for you</Text>
                  <Text style={styles.introSub}>
                    Anchored in scripture. Written for this moment.
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>How are you feeling?</Text>
              <View style={styles.quickRow}>
                {QUICK_FEELINGS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.quickChip,
                      feeling.toLowerCase() === q.toLowerCase() && styles.quickChipActive,
                    ]}
                    onPress={() => setFeeling(q)}
                    testID={`ai-quick-${q.toLowerCase()}`}
                  >
                    <Text
                      style={[
                        styles.quickText,
                        feeling.toLowerCase() === q.toLowerCase() && styles.quickTextActive,
                      ]}
                    >
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Describe your feeling"
                placeholderTextColor={colors.textMuted}
                value={feeling}
                onChangeText={setFeeling}
                testID="ai-feeling-input"
              />

              <Text style={[styles.label, { marginTop: spacing.md }]}>
                A little context (optional)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What's happening? Share as much or little as you'd like."
                placeholderTextColor={colors.textMuted}
                value={context}
                onChangeText={setContext}
                multiline
                testID="ai-context-input"
              />

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.accentSOSDark} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.cta, loading && styles.ctaDisabled]}
                onPress={generate}
                disabled={loading}
                testID="ai-generate-btn"
              >
                {loading ? (
                  <>
                    <ActivityIndicator color={colors.white} />
                    <Text style={styles.ctaText}>Praying with you...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color={colors.white} />
                    <Text style={styles.ctaText}>Generate My Prayer</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.prayerWrap} testID="ai-prayer-result">
              <View style={styles.prayerIconWrap}>
                <Ionicons name="leaf" size={22} color={colors.primary} />
              </View>
              <Text style={styles.prayerText}>{prayer}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={reset} testID="ai-new-prayer-btn">
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                  <Text style={styles.actionText}>New Prayer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                  onPress={() => router.push("/(tabs)/home")}
                  testID="ai-done-btn"
                >
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                  <Text style={[styles.actionText, { color: colors.white }]}>Amen</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  headerTitle: { fontFamily: fonts.headingBold, fontSize: 17, color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  introRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  introTitle: { fontFamily: fonts.headingBold, fontSize: 20, color: colors.textPrimary },
  introSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  quickChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickText: { fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary },
  quickTextActive: { color: colors.white, fontFamily: fonts.bodyBold },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FCEDEB",
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  errorText: { color: colors.accentSOSDark, fontFamily: fonts.body, fontSize: 13, flex: 1 },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radius.full,
    marginTop: spacing.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 16 },
  prayerWrap: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
    marginTop: spacing.lg,
  },
  prayerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF6F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  prayerText: {
    fontFamily: fonts.scriptureItalic,
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 30,
    marginBottom: spacing.xl,
  },
  actionsRow: { flexDirection: "row", gap: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
  },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary },
});
