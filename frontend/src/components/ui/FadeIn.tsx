import React, { useEffect, useState } from "react";
import { AccessibilityInfo, type StyleProp, type ViewStyle, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { motion } from "@/src/theme/primitives";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Stagger delay in ms */
  delay?: number;
  /** Vertical offset for the gentle slide-up */
  offset?: number;
  duration?: number;
};

/**
 * Soft fade + gentle slide-up. Skips motion when reduce-motion is on.
 */
export function FadeIn({
  children,
  style,
  delay = 0,
  offset = motion.enterSlide,
  duration = motion.enterDuration,
}: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(offset);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) {
        setReduceMotion(v);
        setChecked(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const easing = Easing.out(Easing.cubic);
    opacity.value = withDelay(delay, withTiming(1, { duration, easing }));
    translateY.value = withDelay(delay, withTiming(0, { duration, easing }));
  }, [checked, reduceMotion, delay, duration, offset, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (reduceMotion && checked) {
    return <View style={style}>{children}</View>;
  }

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
