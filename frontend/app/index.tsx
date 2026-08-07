import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/features/auth";
import { usePremium } from "@/src/features/subscriptions";
import { LoadingState } from "@/src/components/ui";

/**
 * Boot gate (hard paywall):
 * onboarding → auth → premium required → home
 */
export default function Index() {
  const { loading, user, onboardingComplete } = useAuth();
  const { isPremium, rcReady } = usePremium();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
    if (!user) {
      router.replace("/(auth)/sign-in");
      return;
    }
    // Wait for RC when supported so we don't flash paywall on entitled users
    if (!rcReady && !isPremium) return;
    if (!isPremium) {
      router.replace("/paywall");
      return;
    }
    router.replace("/(tabs)/home");
  }, [loading, user, onboardingComplete, isPremium, rcReady, router]);

  return (
    <LoadingState
      emblem="grace"
      message="Preparing your space…"
      slowMessage="Almost there — Grace is nearly ready…"
      testID="app-loading"
    />
  );
}
