import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GRACE_DISPLAY } from "../mascot/graceAssets";

/**
 * Interactive intensity mascot (0–10).
 * Every integer score has a distinct emotional state and its own visual asset.
 */

export type IntensityVisual =
  | "0-peaceful"
  | "1-calm"
  | "2-light"
  | "3-uneasy"
  | "4-strained"
  | "5-manageable"
  | "6-heavy"
  | "7-burdened"
  | "8-very-heavy"
  | "9-overwhelmed"
  | "10-breaking-point";

export type IntensityState = {
  score: number;
  label: string;
  visual: IntensityVisual;
};

const INTENSITY_ASSETS: Record<IntensityVisual, number> = {
  "0-peaceful": require("@/assets/images/onboarding/intensity/0-peaceful.png"),
  "1-calm": require("@/assets/images/onboarding/intensity/1-calm.png"),
  "2-light": require("@/assets/images/onboarding/intensity/2-light.png"),
  "3-uneasy": require("@/assets/images/onboarding/intensity/3-uneasy.png"),
  "4-strained": require("@/assets/images/onboarding/intensity/4-strained.png"),
  "5-manageable": require("@/assets/images/onboarding/intensity/5-manageable.png"),
  "6-heavy": require("@/assets/images/onboarding/intensity/6-heavy.png"),
  "7-burdened": require("@/assets/images/onboarding/intensity/7-burdened.png"),
  "8-very-heavy": require("@/assets/images/onboarding/intensity/8-very-heavy.png"),
  "9-overwhelmed": require("@/assets/images/onboarding/intensity/9-overwhelmed.png"),
  "10-breaking-point": require("@/assets/images/onboarding/intensity/10-breaking-point.png"),
};

const INTENSITY_STATES: readonly IntensityState[] = [
  { score: 0, label: "Peaceful", visual: "0-peaceful" },
  { score: 1, label: "Calm", visual: "1-calm" },
  { score: 2, label: "Light", visual: "2-light" },
  { score: 3, label: "Uneasy", visual: "3-uneasy" },
  { score: 4, label: "Strained", visual: "4-strained" },
  { score: 5, label: "Manageable", visual: "5-manageable" },
  { score: 6, label: "Heavy", visual: "6-heavy" },
  { score: 7, label: "Burdened", visual: "7-burdened" },
  { score: 8, label: "Very heavy", visual: "8-very-heavy" },
  { score: 9, label: "Overwhelmed", visual: "9-overwhelmed" },
  { score: 10, label: "Breaking point", visual: "10-breaking-point" },
];

export function intensityStateFromValue(value: number): IntensityState {
  const score = Math.min(10, Math.max(0, Math.round(value)));
  return INTENSITY_STATES[score];
}

export function intensityLabel(value: number): string {
  return intensityStateFromValue(value).label;
}

type Props = {
  value: number;
  size?: number;
  testID?: string;
};

export function IntensityMascot({ value, size = GRACE_DISPLAY.stage, testID = "intensity-mascot" }: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();
  const state = intensityStateFromValue(value);
  const severity = state.score / 10;

  const bob = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.35)).current;
  const previousScore = useRef(state.score);

  // Crossfade whenever the exact score changes.
  useEffect(() => {
    if (previousScore.current === state.score) return;
    previousScore.current = state.score;
    fade.setValue(0.35);
    Animated.timing(fade, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [state.score, fade]);

  // Motion continuously follows the exact score: lighter = bouncy calm;
  // heavier = slow sink.
  useEffect(() => {
    bob.stopAnimation();
    scale.stopAnimation();
    glow.stopAnimation();

    const bobAmp = -10 + severity * 7;
    const bobMs = 900 + severity * 900;
    const scaleLo = 1 - severity * 0.04;
    const scaleHi = 1.04 - severity * 0.04;
    const glowLo = 0.4 - severity * 0.25;
    const glowHi = 0.7 - severity * 0.35;

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: bobAmp,
          duration: bobMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: bobMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: scaleHi,
          duration: bobMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: scaleLo,
          duration: bobMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: glowHi,
          duration: bobMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: glowLo,
          duration: bobMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    bobLoop.start();
    scaleLoop.start();
    glowLoop.start();
    return () => {
      bobLoop.stop();
      scaleLoop.stop();
      glowLoop.stop();
    };
  }, [severity, bob, scale, glow]);

  const glowColor =
    state.score <= 2
      ? colors.primary
      : state.score <= 4
        ? colors.primary
        : state.score <= 6
          ? isDark
            ? "#E8C06E"
            : "#D4A84A"
          : isDark
            ? "#E89B6E"
            : "#D4784A";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: "center",
          justifyContent: "center",
          minHeight: size + 48,
        },
        stage: {
          width: size + 40,
          height: size + 40,
          alignItems: "center",
          justifyContent: "center",
        },
        glow: {
          position: "absolute",
          width: size + 24,
          height: size + 24,
          borderRadius: (size + 24) / 2,
          backgroundColor: glowColor,
        },
        img: {
          width: size,
          height: size,
        },
        label: {
          fontFamily: fonts.bodyBold,
          fontSize: 17,
          color:
            state.score >= 7
              ? isDark
                ? "#E89B6E"
                : "#C45C3A"
              : colors.primary,
          marginTop: spacing.sm,
          letterSpacing: -0.2,
        },
      }),
    [size, fonts, spacing, colors, state.score, isDark, glowColor]
  );

  return (
    <View
      style={styles.wrap}
      testID={testID}
      accessibilityLabel={`Mascot feeling ${state.label}, intensity ${state.score} out of 10`}
    >
      <View style={styles.stage}>
        <Animated.View style={[styles.glow, { opacity: glow }]} pointerEvents="none" />
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: bob }, { scale }],
          }}
        >
          <Image
            source={INTENSITY_ASSETS[state.visual]}
            style={styles.img}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      <Text style={styles.label}>{state.label}</Text>
    </View>
  );
}

export default IntensityMascot;
