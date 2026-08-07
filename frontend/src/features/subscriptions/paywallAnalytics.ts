/**
 * Funnel events for subscription surfaces.
 * Revenue + store conversion: RevenueCat Charts (automatic via SDK purchases).
 * Tier / skip / timer: these product events → DynamoDB analytics.
 */
import { track } from "@/src/utils/analytics";
import type { PlanId } from "./constants";

export type PaywallSurface =
  | "onboarding_full"
  | "onboarding_50"
  | "onboarding_80"
  | "in_app"
  | "soft_post_practice"
  | "profile"
  | "rc_hosted";

export type PaywallTierProp = "full" | "fifty" | "eighty" | "none";

function props(base: Record<string, string | number | boolean | null | undefined>) {
  return { provider: "revenuecat" as const, ...base };
}

export function trackPaywallView(
  surface: PaywallSurface,
  extra?: { tier?: PaywallTierProp; hasOfferings?: boolean }
) {
  void track("paywall_view", props({ surface, ...extra }));
  // Keep legacy name for existing dashboards
  void track("paywall_shown", props({ surface, ...extra }));
}

export function trackPaywallPlanSelect(surface: PaywallSurface, plan: PlanId, tier?: PaywallTierProp) {
  void track("paywall_plan_select", props({ surface, plan, tier: tier ?? "none" }));
}

export function trackPaywallPurchaseStart(
  surface: PaywallSurface,
  plan: PlanId | "rc_ui",
  tier?: PaywallTierProp
) {
  void track("paywall_purchase_start", props({ surface, plan, tier: tier ?? "none" }));
}

export function trackPaywallPurchaseSuccess(
  surface: PaywallSurface,
  plan: PlanId | "rc_ui" | "restore",
  tier?: PaywallTierProp
) {
  void track("paywall_purchase_success", props({ surface, plan, tier: tier ?? "none" }));
}

export function trackPaywallPurchaseCancel(
  surface: PaywallSurface,
  plan: PlanId | "rc_ui",
  tier?: PaywallTierProp
) {
  void track("paywall_purchase_cancel", props({ surface, plan, tier: tier ?? "none" }));
}

export function trackPaywallPurchaseError(
  surface: PaywallSurface,
  plan: PlanId | "rc_ui",
  message: string,
  tier?: PaywallTierProp
) {
  void track(
    "paywall_purchase_error",
    props({ surface, plan, tier: tier ?? "none", message: message.slice(0, 120) })
  );
}

export function trackPaywallSkip(surface: PaywallSurface, tier?: PaywallTierProp, reason?: string) {
  void track("paywall_skip", props({ surface, tier: tier ?? "none", reason: reason ?? "secondary" }));
}

export function trackPaywallTimerExpire(tier: PaywallTierProp) {
  void track("paywall_timer_expire", props({ surface: `onboarding_${tier}` as PaywallSurface, tier }));
}

export function trackPaywallRestore(surface: PaywallSurface, success: boolean) {
  void track("paywall_restore", props({ surface, success }));
}
