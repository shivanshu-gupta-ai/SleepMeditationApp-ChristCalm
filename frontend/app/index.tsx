import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/features/auth";
import { LoadingState } from "@/src/components/ui";

export default function Index() {
  const { loading, user, onboardingComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!onboardingComplete) {
      router.replace("/onboarding");
    } else if (!user) {
      router.replace("/(auth)/sign-in");
    } else {
      router.replace("/(tabs)/home");
    }
  }, [loading, user, onboardingComplete, router]);

  return (
    <LoadingState
      emblem="grace"
      message="Preparing your space…"
      slowMessage="Almost there — Grace is nearly ready…"
      testID="app-loading"
    />
  );
}
