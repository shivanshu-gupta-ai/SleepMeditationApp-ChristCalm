import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, radius } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";

const CONCERNS = [
  { id: "anxiety", label: "Anxiety", icon: "🌊" },
  { id: "panic", label: "Panic Attacks", icon: "🌀" },
  { id: "stress", label: "Stress", icon: "🌪️" },
  { id: "sleep", label: "Sleep", icon: "🌙" },
  { id: "grief", label: "Grief", icon: "🕊️" },
  { id: "loneliness", label: "Loneliness", icon: "💫" },
  { id: "purpose", label: "Purpose", icon: "🌱" },
  { id: "gratitude", label: "Gratitude", icon: "🌾" },
];

const FAITH_STAGES = [
  { id: "seeking", label: "Just exploring faith" },
  { id: "new", label: "New in my walk with God" },
  { id: "growing", label: "Growing steadily" },
  { id: "deep", label: "Deeply rooted" },
];

export default function Onboarding() {
  const router = useRouter();
  const { markOnboardingComplete } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [faithStage, setFaithStage] = useState<string | null>(null);
  const [concerns, setConcerns] = useState<string[]>([]);

  const goNext = () => {
    if (step === 4) {
      markOnboardingComplete().then(() => router.replace("/(auth)/sign-up"));
      return;
    }
    setStep(step + 1);
  };

  const goBack = () => {
    if (step === 0) return;
    setStep(step - 1);
  };

  const toggleConcern = (id: string) => {
    setConcerns((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return !!faithStage;
    if (step === 3) return concerns.length > 0;
    return true;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Progress bar */}
        <View style={styles.progressWrap}>
          {step > 0 && (
            <TouchableOpacity onPress={goBack} style={styles.backBtn} testID="onboarding-back">
              <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / 5) * 100}%` }]} />
          </View>
        </View>

        <ScrollView
          key={step}
          contentContainerStyle={styles.stepContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <View style={styles.centerContent}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&q=80",
                }}
                style={styles.welcomeImage}
              />
              <Text style={styles.overline}>WELCOME TO</Text>
              <Text style={styles.appName}>ChristCalm</Text>
              <Text style={styles.tagline}>
                Peace for anxious hearts. Presence for weary souls.
              </Text>
              <Text style={styles.scripture}>
                {"\u201C"}Come to me, all you who are weary and burdened, and I will give you rest.{"\u201D"}
              </Text>
              <Text style={styles.scriptureRef}>— Matthew 11:28</Text>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>What may we call you?</Text>
              <Text style={styles.stepSub}>Your first name is enough — you{"\u2019"}re seen here.</Text>
              <TextInput
                style={styles.input}
                placeholder="Your first name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                testID="onboarding-name-input"
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Where are you in your walk?</Text>
              <Text style={styles.stepSub}>Wherever you stand, Christ meets you here.</Text>
              {FAITH_STAGES.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.optionCard, faithStage === s.id && styles.optionCardActive]}
                  onPress={() => setFaithStage(s.id)}
                  testID={`faith-option-${s.id}`}
                >
                  <Text
                    style={[styles.optionLabel, faithStage === s.id && styles.optionLabelActive]}
                  >
                    {s.label}
                  </Text>
                  {faithStage === s.id && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>What weighs on your heart?</Text>
              <Text style={styles.stepSub}>Select all that apply. We{"\u2019"}ll tailor your journey.</Text>
              <View style={styles.concernGrid}>
                {CONCERNS.map((c) => {
                  const active = concerns.includes(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.concernChip, active && styles.concernChipActive]}
                      onPress={() => toggleConcern(c.id)}
                      testID={`concern-${c.id}`}
                    >
                      <Text style={styles.concernIcon}>{c.icon}</Text>
                      <Text style={[styles.concernLabel, active && styles.concernLabelActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.centerContent}>
              <LinearGradient
                colors={["#5B9BA5", "#8FA99A"]}
                style={styles.readyBadge}
              >
                <Ionicons name="heart" size={40} color={colors.white} />
              </LinearGradient>
              <Text style={styles.stepTitle}>You{"\u2019"}re ready, {name || "friend"}.</Text>
              <Text style={styles.stepSub}>
                Create your account to begin — your emotion-based meditations, prayers, and SOS
                tools await.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, !canProceed() && styles.ctaDisabled]}
            onPress={goNext}
            disabled={!canProceed()}
            testID="onboarding-next-btn"
          >
            <Text style={styles.ctaText}>
              {step === 4 ? "Begin My Journey" : step === 0 ? "Get Started" : "Continue"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
          {step === 0 && (
            <TouchableOpacity
              onPress={() => {
                markOnboardingComplete().then(() => router.replace("/(auth)/sign-in"));
              }}
              testID="onboarding-skip-signin"
            >
              <Text style={styles.signInLink}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  progressWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.borderSoft,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.primary },
  backBtn: { padding: spacing.xs },
  stepContainer: { flexGrow: 1, minHeight: 500 },
  stepContent: { padding: spacing.xl, paddingTop: spacing.xl },
  centerContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
    marginBottom: spacing.xl,
  },
  overline: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  appName: {
    fontFamily: fonts.headingBold,
    fontSize: 42,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 17,
    textAlign: "center",
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 26,
  },
  scripture: {
    fontFamily: fonts.scriptureItalic,
    fontStyle: "italic",
    fontSize: 20,
    textAlign: "center",
    color: colors.textPrimary,
    lineHeight: 30,
  },
  scriptureRef: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  stepTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 30,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  stepSub: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    fontSize: 18,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: "#EEF6F7",
  },
  optionLabel: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  optionLabelActive: { fontWeight: "700", color: colors.primary },
  concernGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  concernChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minWidth: "45%",
    flexGrow: 1,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
  },
  concernChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#EEF6F7",
  },
  concernIcon: { fontSize: 28, marginBottom: 6 },
  concernLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary },
  concernLabelActive: { color: colors.primary, fontWeight: "700" },
  readyBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: colors.white, fontWeight: "700", fontSize: 17 },
  signInLink: {
    textAlign: "center",
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
