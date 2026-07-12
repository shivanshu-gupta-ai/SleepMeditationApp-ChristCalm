import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "@/src/components/BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import { useRevenueCat } from "@/src/context/RevenueCatContext";
import { usePremium } from "@/src/hooks/use-premium";
import type { PlanId } from "@/src/constants/subscriptions";
import { Screen, Button, ErrorBanner, SectionHeader, PressableScale } from "@/src/components/ui";

const FEATURES = [
  { icon: "leaf" as const, label: "Unlimited emotion-based meditations" },
  { icon: "chatbubbles" as const, label: "Conversational wisdom (What would Jesus say?)" },
  { icon: "book" as const, label: "Scripture-rooted guidance from our wisdom library" },
  { icon: "musical-notes" as const, label: "Guided audio sessions" },
  { icon: "heart" as const, label: "Priority SOS support" },
  { icon: "cloud-offline" as const, label: "Ad-free forever" },
];

function formatPrice(plan: PlanId, getPackage: ReturnType<typeof useRevenueCat>["getPackage"]) {
  const pkg = getPackage(plan);
  if (!pkg) {
    return plan === "monthly"
      ? { main: "$9.99", sub: "billed monthly" }
      : { main: "$59.99", sub: "$5.00 / month · billed yearly" };
  }
  const product = pkg.product;
  if (plan === "annual" && product.pricePerMonthString) {
    return {
      main: product.priceString,
      sub: `${product.pricePerMonthString} / month · billed yearly`,
    };
  }
  return {
    main: product.priceString,
    sub: plan === "monthly" ? "billed monthly" : "billed yearly",
  };
}

export default function Paywall() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { isPremium } = usePremium();
  const { supported, loadingOfferings, purchasing, getPackage, purchase, restore } =
    useRevenueCat();
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();
  const [plan, setPlan] = useState<PlanId>("annual");
  const [error, setError] = useState<string | null>(null);

  const monthlyPrice = formatPrice("monthly", getPackage);
  const annualPrice = formatPrice("annual", getPackage);
  const selectedPrice = formatPrice(plan, getPackage);

  const subscribe = async () => {
    setError(null);
    try {
      const active = await purchase(plan);
      if (active) {
        await refreshUser();
        router.replace("/(tabs)/home");
      }
    } catch (e: any) {
      if (e?.userCancelled) return;
      setError(e?.message || "Unable to complete purchase. Please try again.");
    }
  };

  const onRestore = async () => {
    setError(null);
    try {
      const active = await restore();
      if (active) {
        await refreshUser();
        router.replace("/(tabs)/home");
      } else {
        setError("No active subscription found for this account.");
      }
    } catch (e: any) {
      setError(e?.message || "Unable to restore purchases.");
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

      {/* Nest dark: deep surface + gold star · Cooper light: soft lavender hero */}
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

      <SectionHeader title="Choose your plan" />

      {/* Dual plan cards — Cooper+ style, calm palette */}
      <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
        {(["annual", "monthly"] as PlanId[]).map((p) => {
          const price = p === "annual" ? annualPrice : monthlyPrice;
          const active = plan === p;
          const isAnnual = p === "annual";
          return (
            <PressableScale
              key={p}
              scaleTo={active ? 0.99 : 0.97}
              onPress={() => setPlan(p)}
              testID={`plan-${p}`}
              haptic="light"
              style={{
                backgroundColor: active
                  ? isAnnual
                    ? colors.tileA
                    : colors.tileB
                  : colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                borderWidth: 2,
                borderColor: active ? colors.primary : colors.borderSoft,
                ...shadows.soft,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text
                      style={{
                        fontFamily: fonts.headingBold,
                        fontSize: 18,
                        color: colors.textPrimary,
                      }}
                    >
                      {isAnnual ? "Yearly plan" : "Monthly plan"}
                    </Text>
                    {isAnnual ? (
                      <View
                        style={{
                          backgroundColor: colors.premiumSoft,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: radius.full,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.premiumDark,
                            fontFamily: fonts.bodyBold,
                            fontSize: 11,
                          }}
                        >
                          Best value
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.headingBold,
                      fontSize: 28,
                      color: colors.textPrimary,
                      marginTop: 8,
                      letterSpacing: -0.5,
                    }}
                  >
                    {price.main}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    {price.sub}
                  </Text>
                  <View style={{ marginTop: spacing.md, gap: 6 }}>
                    {["Unlimited meditations", "Wisdom chat", "Ad-free calm"].map((f) => (
                      <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                        <Text
                          style={{
                            fontFamily: fonts.body,
                            fontSize: 13,
                            color: colors.textSecondary,
                          }}
                        >
                          {f}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active ? (
                    <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
                  ) : null}
                </View>
              </View>
            </PressableScale>
          );
        })}
      </View>

      {!isPremium ? (
        <>
          {!supported ? (
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
                Subscriptions are purchased through the App Store or Google Play in the native
                ChristCalm app.
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={{ marginTop: spacing.md }}>
              <ErrorBanner
                message={error}
                onDismiss={() => setError(null)}
                testID="paywall-error"
              />
            </View>
          ) : null}

          <Button
            label={`Subscribe · ${selectedPrice.main}${plan === "monthly" ? " / month" : " / year"}`}
            icon="arrow-forward"
            iconPosition="right"
            onPress={subscribe}
            loading={loadingOfferings || purchasing}
            disabled={!supported}
            testID="paywall-subscribe-btn"
            style={{ marginTop: spacing.lg }}
          />

          {supported ? (
            <TouchableOpacity
              onPress={onRestore}
              disabled={purchasing}
              testID="paywall-restore-btn"
              style={{ paddingVertical: spacing.md }}
            >
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
            </TouchableOpacity>
          ) : null}
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
          ? "Payment charged to your Apple ID. Auto-renews unless canceled 24h before period end."
          : Platform.OS === "android"
            ? "Payment charged to your Google Play account. Auto-renews unless canceled."
            : "Cancel anytime · Managed through your app store subscription settings"}
      </Text>
    </Screen>
  );
}
