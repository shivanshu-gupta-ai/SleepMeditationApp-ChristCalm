import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "./GraceMoodImage";
import type { GraceExpression } from "../types";
import type { MotionProfileId, ReactKind } from "../mascot/motionProfiles";
import { GRACE_DISPLAY } from "../mascot/graceAssets";

export type IntroVisualVariant = "welcome" | "noise" | "scripture" | "personal";

type Props = {
  variant: IntroVisualVariant;
  testID?: string;
};

const MOOD: Record<IntroVisualVariant, GraceExpression | "splash"> = {
  welcome: "welcome",
  noise: "notification",
  scripture: "scripture",
  personal: "anxiety",
};

const PROFILE: Record<IntroVisualVariant, MotionProfileId> = {
  welcome: "idleWave",
  noise: "idleCalm",
  scripture: "idleThink",
  personal: "idleHopeful",
};

const ENTER: Record<IntroVisualVariant, ReactKind> = {
  welcome: "celebrate",
  noise: "exhale",
  scripture: "none",
  personal: "none",
};

const GLOW: Record<IntroVisualVariant, "primary" | "gold" | "muted" | "warm"> = {
  welcome: "gold",
  noise: "primary",
  scripture: "gold",
  personal: "primary",
};

/**
 * Large upper visual for intro carousel — Grace + ambient composition.
 * Uses existing tokens/mascot only (no new design system).
 */
export function IntroVisual({ variant, testID }: Props) {
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();
  const floatA = useSharedValue(0);
  const floatB = useSharedValue(0);
  const glow = useSharedValue(0.35);
  const dissolve = useSharedValue(1);

  useEffect(() => {
    floatA.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    floatB.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    if (variant === "noise") {
      dissolve.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.7, { duration: 1400, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      dissolve.value = 1;
    }
  }, [variant, floatA, floatB, glow, dissolve]);

  const floatAStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatA.value }],
  }));
  const floatBStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatB.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.92 + glow.value * 0.2 }],
  }));
  const dissolveStyle = useAnimatedStyle(() => ({
    opacity: dissolve.value,
  }));

  // Soft palette accents from brand: lavender, sage, gold, warm neutrals
  const sage = isDark ? "rgba(91, 168, 143, 0.22)" : "rgba(91, 168, 143, 0.18)";
  const softBlue = isDark ? "rgba(124, 111, 224, 0.2)" : "rgba(124, 111, 224, 0.14)";
  const softGold = isDark ? "rgba(201, 162, 39, 0.22)" : "rgba(201, 162, 39, 0.2)";

  return (
    <View style={styles.root} testID={testID}>
      {/* Ambient garden / light discs */}
      <View
        style={[
          styles.orb,
          {
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: softBlue,
            top: "8%",
            alignSelf: "center",
          },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.orb,
          {
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: sage,
            top: "18%",
            left: "6%",
          },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.orb,
          {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: softGold,
            top: "22%",
            right: "8%",
          },
        ]}
        pointerEvents="none"
      />

      {variant === "welcome" ? (
        <Animated.View style={[styles.centerGlow, glowStyle, { backgroundColor: colors.premiumSoft }]} />
      ) : null}

      {variant === "scripture" ? (
        <Animated.View
          style={[
            styles.bibleBadge,
            floatBStyle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSoft,
              ...shadows.soft,
            },
          ]}
        >
          <View
            style={[
              styles.bibleGlow,
              { backgroundColor: isDark ? colors.premiumSoft : "rgba(201, 162, 39, 0.28)" },
            ]}
          />
          <Ionicons name="book-outline" size={28} color={colors.premium} />
        </Animated.View>
      ) : null}

      {variant === "noise" ? (
        <Animated.View style={[styles.noiseLayer, dissolveStyle]} pointerEvents="none">
          {[
            { top: "12%", left: "8%", icon: "notifications-outline" as const, rot: -8 },
            { top: "18%", right: "10%", icon: "mail-outline" as const, rot: 6 },
            { top: "42%", left: "4%", icon: "chatbubble-outline" as const, rot: -4 },
            { top: "48%", right: "6%", icon: "alert-circle-outline" as const, rot: 10 },
          ].map((n, i) => (
            <View
              key={i}
              style={[
                styles.noiseChip,
                {
                  top: n.top as any,
                  left: n.left as any,
                  right: n.right as any,
                  transform: [{ rotate: `${n.rot}deg` }],
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSoft,
                  ...shadows.soft,
                },
              ]}
            >
              <Ionicons name={n.icon} size={16} color={colors.textMuted} />
              <View style={[styles.noiseLine, { backgroundColor: colors.borderSoft }]} />
              <View
                style={[
                  styles.noiseLine,
                  { width: 28, backgroundColor: colors.borderSoft, opacity: 0.7 },
                ]}
              />
            </View>
          ))}
          {/* Tangled soft lines */}
          <View style={[styles.tangle, { borderColor: colors.primary + "33", top: "30%", left: "20%" }]} />
          <View style={[styles.tangle, { borderColor: colors.textMuted + "40", top: "36%", right: "18%", width: 70 }]} />
        </Animated.View>
      ) : null}

      {variant === "personal" ? (
        <>
          <Animated.View
            style={[
              styles.floatCard,
              floatAStyle,
              {
                top: "14%",
                left: "6%",
                backgroundColor: colors.surface,
                borderColor: colors.borderSoft,
                ...shadows.soft,
              },
            ]}
          >
            <Ionicons name="water-outline" size={14} color={colors.primary} />
            <Text style={[styles.floatLabel, { fontFamily: fonts.bodyMedium, color: colors.textPrimary }]}>
              Anxiety
            </Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.floatCard,
              floatBStyle,
              {
                top: "20%",
                right: "4%",
                backgroundColor: colors.surface,
                borderColor: colors.borderSoft,
                ...shadows.soft,
              },
            ]}
          >
            <Ionicons name="book-outline" size={14} color={colors.premium} />
            <Text style={[styles.floatLabel, { fontFamily: fonts.bodyMedium, color: colors.textPrimary }]}>
              Daily Scripture
            </Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.floatCard,
              floatAStyle,
              {
                bottom: "12%",
                right: "10%",
                backgroundColor: colors.surface,
                borderColor: colors.borderSoft,
                ...shadows.soft,
              },
            ]}
          >
            <Ionicons name="moon-outline" size={14} color={colors.primary} />
            <Text style={[styles.floatLabel, { fontFamily: fonts.bodyMedium, color: colors.textPrimary }]}>
              Sleep
            </Text>
          </Animated.View>
        </>
      ) : null}

      <View style={styles.graceWrap}>
        <GraceMoodImage
          mood={MOOD[variant]}
          profile={PROFILE[variant]}
          glowTone={GLOW[variant]}
          enterReact={ENTER[variant]}
          size={variant === "welcome" ? GRACE_DISPLAY.hero : GRACE_DISPLAY.roomy}
          testID={`${testID}-grace`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
  },
  centerGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  graceWrap: {
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  bibleBadge: {
    position: "absolute",
    bottom: "14%",
    right: "12%",
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    zIndex: 3,
    overflow: "hidden",
  },
  bibleGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  noiseLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  noiseChip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  noiseLine: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  tangle: {
    position: "absolute",
    width: 90,
    height: 40,
    borderWidth: 1.5,
    borderRadius: 20,
    borderStyle: "dashed",
  },
  floatCard: {
    position: "absolute",
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  floatLabel: {
    fontSize: 12,
  },
});

export default IntroVisual;
