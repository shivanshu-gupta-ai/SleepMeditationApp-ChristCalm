import React, { useEffect, useState } from "react";
import { AccessibilityInfo, Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { motion } from "@/src/theme/primitives";

/** Cute Grace loading badges (Imagine, mascot-matched sage/teal) */
const GRACE_WAIT = require("@/assets/images/loading/grace-wait.jpg");
const GRACE_WAIT_DARK = require("@/assets/images/loading/grace-wait-dark.jpg");
const GRACE_CALM = require("@/assets/images/loading/grace-calm.jpg");

export type LoadingEmblem = "grace" | "calm";

/** Grace mascot palette accents for glow (not app purple) */
const GRACE_SAGE = "#7A9A96";
const GRACE_SAGE_SOFT = "rgba(122, 154, 150, 0.28)";
const GRACE_PEACH_SOFT = "rgba(232, 168, 140, 0.22)";

type Props = {
  message?: string;
  /** Shown after ~2.8s when still loading */
  slowMessage?: string;
  fullScreen?: boolean;
  testID?: string;
  /**
   * - grace (default): cute waiting smile + mittens
   * - calm: peaceful closed eyes (session prep)
   */
  emblem?: LoadingEmblem;
};

/**
 * ChristCalm loading — cute Grace bobbing gently (no spinner, no purple orbs).
 */
export function LoadingState({
  message = "Finding peace…",
  slowMessage = "Still gathering — thank you for your patience…",
  fullScreen = true,
  testID = "loading-state",
  emblem = "grace",
}: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [slow, setSlow] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.5);
  const labelOp = useSharedValue(1);

  const source =
    emblem === "calm"
      ? GRACE_CALM
      : isDark
        ? GRACE_WAIT_DARK
        : GRACE_WAIT;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      floatY.value = 0;
      scale.value = 1;
      glow.value = 0.7;
      return;
    }
    opacity.value = withTiming(1, { duration: motion.enterDuration, easing });
    translateY.value = withTiming(0, { duration: motion.enterDuration, easing });
    // Cute gentle bob — like Grace breathing
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.45, { duration: 1300, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [reduceMotion, opacity, translateY, floatY, scale, glow]);

  useEffect(() => {
    if (reduceMotion) return;
    labelOp.value = withSequence(
      withTiming(0.35, { duration: 160 }),
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    );
  }, [slow, reduceMotion, labelOp]);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const emblemStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.65,
    transform: [{ scale: 0.9 + glow.value * 0.2 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOp.value,
  }));

  const label = slow ? slowMessage : message;

  return (
    <View
      style={[
        styles.wrap,
        fullScreen && styles.full,
        { backgroundColor: fullScreen ? colors.background : "transparent" },
      ]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.center, enterStyle]}>
        <View style={styles.emblemStack}>
          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: isDark ? GRACE_SAGE_SOFT : GRACE_PEACH_SOFT,
                shadowColor: GRACE_SAGE,
              },
              glowStyle,
            ]}
          />
          <Animated.View style={[styles.emblemWrap, emblemStyle]}>
            <Image
              source={source}
              style={styles.emblem}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
              accessibilityLabel="Grace is waiting with you"
            />
          </Animated.View>
        </View>
        {label ? (
          <Animated.Text
            key={label}
            style={[
              {
                marginTop: spacing.lg,
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.textSecondary,
                letterSpacing: 0.2,
                textAlign: "center",
                maxWidth: 280,
                lineHeight: 21,
              },
              labelStyle,
            ]}
          >
            {label}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

const SIZE = 120;

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  full: {
    flex: 1,
  },
  center: {
    alignItems: "center",
  },
  emblemStack: {
    width: SIZE + 32,
    height: SIZE + 32,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: SIZE + 24,
    height: SIZE + 24,
    borderRadius: (SIZE + 24) / 2,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  emblemWrap: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: "hidden",
  },
  emblem: {
    width: SIZE,
    height: SIZE,
  },
});
