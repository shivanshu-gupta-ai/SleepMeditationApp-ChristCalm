import React, { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { useConnectivity } from "@/src/context/ConnectivityContext";
import { PressableScale } from "@/src/components/ui/PressableScale";

/**
 * Soft top banners for offline + session expiry — no full-screen interruption.
 */
export function ConnectivityBanners() {
  const { colors, fonts, spacing, radius, shadows } = useTheme();
  const { online, sessionNotice, dismissSessionNotice } = useConnectivity();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [reduceMotion, setReduceMotion] = useState(false);

  const offlineY = useSharedValue(-80);
  const offlineOp = useSharedValue(0);
  const sessionY = useSharedValue(-80);
  const sessionOp = useSharedValue(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    const show = !online;
    const dur = reduceMotion ? 0 : 280;
    const easing = Easing.out(Easing.cubic);
    offlineY.value = withTiming(show ? 0 : -80, { duration: dur, easing });
    offlineOp.value = withTiming(show ? 1 : 0, { duration: dur, easing });
  }, [online, reduceMotion, offlineY, offlineOp]);

  useEffect(() => {
    const show = Boolean(sessionNotice);
    const dur = reduceMotion ? 0 : 280;
    const easing = Easing.out(Easing.cubic);
    sessionY.value = withTiming(show ? 0 : -80, { duration: dur, easing });
    sessionOp.value = withTiming(show ? 1 : 0, { duration: dur, easing });
  }, [sessionNotice, reduceMotion, sessionY, sessionOp]);

  const offlineStyle = useAnimatedStyle(() => ({
    opacity: offlineOp.value,
    transform: [{ translateY: offlineY.value }],
  }));

  const sessionStyle = useAnimatedStyle(() => ({
    opacity: sessionOp.value,
    transform: [{ translateY: sessionY.value }],
  }));

  const onAuthScreen =
    pathname?.includes("sign-in") ||
    pathname?.includes("sign-up") ||
    pathname?.includes("confirm") ||
    pathname?.includes("forgot") ||
    pathname?.includes("reset");

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: Math.max(insets.top, 8) }]}>
      {!online ? (
        <Animated.View
          style={[offlineStyle, styles.bannerWrap]}
          pointerEvents="auto"
          testID="offline-banner"
        >
          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSoft,
                borderRadius: radius.lg,
                ...shadows.soft,
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="cloud-offline-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.bodyBold,
                  fontSize: 13,
                  color: colors.textPrimary,
                }}
              >
                You're offline
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginTop: 2,
                  lineHeight: 16,
                }}
              >
                SOS still works. Other content needs a connection.
              </Text>
            </View>
          </View>
        </Animated.View>
      ) : null}

      {sessionNotice ? (
        <Animated.View
          style={[sessionStyle, styles.bannerWrap]}
          pointerEvents="auto"
          testID="session-banner"
        >
          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSoft,
                borderRadius: radius.lg,
                ...shadows.soft,
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons name="key-outline" size={18} color={colors.danger} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text
                style={{
                  fontFamily: fonts.bodyBold,
                  fontSize: 13,
                  color: colors.textPrimary,
                }}
              >
                Session ended
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: colors.textSecondary,
                  lineHeight: 16,
                }}
              >
                {sessionNotice}
              </Text>
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: 2 }}>
                {!onAuthScreen ? (
                  <PressableScale
                    onPress={() => {
                      dismissSessionNotice();
                      router.push("/(auth)/sign-in");
                    }}
                    haptic="light"
                    testID="session-banner-signin"
                  >
                    <Text
                      style={{
                        fontFamily: fonts.bodyBold,
                        fontSize: 13,
                        color: colors.primary,
                        paddingVertical: 4,
                      }}
                    >
                      Sign in
                    </Text>
                  </PressableScale>
                ) : null}
                <PressableScale onPress={dismissSessionNotice} haptic="none" testID="session-banner-dismiss">
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 13,
                      color: colors.textMuted,
                      paddingVertical: 4,
                    }}
                  >
                    Dismiss
                  </Text>
                </PressableScale>
              </View>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 1000,
    gap: 8,
  },
  bannerWrap: {
    width: "100%",
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
});
