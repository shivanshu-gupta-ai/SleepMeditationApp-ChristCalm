import { useCallback, useEffect } from "react";
import { BackHandler } from "react-native";
import { useRouter, type Href } from "expo-router";

/**
 * Reliable back navigation for Expo Router.
 * router.back() often fails when screens were reached via router.replace().
 *
 * Pass onBack to handle screen-local back (e.g. onboarding steps). Return true
 * when handled so the hook skips router navigation.
 */
export function useSafeBack(
  fallback: Href = "/(tabs)/home",
  onBack?: () => boolean
) {
  const router = useRouter();

  const goBack = useCallback(() => {
    if (onBack?.()) {
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallback);
  }, [router, fallback, onBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  return goBack;
}