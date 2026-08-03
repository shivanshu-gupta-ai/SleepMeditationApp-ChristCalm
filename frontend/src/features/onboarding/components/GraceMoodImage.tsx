import React, { useEffect, useMemo, useRef } from "react";
import {
  Image,
  View,
  StyleSheet,
  Animated,
  Easing,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import type { GraceExpression } from "../types";

/**
 * ChristCalm bunny mascot moods (transparent PNG cutouts).
 * Gentle idle bob for interactive feel.
 */

const FALLBACK = require("@/assets/images/grace-mascot.png");

const MOOD_ASSETS: Record<GraceExpression | "splash", number> = {
  welcome: require("@/assets/images/onboarding/grace-welcome.png"),
  listening: require("@/assets/images/onboarding/grace-listening.png"),
  thoughtful: require("@/assets/images/onboarding/grace-thoughtful.png"),
  heavy: require("@/assets/images/onboarding/grace-heavy.png"),
  hopeful: require("@/assets/images/onboarding/grace-hopeful.png"),
  committed: require("@/assets/images/onboarding/grace-committed.png"),
  peaceful: require("@/assets/images/onboarding/grace-peaceful.png"),
  splash: require("@/assets/images/onboarding/grace-splash.png"),
};

export type GraceMoodImageProps = {
  mood?: GraceExpression | "splash";
  size?: number;
  /** Soft continuous bob animation */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function GraceMoodImage({
  mood = "welcome",
  size = 140,
  animate = true,
  style,
  testID = "grace-mood",
}: GraceMoodImageProps) {
  const { colors, shadows, isDark } = useTheme();
  const src = MOOD_ASSETS[mood] ?? FALLBACK;
  const bob = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const prevMood = useRef(mood);

  useEffect(() => {
    if (prevMood.current !== mood) {
      prevMood.current = mood;
      fade.setValue(0.4);
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [mood, fade]);

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -8,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animate, bob]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: size + 16,
          height: size + 16,
          alignItems: "center",
          justifyContent: "center",
        },
        img: {
          width: size,
          height: size,
        },
      }),
    [size]
  );

  return (
    <View
      style={[styles.wrap, style]}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="ChristCalm mascot"
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: bob }] }}>
        <Image source={src} style={styles.img} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

export default GraceMoodImage;
