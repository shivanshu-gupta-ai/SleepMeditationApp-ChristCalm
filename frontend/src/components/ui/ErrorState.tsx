import React, { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { isNetworkErrorMessage, isSessionErrorMessage } from "@/src/utils/connectivity";
import { motion } from "@/src/theme/primitives";
type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  fullScreen?: boolean;
  testID?: string;
  /** Force offline-flavored icon/copy */
  offline?: boolean;
};

/**
 * Soft error card with enter animation + contextual offline / session copy.
 */
export function ErrorState({
  title,
  message = "We couldn't load this right now. Take a breath and try again.",
  onRetry,
  retryLabel = "Try again",
  fullScreen = true,
  testID = "error-state",
  offline,
}: Props) {
  const { colors, fonts, spacing, radius, shadows } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  const network = offline ?? isNetworkErrorMessage(message);
  const session = isSessionErrorMessage(message);

  const resolvedTitle =
    title ||
    (network ? "Connection resting" : session ? "Session ended" : "Something went quiet");

  const iconName = network
    ? ("cloud-offline-outline" as const)
    : session
      ? ("key-outline" as const)
      : ("leaf-outline" as const);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const easing = Easing.out(Easing.cubic);
    opacity.value = withTiming(1, { duration: motion.enterDuration, easing });
    translateY.value = withTiming(0, { duration: motion.enterDuration, easing });
  }, [reduceMotion, opacity, translateY]);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View
      style={[styles.wrap, fullScreen && styles.full, { backgroundColor: colors.background }]}
      testID={testID}
      accessibilityRole="alert"
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSoft,
            borderRadius: radius.lg,
            ...shadows.soft,
          },
          enterStyle,
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: network || session ? colors.dangerSoft : colors.primarySoft },
          ]}
        >
          <Ionicons
            name={iconName}
            size={28}
            color={network || session ? colors.danger : colors.primary}
          />
        </View>
        <Text
          style={{
            fontFamily: fonts.headingBold,
            fontSize: 20,
            color: colors.textPrimary,
            textAlign: "center",
            letterSpacing: -0.3,
            marginTop: spacing.md,
          }}
        >
          {resolvedTitle}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
            marginTop: spacing.sm,
          }}
        >
          {message}
        </Text>
        {onRetry ? (
          <PressableScale
            onPress={onRetry}
            haptic="light"
            style={[
              styles.retry,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.full,
                marginTop: spacing.lg,
              },
            ]}
            testID={`${testID}-retry`}
            accessibilityLabel={retryLabel}
          >
            <Ionicons name="refresh" size={18} color={colors.white} />
            <Text
              style={{
                color: colors.white,
                fontFamily: fonts.bodyBold,
                fontSize: 15,
              }}
            >
              {retryLabel}
            </Text>
          </PressableScale>
        ) : null}
      </Animated.View>
    </View>
  );
}

export function ErrorBanner({
  message,
  onDismiss,
  testID = "error-banner",
}: {
  message: string;
  onDismiss?: () => void;
  testID?: string;
}) {
  const { colors, fonts, spacing, radius } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-6);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const easing = Easing.out(Easing.cubic);
    opacity.value = withTiming(1, { duration: 220, easing });
    translateY.value = withTiming(0, { duration: 220, easing });
  }, [message, reduceMotion, opacity, translateY]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const network = isNetworkErrorMessage(message);

  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: colors.dangerSoft,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.accentSOS + "33",
        },
        anim,
      ]}
      testID={testID}
      accessibilityRole="alert"
    >
      <Ionicons
        name={network ? "cloud-offline-outline" : "alert-circle"}
        size={18}
        color={colors.danger}
      />
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.danger }}>
        {message}
      </Text>
      {onDismiss ? (
        <PressableScale onPress={onDismiss} hitSlop={12} haptic="none" accessibilityLabel="Dismiss">
          <Ionicons name="close" size={18} color={colors.danger} />
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  full: { flex: 1 },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  retry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
});
