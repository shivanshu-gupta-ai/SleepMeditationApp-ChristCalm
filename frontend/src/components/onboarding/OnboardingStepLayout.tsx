import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import OnboardingProgress from "@/src/components/onboarding/OnboardingProgress";
import { TOTAL_ONBOARDING_STEPS, ONBOARDING_STEP_LABELS } from "@/src/constants/onboarding";

type Props = {
  step: number;
  onBack: () => void;
  showProgress?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
};

export function useObStyles() {
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        heroRing: {
          padding: 6,
          borderRadius: 120,
          backgroundColor: isDark ? colors.surface : colors.cardGlass,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          marginBottom: spacing.lg,
          ...shadows.soft,
        },
        heroImage: { width: 180, height: 180, borderRadius: 90 },
        overline: {
          fontFamily: fonts.bodyMedium,
          fontSize: 13,
          letterSpacing: 0.2,
          color: colors.primary,
          marginBottom: spacing.sm,
          textAlign: "center",
        },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 26,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: spacing.sm,
          letterSpacing: -0.5,
          textAlign: "center",
          lineHeight: 34,
        },
        titleLeft: { textAlign: "left" },
        sub: {
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.textSecondary,
          lineHeight: 24,
          marginBottom: spacing.lg,
          textAlign: "center",
        },
        subLeft: { textAlign: "left" },
        scripture: {
          fontFamily: fonts.scripture,
          fontSize: 20,
          textAlign: "center",
          color: colors.textPrimary,
          lineHeight: 30,
          letterSpacing: -0.2,
        },
        scriptureRef: {
          fontFamily: fonts.bodyMedium,
          fontSize: 13,
          color: colors.primary,
          marginTop: spacing.sm,
          textAlign: "center",
          letterSpacing: 0.2,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.soft,
        },
        previewCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          marginTop: spacing.lg,
          ...shadows.soft,
        },
        previewTitle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 13,
          color: colors.textMuted,
          letterSpacing: 0.2,
          marginBottom: spacing.md,
        },
        previewRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginBottom: spacing.sm,
          paddingVertical: 4,
        },
        previewDay: {
          fontFamily: fonts.bodyBold,
          fontSize: 13,
          color: colors.primary,
          width: 52,
        },
        previewLabel: {
          fontFamily: fonts.body,
          fontSize: 15,
          color: colors.textPrimary,
          flex: 1,
        },
        input: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingVertical: 14,
          paddingHorizontal: spacing.md,
          fontSize: 16,
          fontFamily: fonts.body,
          color: colors.textPrimary,
          borderWidth: 1.5,
          borderColor: colors.borderSoft,
        },
        optionCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.sm,
          borderWidth: 1.5,
          borderColor: colors.borderSoft,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        optionActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primarySoft,
        },
        chip: {
          backgroundColor: colors.surface,
          borderRadius: radius.full,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderWidth: 1.5,
          borderColor: colors.borderSoft,
          marginBottom: spacing.sm,
          marginRight: spacing.sm,
        },
        chipActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primarySoft,
        },
        chipText: { fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary },
        chipTextActive: { color: colors.primary, fontFamily: fonts.bodyBold },
        cta: {
          backgroundColor: colors.primary,
          borderRadius: radius.full,
          paddingVertical: 14,
          paddingHorizontal: spacing.xl,
          minHeight: 48,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: spacing.sm,
          ...shadows.glow,
        },
        ctaDisabled: { opacity: 0.4 },
        ctaText: {
          color: colors.white,
          fontFamily: fonts.bodyBold,
          fontWeight: "700",
          fontSize: 16,
        },
        link: {
          textAlign: "center",
          fontFamily: fonts.body,
          color: colors.textSecondary,
          fontSize: 13,
          paddingVertical: 6,
        },
        center: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          justifyContent: "center",
          alignItems: "center",
        },
        content: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        },
      }),
    [colors, fonts, spacing, radius, shadows, isDark]
  );
}

export default function OnboardingStepLayout({
  step,
  onBack,
  showProgress = true,
  children,
  footer,
  scrollable = true,
}: Props) {
  const { colors, fonts, spacing, radius, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        gradient: { flex: 1 },
        safe: { flex: 1 },
        topBar: {
          paddingHorizontal: spacing.md,
          paddingTop: 4,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        },
        backBtn: {
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.borderSoft,
        },
        stepLabel: {
          textAlign: "center",
          fontFamily: fonts.body,
          fontSize: 11,
          color: colors.textMuted,
          marginTop: 6,
          marginBottom: 2,
          letterSpacing: 0.1,
        },
        scroll: { flexGrow: 1, paddingBottom: spacing.sm },
        footer: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          gap: 6,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderSoft,
          backgroundColor: isDark ? colors.backgroundElevated : colors.background,
        },
      }),
    [colors, fonts, spacing, radius, isDark]
  );

  const body = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.scroll}>{children}</View>
  );

  return (
    <LinearGradient colors={colors.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} testID="onboarding-back">
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            {showProgress ? (
              <OnboardingProgress step={step} total={TOTAL_ONBOARDING_STEPS} />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
          {showProgress && step > 0 ? (
            <Text style={styles.stepLabel}>
              Step {step + 1} of {TOTAL_ONBOARDING_STEPS} · {ONBOARDING_STEP_LABELS[step]}
            </Text>
          ) : null}
          {body}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
