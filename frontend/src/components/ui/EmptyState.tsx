import React, { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { FadeIn } from "@/src/components/ui/FadeIn";
import { PressableScale } from "@/src/components/ui/PressableScale";

const GRACE = require("@/assets/images/grace-mascot.jpg");

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
 * Calm empty state — optional Grace bob (P2).
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
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [bob, reduceMotion]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  return (
    <FadeIn>
      <View style={styles.wrap} testID={testID}>
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
            <Image source={GRACE} style={styles.grace} accessibilityLabel="Grace" />
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
      </View>
    </FadeIn>
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
