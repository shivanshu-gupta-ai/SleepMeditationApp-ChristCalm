import React, { useEffect, useState } from "react";
import { AccessibilityInfo, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Pressable } from "react-native";
import { motion } from "@/src/theme/primitives";
import { playHaptic, type HapticStrength } from "@/src/utils/haptics";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Press scale target — default Soft UI Evolution 0.97 */
  scaleTo?: number;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "link" | "none";
  accessibilityState?: { selected?: boolean; disabled?: boolean; checked?: boolean };
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
  /** Soft physical feedback on press (default light). Use "none" to disable. */
  haptic?: HapticStrength;
};

/**
 * Soft press feedback — scale + spring + optional haptic.
 * Respects prefers-reduced-motion (scale feedback disabled; haptic still light).
 */
export function PressableScale({
  children,
  onPress,
  disabled,
  style,
  testID,
  scaleTo = motion.pressScale,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
  hitSlop,
  haptic = "light",
}: Props) {
  const scale = useSharedValue(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => {
      if (mounted) setReduceMotion(v);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        void playHaptic(haptic);
        onPress?.();
      }}
      disabled={disabled}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      hitSlop={hitSlop}
      onPressIn={() => {
        if (disabled || reduceMotion) return;
        scale.value = withSpring(scaleTo, motion.pressSpring);
      }}
      onPressOut={() => {
        if (reduceMotion) return;
        scale.value = withSpring(1, motion.pressSpring);
      }}
    >
      <Animated.View style={[style, animatedStyle, disabled ? { opacity: 0.5 } : null]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
