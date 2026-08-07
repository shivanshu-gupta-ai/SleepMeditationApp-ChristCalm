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
import {
  GRACE_PNG_FALLBACKS,
  graceGifSource,
  type GraceMoodKey,
} from "./graceAssets";

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
 * Unified Grace mascot actor: S3 GIF (when network OK) + local PNG fallback,
 * motion profile, optional react. Respects reduce-motion (static PNG + enter fade).
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
  const profileId = profileProp ?? profileForExpression(expression);
  const profile = MOTION_PROFILES[profileId];
  const mood = expression as GraceMoodKey;
  const pngFallback = GRACE_PNG_FALLBACKS[mood] ?? GRACE_PNG_FALLBACKS.welcome;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const bob = useSharedValue(0);
  const scale = useSharedValue(1);
  const sway = useSharedValue(0);
  const glowOp = useSharedValue(profile.glowLo);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);

  useEffect(() => {
    setGifFailed(false);
  }, [mood]);

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
    opacity.value = 0.35;
    translateY.value = 10;
    opacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) });
  }, [expression, opacity, translateY]);

  // Idle loop (subtle — GIF already animates when loaded)
  useEffect(() => {
    cancelAnimation(bob);
    cancelAnimation(scale);
    cancelAnimation(sway);
    cancelAnimation(glowOp);

    // Static PNG only when reduce-motion, GIF failed, or animation disabled
    if (!animate || reduceMotion || gifFailed) {
      bob.value = 0;
      scale.value = 1;
      sway.value = 0;
      glowOp.value = profile.glowLo;
      return;
    }

    const ms = profile.bobMs;
    // Lighter bob when GIF plays so motion isn't doubled aggressively
    const bobAmp = profile.bobAmp * 0.55;
    bob.value = withRepeat(
      withSequence(
        withTiming(-bobAmp, { duration: ms, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: ms, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(profile.scaleHi, { duration: ms, easing: Easing.inOut(Easing.sin) }),
        withTiming(profile.scaleLo, { duration: ms, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    if (profile.swayAmp > 0) {
      sway.value = withRepeat(
        withSequence(
          withTiming(profile.swayAmp * 0.6, {
            duration: ms * 1.1,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-profile.swayAmp * 0.6, {
            duration: ms * 1.1,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      );
    } else {
      sway.value = 0;
    }
    glowOp.value = withRepeat(
      withSequence(
        withTiming(profile.glowHi, { duration: ms, easing: Easing.inOut(Easing.sin) }),
        withTiming(profile.glowLo, { duration: ms, easing: Easing.inOut(Easing.sin) })
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
  }, [animate, reduceMotion, gifFailed, profile, bob, scale, sway, glowOp]);

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
    opacity: showGlow ? glowOp.value * (isDark ? 0.35 : 0.22) : 0,
    transform: [{ scale: 0.95 + glowOp.value * 0.12 }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: size + 24,
          height: size + 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        },
        glow: {
          position: "absolute",
          width: size * 0.85,
          height: size * 0.85,
          borderRadius: size,
          backgroundColor: glowColor,
        },
        img: {
          width: size,
          height: size,
          backgroundColor: "transparent",
        },
      }),
    [size, glowColor]
  );

  // reduce-motion or failed GIF → static PNG only
  const useRemoteGif = !reduceMotion && !gifFailed;
  const source = useRemoteGif ? graceGifSource(mood) : pngFallback;

  return (
    <View
      style={[styles.wrap, style]}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="ChristCalm companion Grace"
    >
      {showGlow ? <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" /> : null}
      <Animated.View style={actorStyle}>
        <Image
          source={source}
          style={styles.img}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={200}
          // Show PNG immediately while GIF downloads
          placeholder={pngFallback}
          onError={() => setGifFailed(true)}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
}

export default GraceActor;
