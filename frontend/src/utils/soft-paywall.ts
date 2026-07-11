import { storage } from "@/src/utils/storage";

const SHOWN_KEY = "cc_soft_paywall_shown";

export async function shouldShowSoftPaywall(): Promise<boolean> {
  const shown = await storage.getItem(SHOWN_KEY, false);
  return !shown;
}

export async function markSoftPaywallShown(): Promise<void> {
  await storage.setItem(SHOWN_KEY, true);
}