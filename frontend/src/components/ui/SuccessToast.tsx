import React, { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  visible: boolean;
  message?: string;
  testID?: string;
};

/**
 * Brief success flash — checkmark + soft scale. Auto-fades when parent toggles.
 */
export function SuccessToast({
  visible,
  message = "Saved",
  testID = "success-toast",
}: Props) {
  const { colors, fonts, spacing, radius, shadows } = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!visible) {
      opacity.value = withTiming(0, { duration: reduceMotion ? 0 : 180 });
      return;
    }
    if (reduceMotion) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    opacity.value = withSequence(
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 900 }),
      withTiming(0, { duration: 280 })
    );
    scale.value = withSequence(
      withTiming(1.04, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 160 })
    );
  }, [visible, reduceMotion, opacity, scale]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible && opacity.value === 0) {
    // still mount while animating out — parent keeps visible true briefly
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          backgroundColor: colors.successSoft,
          borderColor: colors.success + "44",
          borderRadius: radius.full,
          ...shadows.soft,
        },
        anim,
      ]}
      testID={testID}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      <Text
        style={{
          fontFamily: fonts.bodyBold,
          fontSize: 13,
          color: colors.success,
          marginLeft: spacing.xs,
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

/** Inline success strip for forms */
export function SuccessInline({
  message = "Saved with care",
  testID = "success-inline",
}: {
  message?: string;
  testID?: string;
}) {
  const { colors, fonts, spacing, radius } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [opacity, translateY]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: colors.successSoft,
          borderRadius: radius.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderWidth: 1,
          borderColor: colors.success + "33",
        },
        anim,
      ]}
      testID={testID}
    >
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.success }}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
});
