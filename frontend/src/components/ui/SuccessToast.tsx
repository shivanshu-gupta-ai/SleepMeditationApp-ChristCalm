import React, { useEffect } from "react";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

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
