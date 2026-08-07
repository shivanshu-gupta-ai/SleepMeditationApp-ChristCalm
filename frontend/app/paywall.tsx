import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "@/src/components/BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import {
  useRevenueCat,
  usePremium,
  trackPaywallView,
  trackPaywallPurchaseStart,
  trackPaywallPurchaseSuccess,
  trackPaywallPurchaseCancel,
  trackPaywallPurchaseError,
  trackPaywallRestore,
} from "@/src/features/subscriptions";
import { Screen, Button, ErrorBanner, SectionHeader } from "@/src/components/ui";

const FEATURES = [
  { icon: "leaf" as const, label: "Unlimited emotion-based meditations" },
  { icon: "chatbubbles" as const, label: "Conversational wisdom (What would Jesus say?)" },
  { icon: "book" as const, label: "Scripture-rooted guidance from our wisdom library" },
  { icon: "musical-notes" as const, label: "Guided audio sessions" },
  { icon: "heart" as const, label: "Priority SOS support" },
  { icon: "cloud-offline" as const, label: "Ad-free forever" },
];

/**
 * In-app paywall — branding shell; **checkout is RevenueCat Paywalls UI**
 * (dashboard template / default offering). No separate billing integration.
 */
export default function Paywall() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { isPremium } = usePremium();
  const {
    supported,
    purchasing,
    loadingOfferings,
    presentPaywall,
    restore,
    error: rcError,
    clearError,
    getPackage,
  } = useRevenueCat();
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const displayError = error || rcError;

  const annual = getPackage("annualFull");
  const monthly = getPackage("monthly");
  const priceHint =
    annual?.product.priceString ||
    monthly?.product.priceString ||
    (supported ? "Plans from the App Store" : "Available on iOS & Android");

  useEffect(() => {
    trackPaywallView("in_app", {
      hasOfferings: Boolean(annual || monthly),
    });
  }, [annual, monthly]);

  const leaveAfterPurchase = () => {
    router.replace("/(tabs)/home");
  };

  const onSubscribe = async () => {
    setError(null);
    clearError();
    if (!supported || Platform.OS === "web") {
      setError("Subscriptions are available in the ChristCalm iOS or Android app.");
      return;
    }
    trackPaywallPurchaseStart("in_app", "rc_ui");
    try {
      const active = await presentPaywall();
      if (active) {
        trackPaywallPurchaseSuccess("in_app", "rc_ui");
        await refreshUser();
        leaveAfterPurchase();
      } else {
        trackPaywallPurchaseCancel("in_app", "rc_ui");
      }
    } catch (e: unknown) {
      const err = e as { message?: string; userCancelled?: boolean };
      if (err?.userCancelled) {
        trackPaywallPurchaseCancel("in_app", "rc_ui");
        return;
      }
      const msg = err?.message || "Unable to open subscription options.";
      trackPaywallPurchaseError("in_app", "rc_ui", msg);
      setError(msg);
    }
  };

  const onRestore = async () => {
    setError(null);
    clearError();
    try {
      const active = await restore();
      trackPaywallRestore("in_app", active);
      if (active) {
        trackPaywallPurchaseSuccess("in_app", "restore");
        await refreshUser();
        leaveAfterPurchase();
      } else {
        setError("No active subscription found for this account.");
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      trackPaywallRestore("in_app", false);
      setError(err?.message || "Unable to restore purchases.");
    }
  };

  return (
    <Screen scroll edges={["top", "bottom"]} contentStyle={{ paddingTop: spacing.sm }}>
      <BackButton
        fallback="/(tabs)/profile"
        icon="close"
        size={26}
        style={{ alignSelf: "flex-end", padding: spacing.sm, marginBottom: spacing.sm }}
        testID="paywall-close-btn"
      />

      <LinearGradient
        colors={
          isDark
            ? [colors.surfaceAlt, colors.surface, "#1a1428"]
            : [colors.tileA, colors.backgroundElevated, colors.tileB]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: spacing.xl,
          borderRadius: radius.xl,
          alignItems: "center",
          marginBottom: spacing.xl,
          borderWidth: 1,
          borderColor: isDark ? colors.premium + "44" : colors.borderSoft,
          ...shadows.medium,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.premiumSoft,
            borderWidth: 1,
            borderColor: colors.premium + "55",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: spacing.md,
          }}
        >
          <Ionicons name="star" size={30} color={colors.premium} />
        </View>
        <Text
          style={{
            fontFamily: fonts.headingBold,
            fontSize: 26,
            color: colors.textPrimary,
            letterSpacing: -0.5,
          }}
        >
          ChristCalm Premium
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 6,
            lineHeight: 20,
          }}
        >
          Full access to every meditation, prayer, and calm tool.
        </Text>
        {!isPremium ? (
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 15,
              color: colors.textPrimary,
              marginTop: spacing.md,
            }}
            testID="paywall-price-hint"
          >
            {priceHint}
          </Text>
        ) : null}
      </LinearGradient>

      {isPremium ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.successSoft,
            padding: spacing.md,
            borderRadius: radius.md,
            marginBottom: spacing.lg,
          }}
          testID="paywall-active-banner"
        >
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={{ fontFamily: fonts.bodyBold, color: colors.success, fontSize: 14 }}>
            You&apos;re a Premium member — thank you!
          </Text>
        </View>
      ) : null}

      <SectionHeader title="What's included" />
      <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
        {FEATURES.map((f) => (
          <View
            key={f.label}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.primarySoft,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name={f.icon} size={18} color={colors.primary} />
            </View>
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.body,
                fontSize: 15,
                color: colors.textPrimary,
              }}
            >
              {f.label}
            </Text>
          </View>
        ))}
      </View>

      {!isPremium ? (
        <>
          {!supported || Platform.OS === "web" ? (
            <View
              style={{
                backgroundColor: colors.primarySoft,
                padding: spacing.md,
                borderRadius: radius.md,
                marginTop: spacing.sm,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.textSecondary,
                  lineHeight: 20,
                }}
              >
                Subscriptions are purchased through the App Store or Google Play via RevenueCat
                in the native ChristCalm app.
              </Text>
            </View>
          ) : null}

          {displayError ? (
            <View style={{ marginTop: spacing.md }}>
              <ErrorBanner
                message={displayError}
                onDismiss={() => {
                  setError(null);
                  clearError();
                }}
                testID="paywall-error"
              />
            </View>
          ) : null}

          <Button
            label={
              purchasing || loadingOfferings
                ? "Opening…"
                : supported && Platform.OS !== "web"
                  ? "Continue to subscribe"
                  : "Not available on web"
            }
            icon="arrow-forward"
            iconPosition="right"
            onPress={onSubscribe}
            loading={loadingOfferings || purchasing}
            disabled={!supported || Platform.OS === "web"}
            testID="paywall-subscribe-btn"
            style={{ marginTop: spacing.lg }}
          />

          {supported && Platform.OS !== "web" ? (
            <TouchableOpacity
              onPress={onRestore}
              disabled={purchasing}
              testID="paywall-restore-btn"
              style={{ paddingVertical: spacing.md }}
            >
              {purchasing ? (
                <ActivityIndicator color={colors.textSecondary} />
              ) : (
                <Text
                  style={{
                    textAlign: "center",
                    fontFamily: fonts.bodyBold,
                    color: colors.textSecondary,
                    fontSize: 14,
                  }}
                >
                  Restore purchases
                </Text>
              )}
            </TouchableOpacity>
          ) : null}

          <Text
            style={{
              textAlign: "center",
              fontFamily: fonts.body,
              color: colors.textMuted,
              fontSize: 13,
              marginTop: spacing.sm,
              lineHeight: 18,
            }}
            testID="paywall-hard-note"
          >
            A Premium subscription is required to use ChristCalm. Restore if you already purchased.
          </Text>
        </>
      ) : null}

      <Text
        style={{
          textAlign: "center",
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
          marginTop: spacing.md,
          lineHeight: 18,
        }}
      >
        {Platform.OS === "ios"
          ? "Payment charged to your Apple ID via RevenueCat. Auto-renews unless canceled 24h before period end."
          : Platform.OS === "android"
            ? "Payment charged to your Google Play account via RevenueCat. Auto-renews unless canceled."
            : "Managed through your app store subscription settings"}
      </Text>
    </Screen>
  );
}
