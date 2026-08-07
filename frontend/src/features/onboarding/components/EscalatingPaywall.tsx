import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import {
  useRevenueCat,
  type PlanId,
  trackPaywallView,
  trackPaywallPlanSelect,
  trackPaywallPurchaseStart,
  trackPaywallPurchaseSuccess,
  trackPaywallPurchaseCancel,
  trackPaywallPurchaseError,
  trackPaywallSkip,
  trackPaywallTimerExpire,
  type PaywallSurface,
  type PaywallTierProp,
} from "@/src/features/subscriptions";
import { useOnboarding } from "../OnboardingContext";
import { ScarcityTimer } from "./ScarcityTimer";
import {
  PAYWALL_COPY,
  PAYWALL_MARKETING,
  TIMER_CONFIG,
  TIMER_STORAGE_KEYS,
  type PaywallTier,
} from "../paywallConfig";

type Props = {
  tier: PaywallTier;
  testID?: string;
};

function surfaceForTier(tier: PaywallTier): PaywallSurface {
  if (tier === "full") return "onboarding_full";
  if (tier === "fifty") return "onboarding_50";
  return "onboarding_80";
}

function tierProp(tier: PaywallTier): PaywallTierProp {
  return tier;
}

/**
 * Escalating onboarding paywall (screens 23–25).
 * Custom UI + scarcity; **all checkout via RevenueCat** (package purchase or RC Paywall UI).
 */
export function EscalatingPaywall({ tier, testID }: Props) {
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();
  const { goNext, goToStep, patch } = useOnboarding();
  const { refreshUser } = useAuth();
  const {
    supported,
    purchasing,
    loadingOfferings,
    getPackage,
    purchase,
    presentPaywall,
    error: rcError,
    clearError,
  } = useRevenueCat();

  const [plan, setPlan] = useState<PlanId>("annual");
  const [expired, setExpired] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const pulse = useMemo(() => new Animated.Value(1), []);

  const surface = surfaceForTier(tier);
  const tProp = tierProp(tier);
  const copy = PAYWALL_COPY[tier];
  const marketing =
    PAYWALL_MARKETING[tier === "full" ? "full" : tier === "fifty" ? "fifty" : "eighty"];

  const timerSeconds =
    tier === "full"
      ? TIMER_CONFIG.fullPrice
      : tier === "fifty"
        ? TIMER_CONFIG.fiftyOff
        : TIMER_CONFIG.eightyOff;
  const timerKey =
    tier === "full"
      ? TIMER_STORAGE_KEYS.full
      : tier === "fifty"
        ? TIMER_STORAGE_KEYS.fifty
        : TIMER_STORAGE_KEYS.eighty;

  useEffect(() => {
    const stepIndex = tier === "full" ? 23 : tier === "fifty" ? 24 : 25;
    patch({ highestPaywallSeen: stepIndex });
    trackPaywallView(surface, {
      tier: tProp,
      hasOfferings: Boolean(getPackage("annual") || getPackage("monthly")),
    });
    // Intentional once-per-mount for this tier
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  useEffect(() => {
    if (tier !== "eighty") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tier, pulse]);

  const annualPkg = getPackage("annual");
  const monthlyPkg = getPackage("monthly");
  const hasStorePackages = Boolean(annualPkg || monthlyPkg);

  /** Prefer live App Store / Play price from RevenueCat; marketing only as offline fallback. */
  const annualPrice = annualPkg?.product.priceString || PAYWALL_MARKETING.full.yearlyNow;
  const monthlyPrice = monthlyPkg?.product.priceString || PAYWALL_MARKETING.full.monthly;
  const usingStorePrices = Boolean(annualPkg || monthlyPkg);

  const selectPlan = useCallback(
    (p: PlanId) => {
      setPlan(p);
      trackPaywallPlanSelect(surface, p, tProp);
    },
    [surface, tProp]
  );

  const onExpire = useCallback(() => {
    setExpired(true);
    trackPaywallTimerExpire(tProp);
  }, [tProp]);

  const afterPurchase = useCallback(async () => {
    await refreshUser();
    goToStep(26);
  }, [refreshUser, goToStep]);

  /** Checkout only through RevenueCat — package or hosted paywall UI. */
  const checkoutWithRevenueCat = useCallback(
    async (selected: PlanId | "rc_ui") => {
      setLocalError(null);
      clearError();

      if (!supported || Platform.OS === "web") {
        setLocalError("Subscriptions are available in the ChristCalm iOS or Android app.");
        trackPaywallPurchaseError(surface, selected, "not_supported", tProp);
        return;
      }

      trackPaywallPurchaseStart(surface, selected, tProp);

      try {
        let ok = false;
        if (selected === "rc_ui" || !hasStorePackages) {
          ok = await presentPaywall();
          if (ok) {
            trackPaywallPurchaseSuccess(surface, "rc_ui", tProp);
            await afterPurchase();
          } else {
            trackPaywallPurchaseCancel(surface, "rc_ui", tProp);
          }
          return;
        }

        ok = await purchase(selected);
        if (ok) {
          trackPaywallPurchaseSuccess(surface, selected, tProp);
          await afterPurchase();
        } else {
          trackPaywallPurchaseCancel(surface, selected, tProp);
        }
      } catch (e: unknown) {
        const err = e as { message?: string; userCancelled?: boolean };
        if (err?.userCancelled) {
          trackPaywallPurchaseCancel(surface, selected, tProp);
          return;
        }
        const msg = err?.message || "Unable to complete purchase.";
        trackPaywallPurchaseError(surface, selected, msg, tProp);
        setLocalError(msg);
      }
    },
    [
      supported,
      hasStorePackages,
      purchase,
      presentPaywall,
      afterPurchase,
      clearError,
      surface,
      tProp,
    ]
  );

  const onPrimary = useCallback(async () => {
    if (tier !== "full" && expired) {
      trackPaywallSkip(surface, tProp, "timer_expired");
      goNext();
      return;
    }
    // Discount tiers buy annual; full tier uses selected plan
    const planToBuy: PlanId = tier === "full" ? plan : "annual";
    await checkoutWithRevenueCat(planToBuy);
  }, [tier, expired, plan, checkoutWithRevenueCat, goNext, surface, tProp]);

  const onSecondary = useCallback(() => {
    trackPaywallSkip(surface, tProp, copy.secondaryCta);
    goNext();
  }, [goNext, surface, tProp, copy.secondaryCta]);

  const onOpenRcPaywall = useCallback(async () => {
    await checkoutWithRevenueCat("rc_ui");
  }, [checkoutWithRevenueCat]);

  const urgencyColor = tier === "eighty" ? (isDark ? "#E89B6E" : "#C45C3A") : colors.primary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
        },
        badge: {
          alignSelf: "center",
          backgroundColor: urgencyColor + "22",
          borderColor: urgencyColor,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: radius.full,
          marginBottom: spacing.md,
        },
        badgeText: {
          fontFamily: fonts.bodyBold,
          fontSize: 11,
          letterSpacing: 1,
          color: urgencyColor,
        },
        headline: {
          fontFamily: fonts.headingBold,
          fontSize: tier === "full" ? 24 : 28,
          lineHeight: tier === "full" ? 32 : 36,
          letterSpacing: -0.6,
          color: colors.textPrimary,
          textAlign: "center",
          marginBottom: spacing.lg,
        },
        timerBlock: {
          alignItems: "center",
          marginBottom: spacing.lg,
        },
        timerCaption: {
          fontFamily: fonts.body,
          fontSize: tier === "eighty" ? 15 : 13,
          color: colors.textSecondary,
          marginBottom: 4,
        },
        timer: {
          fontFamily: fonts.headingBold,
          fontSize: tier === "eighty" ? 36 : tier === "fifty" ? 28 : 22,
          color: urgencyColor,
          letterSpacing: 1,
        },
        expireNote: {
          fontFamily: fonts.body,
          fontSize: 13,
          lineHeight: 19,
          color: colors.textMuted,
          textAlign: "center",
          marginTop: spacing.sm,
          maxWidth: 300,
        },
        plans: { gap: spacing.sm, marginBottom: spacing.lg },
        planCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.md,
          borderWidth: 1.5,
          borderColor: colors.borderSoft,
          ...shadows.soft,
        },
        planCardSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primarySoft,
        },
        planRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        planName: {
          fontFamily: fonts.bodyBold,
          fontSize: 16,
          color: colors.textPrimary,
        },
        bestValue: {
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
          color: colors.premium,
          marginTop: 2,
        },
        planPrice: {
          fontFamily: fonts.headingBold,
          fontSize: 18,
          color: colors.textPrimary,
        },
        planPriceSub: {
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
          textAlign: "right",
        },
        strike: {
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textMuted,
          textDecorationLine: "line-through",
          textAlign: "right",
        },
        discountPrice: {
          fontFamily: fonts.headingBold,
          fontSize: 28,
          color: urgencyColor,
          textAlign: "center",
          marginBottom: spacing.sm,
        },
        priceRow: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          marginBottom: spacing.md,
        },
        primaryBtn: {
          backgroundColor: tier === "eighty" ? urgencyColor : colors.primary,
          borderRadius: radius.full,
          paddingVertical: 16,
          alignItems: "center",
          marginBottom: spacing.sm,
          ...shadows.glow,
        },
        primaryBtnDisabled: { opacity: 0.45 },
        primaryText: {
          fontFamily: fonts.bodyBold,
          fontSize: 16,
          color: tier === "eighty" ? "#FFFFFF" : colors.textOnPrimary,
        },
        secondary: {
          alignItems: "center",
          paddingVertical: 10,
        },
        secondaryText: {
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textSecondary,
        },
        rcLink: {
          alignItems: "center",
          paddingVertical: 8,
          marginTop: 4,
        },
        rcLinkText: {
          fontFamily: fonts.bodyMedium,
          fontSize: 13,
          color: colors.primary,
        },
        error: {
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.danger,
          textAlign: "center",
          marginBottom: spacing.sm,
        },
        storeNote: {
          fontFamily: fonts.body,
          fontSize: 11,
          color: colors.textMuted,
          textAlign: "center",
          marginTop: spacing.sm,
          lineHeight: 16,
        },
      }),
    [colors, fonts, spacing, radius, shadows, tier, urgencyColor]
  );

  const busy = purchasing || loadingOfferings;
  const primaryLabel =
    tier !== "full" && expired
      ? "Continue"
      : !supported || Platform.OS === "web"
        ? "Continue"
        : copy.primaryCta;

  return (
    <View style={styles.root} testID={testID}>
      {"badge" in marketing && marketing.badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{marketing.badge}</Text>
        </View>
      ) : null}

      <Text style={styles.headline}>{copy.headline}</Text>

      <Animated.View
        style={[styles.timerBlock, tier === "eighty" ? { transform: [{ scale: pulse }] } : null]}
      >
        <Text style={styles.timerCaption}>{copy.timerCaption}</Text>
        <ScarcityTimer
          initialSeconds={timerSeconds}
          storageKey={timerKey}
          onExpire={onExpire}
          style={styles.timer}
          testID={`timer-${tier}`}
        />
        {"expireNote" in copy && copy.expireNote ? (
          <Text style={styles.expireNote}>{copy.expireNote}</Text>
        ) : null}
        {expired && tier !== "full" ? (
          <Text style={[styles.expireNote, { color: colors.danger }]}>
            This offer has expired.
          </Text>
        ) : null}
      </Animated.View>

      {tier === "full" ? (
        <View style={styles.plans}>
          <TouchableOpacity
            style={[styles.planCard, plan === "annual" && styles.planCardSelected]}
            onPress={() => selectPlan("annual")}
            testID="paywall-plan-annual"
          >
            <View style={styles.planRow}>
              <View>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.bestValue}>{PAYWALL_COPY.full.bestValue}</Text>
              </View>
              <View>
                <Text style={styles.planPrice}>{annualPrice}</Text>
                <Text style={styles.planPriceSub}>
                  {usingStorePrices ? "billed yearly" : PAYWALL_MARKETING.full.yearlySuffix}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.planCard, plan === "monthly" && styles.planCardSelected]}
            onPress={() => selectPlan("monthly")}
            testID="paywall-plan-monthly"
          >
            <View style={styles.planRow}>
              <Text style={styles.planName}>Monthly</Text>
              <View>
                <Text style={styles.planPrice}>{monthlyPrice}</Text>
                <Text style={styles.planPriceSub}>
                  {usingStorePrices ? "billed monthly" : PAYWALL_MARKETING.full.monthlySuffix}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.priceRow}>
          {usingStorePrices && annualPkg?.product.priceString ? null : (
            <Text style={styles.strike}>
              {"yearlyList" in marketing ? marketing.yearlyList : ""}
            </Text>
          )}
          <Text style={styles.discountPrice}>
            {annualPrice}
            <Text style={{ fontSize: 16 }}> / year</Text>
          </Text>
        </View>
      )}

      {(localError || rcError) && (
        <Text style={styles.error}>{localError || rcError}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.primaryBtn,
          (busy || (expired && tier === "eighty" && supported)) && styles.primaryBtnDisabled,
        ]}
        onPress={onPrimary}
        disabled={busy}
        testID={`paywall-primary-${tier}`}
      >
        {busy ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondary}
        onPress={onSecondary}
        testID={`paywall-secondary-${tier}`}
      >
        <Text style={styles.secondaryText}>{copy.secondaryCta}</Text>
      </TouchableOpacity>

      {supported && Platform.OS !== "web" ? (
        <TouchableOpacity
          style={styles.rcLink}
          onPress={onOpenRcPaywall}
          disabled={busy}
          testID="paywall-rc-hosted"
        >
          <Text style={styles.rcLinkText}>See all plans (App Store)</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.storeNote}>
        {supported && Platform.OS !== "web"
          ? "Payments are processed by Apple or Google via RevenueCat. Cancel anytime in your store account."
          : "In-app purchases run on iOS / Android. You can continue setup and subscribe later."}
      </Text>
    </View>
  );
}

export default EscalatingPaywall;
