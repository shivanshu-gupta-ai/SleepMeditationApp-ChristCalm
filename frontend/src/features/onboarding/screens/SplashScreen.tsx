import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";

/** Screen 0 — Splash: Grace + glow only. No text. */
export function SplashScreen() {
  const { colors, isDark } = useTheme();
  const glow = useSharedValue(0.25);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.25, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.9 + glow.value * 0.25 }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, alignItems: "center", justifyContent: "center" },
        glow: {
          position: "absolute",
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: isDark ? colors.primary : colors.primarySoft,
        },
      }),
    [colors, isDark]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-splash" accessibilityLabel="ChristCalm">
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
      <GraceMoodImage
        mood="splash"
        profile="idleCalm"
        glowTone="gold"
        size={180}
        testID="grace-splash"
      />
    </View>
  );
}

export default SplashScreen;
