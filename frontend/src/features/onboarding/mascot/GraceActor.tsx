import React, { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import type { GraceExpression } from "../types";
import type { ReactKind } from "./motionProfiles";
import {
  GRACE_ASPECT_RATIO,
  GRACE_DISPLAY,
  GRACE_GIF_ASSETS,
  type GraceMoodKey,
} from "./graceAssets";

export type GraceActorProps = {
  expression?: GraceExpression | "splash";
  /** Display width; height follows the native 300:169 GIF aspect ratio. */
  size?: number;
  animate?: boolean;
  showGlow?: boolean;
  glowTone?: "primary" | "gold" | "muted" | "warm";
  /** Fire a one-shot reaction when this token increments. */
  reactToken?: number;
  reactKind?: ReactKind;
  decorative?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Grace uses bundled GIFs for instant, offline playback. The GIF supplies the
 * idle loop; Reanimated is reserved for entry and user-triggered reactions.
 */
export function GraceActor({
  expression = "welcome",
  size = GRACE_DISPLAY.default,
  animate = true,
  showGlow = true,
  glowTone = "primary",
  reactToken = 0,
  reactKind = "none",
  decorative = false,
  style,
  testID = "grace-actor",
}: GraceActorProps) {
  const { colors, isDark } = useTheme();
  const mood = expression as GraceMoodKey;
  const imageHeight = Math.round(size / GRACE_ASPECT_RATIO);

  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const reactionY = useSharedValue(0);
  const reactionX = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(1);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduceMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        if (mounted) setReduceMotion(value);
      }
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    reactionY.value = 0;
    reactionX.value = 0;
    scale.value = 1;
    glowOpacity.value = 1;

    if (!animate || reduceMotion !== false) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    opacity.value = 0.4;
    translateY.value = 8;
    opacity.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [
    expression,
    animate,
    reduceMotion,
    opacity,
    translateY,
    reactionY,
    reactionX,
    scale,
    glowOpacity,
  ]);

  useEffect(() => {
    if (
      !reactToken ||
      reactKind === "none" ||
      reduceMotion !== false ||
      !animate
    ) {
      return;
    }

    const run = () => {
      if (reactKind === "nod") {
        reactionY.value = withSequence(
          withTiming(-10, { duration: 120 }),
          withSpring(0, { damping: 12, stiffness: 180 })
        );
        scale.value = withSequence(
          withTiming(0.97, { duration: 100 }),
          withSpring(1, { damping: 14, stiffness: 200 })
        );
      } else if (reactKind === "lean") {
        reactionX.value = withSequence(
          withTiming(8, { duration: 180 }),
          withTiming(0, {
            duration: 240,
            easing: Easing.out(Easing.cubic),
          })
        );
      } else if (reactKind === "celebrate") {
        scale.value = withSequence(
          withTiming(1.06, { duration: 140 }),
          withSpring(1, { damping: 10, stiffness: 160 })
        );
        reactionY.value = withSequence(
          withTiming(-12, { duration: 140 }),
          withSpring(0, { damping: 12, stiffness: 170 })
        );
        glowOpacity.value = withSequence(
          withTiming(1.45, { duration: 160 }),
          withTiming(1, { duration: 320 })
        );
      } else if (reactKind === "exhale") {
        scale.value = withSequence(
          withTiming(0.97, { duration: 240 }),
          withTiming(1, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          })
        );
      }
    };

    if (reactKind === "celebrate") {
      const timeout = setTimeout(run, 420);
      return () => clearTimeout(timeout);
    }
    run();
  }, [
    reactToken,
    reactKind,
    reduceMotion,
    animate,
    reactionY,
    reactionX,
    scale,
    glowOpacity,
  ]);

  const glowColor =
    glowTone === "gold"
      ? colors.premium
      : glowTone === "warm"
        ? colors.secondary
        : glowTone === "muted"
          ? colors.textMuted
          : colors.primary;

  const actorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value + reactionY.value },
      { translateX: reactionX.value },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity:
      (isDark ? 0.2 : 0.14) * glowOpacity.value,
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: size + 16,
          height: imageHeight + 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        },
        glow: {
          position: "absolute",
          width: size * 0.66,
          height: imageHeight * 0.88,
          borderRadius: imageHeight,
          backgroundColor: glowColor,
        },
        image: {
          width: size,
          height: imageHeight,
          backgroundColor: "transparent",
        },
      }),
    [size, imageHeight, glowColor]
  );

  return (
    <View
      style={[styles.wrap, style]}
      testID={testID}
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "auto"}
      accessibilityRole={decorative ? undefined : "image"}
      accessibilityLabel={decorative ? undefined : "ChristCalm companion Grace"}
    >
      {showGlow ? (
        <Animated.View
          style={[styles.glow, glowStyle]}
          pointerEvents="none"
        />
      ) : null}
      <Animated.View style={actorStyle}>
        <Image
          source={GRACE_GIF_ASSETS[mood]}
          style={styles.image}
          contentFit="contain"
          autoplay={animate && reduceMotion === false}
          transition={null}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
}

export default GraceActor;
