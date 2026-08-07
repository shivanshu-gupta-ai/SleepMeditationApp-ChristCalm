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
  planForLadderTier,
  trackPaywallView,
  trackPaywallPlanSelect,
  trackPaywallPurchaseStart,
  trackPaywallPurchaseSuccess,
  trackPaywallPurchaseCancel,
  trackPaywallPurchaseError,
  trackPaywallSkip,
  trackPaywallTimerExpire,
  trackPaywallRestore,
  type PaywallSurface,
} from "@/src/features/subscriptions";
import { useOnboarding } from "../OnboardingContext";
import { ScarcityTimer } from "./ScarcityTimer";
import {
  PAYWALL_COPY,
  PAYWALL_FALLBACK_PRICES,
  PAYWALL_STEP_INDEX,
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
  if (tier === "mid") return "onboarding_50"; // reuse analytics key
  return "onboarding_80";
}

/**
 * Hard multi-tier onboarding paywall.
 * Each tier sells a real ASC/RC product. No free skip into the app.
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
    restore,
    error: rcError,
    clearError,
  } = useRevenueCat();

  const [plan, setPlan] = useState<PlanId>(
    tier === "full" ? "annualFull" : planForLadderTier(tier)
  );
  const [expired, setExpired] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const pulse = useMemo(() => new Animated.Value(1), []);

  const surface = surfaceForTier(tier);
  const copy = PAYWALL_COPY[tier];
  const ladderPlan = planForLadderTier(tier);

  const timerSeconds =
    tier === "full" ? TIMER_CONFIG.fullPrice : tier === "mid" ? TIMER_CONFIG.mid : TIMER_CONFIG.low;
  const timerKey =
    tier === "full"
      ? TIMER_STORAGE_KEYS.full
      : tier === "mid"
        ? TIMER_STORAGE_KEYS.mid
        : TIMER_STORAGE_KEYS.low;

  useEffect(() => {
    patch({ highestPaywallSeen: PAYWALL_STEP_INDEX[tier] });
    setPlan(tier === "full" ? "annualFull" : ladderPlan);
    trackPaywallView(surface, {
      tier: tier === "full" ? "full" : tier === "mid" ? "fifty" : "eighty",
      hasOfferings: Boolean(getPackage(ladderPlan)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  useEffect(() => {
    if (tier !== "low") return;
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

  const annualFullPkg = getPackage("annualFull");
  const annualMidPkg = getPackage("annualMid");
  const annualLowPkg = getPackage("annualLow");
  const monthlyPkg = getPackage("monthly");

  const priceFor = (p: PlanId) => {
    const pkg = getPackage(p);
    if (pkg?.product.priceString) return pkg.product.priceString;
    if (p === "monthly") return PAYWALL_FALLBACK_PRICES.monthly;
    if (p === "annualFull") return PAYWALL_FALLBACK_PRICES.annualFull;
    if (p === "annualMid") return PAYWALL_FALLBACK_PRICES.annualMid;
    return PAYWALL_FALLBACK_PRICES.annualLow;
  };

  const selectPlan = useCallback(
    (p: PlanId) => {
      setPlan(p);
      trackPaywallPlanSelect(surface, p, tier === "full" ? "full" : tier === "mid" ? "fifty" : "eighty");
    },
    [surface, tier]
  );

  const onExpire = useCallback(() => {
    setExpired(true);
    trackPaywallTimerExpire(tier === "full" ? "full" : tier === "mid" ? "fifty" : "eighty");
  }, [tier]);

  const afterPurchase = useCallback(async () => {
    await refreshUser();
    goToStep(26); // howAppWorks → then auth
  }, [refreshUser, goToStep]);

  const checkout = useCallback(
    async (selected: PlanId | "rc_ui") => {
      setLocalError(null);
      clearError();
      if (!supported || Platform.OS === "web") {
        setLocalError("Subscriptions require the ChristCalm iOS app (App Store).");
        trackPaywallPurchaseError(surface, selected, "not_supported");
        return;
      }
      trackPaywallPurchaseStart(surface, selected);
      try {
        if (selected === "rc_ui") {
          const ok = await presentPaywall();
          if (ok) {
            trackPaywallPurchaseSuccess(surface, "rc_ui");
            await afterPurchase();
          } else trackPaywallPurchaseCancel(surface, "rc_ui");
          return;
        }
        const ok = await purchase(selected);
        if (ok) {
          trackPaywallPurchaseSuccess(surface, selected);
          await afterPurchase();
        } else trackPaywallPurchaseCancel(surface, selected);
      } catch (e: unknown) {
        const err = e as { message?: string; userCancelled?: boolean };
        if (err?.userCancelled) {
          trackPaywallPurchaseCancel(surface, selected);
          return;
        }
        const msg = err?.message || "Unable to complete purchase.";
        trackPaywallPurchaseError(surface, selected, msg);
        setLocalError(msg);
      }
    },
    [supported, purchase, presentPaywall, afterPurchase, clearError, surface]
  );

  const onPrimary = useCallback(async () => {
    if (tier !== "full" && expired && tier !== "low") {
      trackPaywallSkip(surface, tier === "mid" ? "fifty" : "eighty", "timer_expired");
      goNext();
      return;
    }
    const toBuy: PlanId = tier === "full" ? plan : ladderPlan;
    await checkout(toBuy);
  }, [tier, expired, plan, ladderPlan, checkout, goNext, surface]);

  const onSecondary = useCallback(async () => {
    if (tier === "low") {
      // Restore only on final hard step
      setLocalError(null);
      clearError();
      if (!supported || Platform.OS === "web") {
        setLocalError("Restore requires the iOS app.");
        return;
      }
      try {
        const ok = await restore();
        trackPaywallRestore(surface, ok);
        if (ok) {
          trackPaywallPurchaseSuccess(surface, "restore");
          await afterPurchase();
        } else setLocalError("No active subscription found.");
      } catch (e: unknown) {
        trackPaywallRestore(surface, false);
        setLocalError((e as { message?: string })?.message || "Restore failed.");
      }
      return;
    }
    trackPaywallSkip(surface, tier === "full" ? "full" : "fifty", "escalate");
    goNext();
  }, [tier, goNext, surface, supported, restore, afterPurchase, clearError]);

  const urgencyColor = tier === "low" ? (isDark ? "#E89B6E" : "#C45C3A") : colors.primary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
        headline: {
          fontFamily: fonts.headingBold,
          fontSize: tier === "full" ? 24 : 26,
          lineHeight: 34,
          letterSpacing: -0.5,
          color: colors.textPrimary,
          textAlign: "center",
          marginBottom: spacing.lg,
        },
        timerBlock: { alignItems: "center", marginBottom: spacing.lg },
        timerCaption: {
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: 4,
        },
        timer: {
          fontFamily: fonts.headingBold,
          fontSize: tier === "low" ? 36 : 26,
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
          maxWidth: 320,
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
        planName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textPrimary },
        bestValue: {
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
          color: colors.premium,
          marginTop: 2,
        },
        planPrice: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary },
        planPriceSub: {
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
          textAlign: "right",
        },
        singlePrice: {
          fontFamily: fonts.headingBold,
          fontSize: 32,
          color: urgencyColor,
          textAlign: "center",
          marginBottom: spacing.md,
        },
        primaryBtn: {
          backgroundColor: tier === "low" ? urgencyColor : colors.primary,
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
          color: tier === "low" ? "#FFFFFF" : colors.textOnPrimary,
        },
        secondary: { alignItems: "center", paddingVertical: 10 },
        secondaryText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
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
    expired && tier === "mid"
      ? "Continue"
      : !supported || Platform.OS === "web"
        ? "Continue in iOS app"
        : copy.primaryCta;

  const activeAnnualPkg =
    tier === "full" ? annualFullPkg : tier === "mid" ? annualMidPkg : annualLowPkg;

  return (
    <View style={styles.root} testID={testID}>
      <Text style={styles.headline}>{copy.headline}</Text>

      <Animated.View
        style={[styles.timerBlock, tier === "low" ? { transform: [{ scale: pulse }] } : null]}
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
        {expired && tier === "mid" ? (
          <Text style={[styles.expireNote, { color: colors.danger }]}>
            This step expired — you can continue to the final plan.
          </Text>
        ) : null}
      </Animated.View>

      {tier === "full" ? (
        <View style={styles.plans}>
          <TouchableOpacity
            style={[styles.planCard, plan === "annualFull" && styles.planCardSelected]}
            onPress={() => selectPlan("annualFull")}
            testID="paywall-plan-annual-full"
          >
            <View style={styles.planRow}>
              <View>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.bestValue}>{PAYWALL_COPY.full.bestValue}</Text>
              </View>
              <View>
                <Text style={styles.planPrice}>{priceFor("annualFull")}</Text>
                <Text style={styles.planPriceSub}>billed yearly</Text>
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
                <Text style={styles.planPrice}>{priceFor("monthly")}</Text>
                <Text style={styles.planPriceSub}>billed monthly</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.singlePrice} testID={`paywall-price-${tier}`}>
          {priceFor(ladderPlan)}
          <Text style={{ fontSize: 16, color: colors.textSecondary }}> / year</Text>
        </Text>
      )}

      {(localError || rcError) && <Text style={styles.error}>{localError || rcError}</Text>}

      <TouchableOpacity
        style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
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
        disabled={busy}
        testID={`paywall-secondary-${tier}`}
      >
        <Text style={styles.secondaryText}>{copy.secondaryCta}</Text>
      </TouchableOpacity>

      <Text style={styles.storeNote}>
        {supported && Platform.OS !== "web"
          ? "Payment via Apple App Store through RevenueCat. Cancel anytime in Settings. No free trial."
          : "In-app purchases require the iOS app. Premium is required to continue."}
        {!activeAnnualPkg && supported ? " Loading store prices…" : ""}
        {monthlyPkg || annualFullPkg ? "" : ""}
      </Text>
    </View>
  );
}

export default EscalatingPaywall;
