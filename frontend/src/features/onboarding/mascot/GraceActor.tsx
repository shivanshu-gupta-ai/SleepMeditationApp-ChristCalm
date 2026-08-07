import React, { useEffect, useMemo } from "react";
import {
  AccessibilityInfo,
  Image,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import type { GraceExpression } from "../types";
import {
  MOTION_PROFILES,
  type MotionProfileId,
  type ReactKind,
} from "./motionProfiles";
import { profileForExpression } from "./expressionMap";

const FALLBACK = require("@/assets/images/grace-mascot.png");

export const GRACE_MOOD_ASSETS: Record<GraceExpression | "splash", any> = {
  welcome: require("@/animation/gif/helloanimation1.gif"),
  listening: require("@/animation/gif/bunnythinking.gif"),
  thoughtful: require("@/animation/gif/bunnythinking.gif"),
  heavy: require("@/animation/gif/sadbunny.gif"),
  hopeful: require("@/animation/gif/bunnysmile.gif"),
  committed: require("@/animation/gif/commited.gif"),
  peaceful: require("@/animation/gif/bunnysmile.gif"),
  notification: require("@/animation/gif/notification1.gif"),
  smile: require("@/animation/gif/smile.gif"),
  anxiety: require("@/animation/gif/anxiety.gif"),
  fact: require("@/animation/gif/bunnyfact.gif"),
  thinking: require("@/animation/gif/bunnythinking.gif"),
  splash: require("@/animation/gif/helloanimation1.gif"),
  scripture: require("@/animation/gif/scripture.gif"),
  thinkname: require("@/animation/gif/thinkname.gif"),
  didYouKnow: require("@/animation/gif/didyouknow.gif"),
  preparing: require("@/animation/gif/preparing.gif"),
  seeker: require("@/animation/gif/seeker.gif"),
  tracktospend: require("@/animation/gif/tracktospend.gif"),
  happy1: require("@/animation/gif/happy1.gif"),
  review: require("@/animation/gif/review.gif"),
};

export type GraceActorProps = {
  expression?: GraceExpression | "splash";
  /** Override idle profile; defaults from expression */
  profile?: MotionProfileId;
  size?: number;
  animate?: boolean;
  /** Soft ambient glow behind bunny */
  showGlow?: boolean;
  glowTone?: "primary" | "gold" | "muted" | "warm";
  /** Fire a one-shot reaction (increments to re-trigger) */
  reactToken?: number;
  reactKind?: ReactKind;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Unified Grace mascot actor: expression asset + motion profile + optional react.
 * Respects reduce-motion (static pose + enter fade only).
 */
export function GraceActor({
  expression = "welcome",
  profile: profileProp,
  size = 140,
  animate = true,
  showGlow = true,
  glowTone = "primary",
  reactToken = 0,
  reactKind = "none",
  style,
  testID = "grace-actor",
}: GraceActorProps) {
  const { colors, isDark } = useTheme();
  // Target browser screen display dimension for all mascot GIF files: 396x396 pixels
  const gifSize = 396;
  const profileId = profileProp ?? profileForExpression(expression);
  const profile = MOTION_PROFILES[profileId];
  const src = GRACE_MOOD_ASSETS[expression] ?? FALLBACK;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const bob = useSharedValue(0);
  const scale = useSharedValue(1);
  const sway = useSharedValue(0);
  const glowOp = useSharedValue(profile.glowLo);
  const [reduceMotion, setReduceMotion] = React.useState(false);

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

  // Enter + expression crossfade
  useEffect(() => {
    opacity.value = 0.2;
    translateY.value = 8;
    opacity.value = withTiming(1, { duration: 420, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    translateY.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) });
  }, [expression, opacity, translateY]);

  // Smooth idle loop
  useEffect(() => {
    cancelAnimation(bob);
    cancelAnimation(scale);
    cancelAnimation(sway);
    cancelAnimation(glowOp);

    if (!animate || reduceMotion) {
      bob.value = 0;
      scale.value = 1;
      sway.value = 0;
      glowOp.value = profile.glowLo;
      return;
    }

    const ms = profile.bobMs;
    const smoothEase = Easing.bezier(0.42, 0, 0.58, 1);

    bob.value = withRepeat(
      withSequence(
        withTiming(-profile.bobAmp, { duration: ms, easing: smoothEase }),
        withTiming(0, { duration: ms, easing: smoothEase })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(profile.scaleHi, { duration: ms, easing: smoothEase }),
        withTiming(profile.scaleLo, { duration: ms, easing: smoothEase })
      ),
      -1,
      false
    );
    if (profile.swayAmp > 0) {
      sway.value = withRepeat(
        withSequence(
          withTiming(profile.swayAmp, { duration: ms * 1.1, easing: smoothEase }),
          withTiming(-profile.swayAmp, { duration: ms * 1.1, easing: smoothEase })
        ),
        -1,
        true
      );
    } else {
      sway.value = 0;
    }
    glowOp.value = withRepeat(
      withSequence(
        withTiming(profile.glowHi, { duration: ms, easing: smoothEase }),
        withTiming(profile.glowLo, { duration: ms, easing: smoothEase })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(bob);
      cancelAnimation(scale);
      cancelAnimation(sway);
      cancelAnimation(glowOp);
    };
  }, [animate, reduceMotion, profile, bob, scale, sway, glowOp]);

  // One-shot react
  useEffect(() => {
    if (!reactToken || reactKind === "none" || reduceMotion || !animate) return;

    const run = () => {
      if (reactKind === "nod") {
        bob.value = withSequence(
          withTiming(-14, { duration: 140 }),
          withSpring(0, { damping: 12, stiffness: 180 })
        );
        scale.value = withSequence(
          withTiming(0.96, { duration: 120 }),
          withSpring(1, { damping: 14, stiffness: 200 })
        );
      } else if (reactKind === "lean") {
        sway.value = withSequence(
          withTiming(10, { duration: 220 }),
          withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) })
        );
      } else if (reactKind === "celebrate") {
        scale.value = withSequence(
          withTiming(1.08, { duration: 160 }),
          withSpring(1, { damping: 10, stiffness: 160 })
        );
        bob.value = withSequence(
          withTiming(-16, { duration: 160 }),
          withSpring(0, { damping: 12, stiffness: 170 })
        );
        glowOp.value = withSequence(
          withTiming(0.85, { duration: 200 }),
          withTiming(profile.glowLo, { duration: 400 })
        );
      } else if (reactKind === "exhale") {
        scale.value = withSequence(
          withTiming(0.96, { duration: 280 }),
          withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })
        );
      }
    };

    // Welcome wave slightly delayed
    if (reactKind === "celebrate") {
      const t = setTimeout(run, 600);
      return () => clearTimeout(t);
    }
    run();
  }, [reactToken, reactKind, reduceMotion, animate, bob, scale, sway, glowOp, profile.glowLo]);

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
      { translateY: translateY.value + bob.value },
      { translateX: sway.value },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    // Soft brand wash only — never a solid dark plate behind Grace
    opacity: showGlow ? glowOp.value * (isDark ? 0.35 : 0.22) : 0,
    transform: [{ scale: 0.95 + glowOp.value * 0.12 }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: gifSize + 24,
          height: gifSize + 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        },
        glow: {
          position: "absolute",
          width: gifSize * 0.85,
          height: gifSize * 0.85,
          borderRadius: gifSize,
          backgroundColor: glowColor,
        },
        img: {
          width: gifSize,
          height: gifSize,
          backgroundColor: "transparent",
        },
      }),
    [gifSize, glowColor]
  );

  return (
    <View
      style={[styles.wrap, style]}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="ChristCalm companion Grace"
    >
      {showGlow ? <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" /> : null}
      <Animated.View style={actorStyle}>
        <Image source={src} style={styles.img} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

export default GraceActor;
