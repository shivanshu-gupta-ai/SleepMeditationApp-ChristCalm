import React, { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { motion } from "@/src/theme/primitives";

const GRACE = require("@/assets/images/grace-mascot.png");

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  withGrace?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/**
 * Calm empty state — Grace bob + soft enter fade.
 */
export function EmptyState({
  icon = "leaf-outline",
  title,
  message,
  withGrace = true,
  actionLabel,
  onAction,
  testID = "empty-state",
}: Props) {
  const { colors, fonts, spacing } = useTheme();
  const bob = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      bob.value = 0;
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const easing = Easing.out(Easing.cubic);
    opacity.value = withTiming(1, { duration: motion.enterDuration, easing });
    translateY.value = withTiming(0, { duration: motion.enterDuration, easing });
    bob.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, [bob, reduceMotion, opacity, translateY]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  const enterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, enterStyle]} testID={testID}>
      {withGrace ? (
        <Animated.View
          style={[
            styles.graceRing,
            {
              borderColor: colors.borderSoft,
              backgroundColor: colors.primarySoft,
            },
            bobStyle,
          ]}
        >
          <Image source={GRACE} style={styles.grace} resizeMode="contain" accessibilityLabel="Grace" />
        </Animated.View>
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={26} color={colors.primary} />
        </View>
      )}
      <Text
        style={{
          fontFamily: fonts.headingBold,
          fontSize: 17,
          color: colors.textPrimary,
          marginTop: spacing.md,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {message ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: spacing.xs,
            textAlign: "center",
            lineHeight: 21,
            maxWidth: 280,
          }}
        >
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} scaleTo={0.96} style={{ marginTop: spacing.md }}>
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 14,
              color: colors.primary,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
            accessibilityRole="button"
          >
            {actionLabel}
          </Text>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  graceRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  grace: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});
