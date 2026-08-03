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

/**
 * Interactive intensity mascot (0–10).
 * Bands drive expression + motion:
 *  0–2  light / calm
 *  2–4  mild weight
 *  4–6  moderate
 *  6–8  heavy
 *  8–10 overwhelmed
 */

export type IntensityBand = "light" | "mild" | "moderate" | "heavy" | "overwhelmed";

const INTENSITY_ASSETS: Record<IntensityBand, number> = {
  light: require("@/assets/images/onboarding/intensity/light.png"),
  mild: require("@/assets/images/onboarding/intensity/mild.png"),
  moderate: require("@/assets/images/onboarding/intensity/moderate.png"),
  heavy: require("@/assets/images/onboarding/intensity/heavy.png"),
  overwhelmed: require("@/assets/images/onboarding/intensity/overwhelmed.png"),
};

export function intensityBandFromValue(value: number): IntensityBand {
  if (value <= 2) return "light";
  if (value <= 4) return "mild";
  if (value <= 6) return "moderate";
  if (value <= 8) return "heavy";
  return "overwhelmed";
}

export function intensityLabel(value: number): string {
  if (value <= 2) return "Light";
  if (value <= 4) return "A little heavy";
  if (value <= 6) return "Manageable";
  if (value <= 8) return "Heavy";
  return "Overwhelming";
}

type Props = {
  value: number;
  size?: number;
  testID?: string;
};

export function IntensityMascot({ value, size = 160, testID = "intensity-mascot" }: Props) {
  const { colors, fonts, spacing, isDark } = useTheme();
  const band = intensityBandFromValue(value);
  const label = intensityLabel(value);

  const bob = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.35)).current;
  const prevBand = useRef(band);

  // Crossfade when band changes
  useEffect(() => {
    if (prevBand.current === band) return;
    prevBand.current = band;
    fade.setValue(0.35);
    Animated.timing(fade, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [band, fade]);

  // Motion profile by band — lighter = bouncy calm; heavier = slow sink
  useEffect(() => {
    bob.stopAnimation();
    scale.stopAnimation();
    glow.stopAnimation();

    const light = band === "light" || band === "mild";
    const heavy = band === "heavy" || band === "overwhelmed";

    const bobAmp = light ? -10 : heavy ? -3 : -6;
    const bobMs = light ? 900 : heavy ? 1800 : 1300;
    const scaleLo = light ? 1 : heavy ? 0.96 : 0.98;
    const scaleHi = light ? 1.04 : heavy ? 1.0 : 1.02;
    const glowLo = light ? 0.4 : heavy ? 0.15 : 0.28;
    const glowHi = light ? 0.7 : heavy ? 0.35 : 0.5;

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
  }, [band, bob, scale, glow]);

  const glowColor =
    band === "light"
      ? colors.primary
      : band === "mild"
        ? colors.primary
        : band === "moderate"
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
            band === "heavy" || band === "overwhelmed"
              ? isDark
                ? "#E89B6E"
                : "#C45C3A"
              : colors.primary,
          marginTop: spacing.sm,
          letterSpacing: -0.2,
        },
      }),
    [size, fonts, spacing, colors, band, isDark, glowColor]
  );

  return (
    <View style={styles.wrap} testID={testID} accessibilityLabel={`Mascot feeling ${label}`}>
      <View style={styles.stage}>
        <Animated.View style={[styles.glow, { opacity: glow }]} pointerEvents="none" />
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: bob }, { scale }],
          }}
        >
          <Image
            source={INTENSITY_ASSETS[band]}
            style={styles.img}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default IntensityMascot;
