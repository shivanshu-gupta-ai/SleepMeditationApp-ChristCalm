import React, { useMemo } from "react";
import { Image, View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import type { GraceExpression } from "../types";

/**
 * Soft 3D / cinematic Grace illustrations (Imagine-generated).
 * Falls back to classic companion still if a mood asset is missing.
 */

const FALLBACK = require("@/assets/images/grace/companion.jpg");

const MOOD_ASSETS: Partial<Record<GraceExpression | "splash" | "benefit", number>> = {
  welcome: require("@/assets/images/onboarding/grace-welcome.jpg"),
  listening: require("@/assets/images/onboarding/grace-listening.jpg"),
  thoughtful: require("@/assets/images/onboarding/grace-thoughtful.jpg"),
  heavy: require("@/assets/images/onboarding/grace-heavy.jpg"),
  hopeful: require("@/assets/images/onboarding/grace-hopeful.jpg"),
  committed: require("@/assets/images/onboarding/grace-committed.jpg"),
  peaceful: require("@/assets/images/onboarding/grace-peaceful.jpg"),
  splash: require("@/assets/images/onboarding/grace-splash.jpg"),
};

export type GraceMoodImageProps = {
  mood?: GraceExpression | "splash";
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function GraceMoodImage({
  mood = "welcome",
  size = 140,
  style,
  testID = "grace-mood",
}: GraceMoodImageProps) {
  const { colors, shadows, isDark } = useTheme();
  const src = MOOD_ASSETS[mood] ?? FALLBACK;
  const r = size / 2;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: size + 12,
          height: size + 12,
          alignItems: "center",
          justifyContent: "center",
        },
        ring: {
          width: size,
          height: size,
          borderRadius: r,
          overflow: "hidden",
          backgroundColor: isDark ? colors.surface : colors.primarySoft,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.soft,
        },
        img: {
          width: size,
          height: size,
        },
      }),
    [size, r, colors, shadows, isDark]
  );

  return (
    <View style={[styles.wrap, style]} testID={testID} accessibilityRole="image" accessibilityLabel="Grace">
      <View style={styles.ring}>
        <Image source={src} style={styles.img} resizeMode="cover" />
      </View>
    </View>
  );
}

export default GraceMoodImage;
