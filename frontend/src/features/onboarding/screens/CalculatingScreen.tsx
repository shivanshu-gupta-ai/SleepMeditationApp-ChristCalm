import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { useOnboarding } from "../OnboardingContext";
import { CALCULATING_STEPS } from "../copy";
import { deriveSpiritualProfile } from "../deriveProfile";

/**
 * Screen 14 — Calculating Insights
 * Three sequential progress bars, then auto-advance (context timer).
 * Derives and stores profileType before reveal.
 */
export function CalculatingScreen() {
  const { draft, patch } = useOnboarding();
  const { colors, fonts, spacing, radius } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const fills = useRef(CALCULATING_STEPS.map(() => new Animated.Value(0))).current;

  // Persist derived profile once when this screen mounts
  useEffect(() => {
    const profile = deriveSpiritualProfile(draft);
    patch({ profileType: profile.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on enter
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < CALCULATING_STEPS.length; i++) {
        if (cancelled) return;
        setActiveStep(i);
        fills[i].setValue(0);
        await new Promise<void>((resolve) => {
          Animated.timing(fills[i], {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished) resolve();
            else resolve();
          });
        });
        // brief hold between steps
        await new Promise((r) => setTimeout(r, 180));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [fills]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 22,
          lineHeight: 30,
          color: colors.textPrimary,
          textAlign: "center",
          marginTop: spacing.lg,
          marginBottom: spacing.xl,
          letterSpacing: -0.4,
        },
        bars: { width: "100%", maxWidth: 340, gap: spacing.md },
        barBlock: { width: "100%" },
        label: {
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 8,
        },
        labelActive: {
          color: colors.textPrimary,
          fontFamily: fonts.bodyMedium,
        },
        track: {
          height: 8,
          borderRadius: radius.full,
          backgroundColor: colors.borderSoft,
          overflow: "hidden",
        },
        fill: {
          height: "100%",
          borderRadius: radius.full,
          backgroundColor: colors.primary,
        },
      }),
    [colors, fonts, spacing, radius]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-calculating">
      <GraceMoodImage mood="thoughtful" size={130} testID="grace-calculating" />
      <Text style={styles.title}>Preparing…</Text>
      <View style={styles.bars}>
        {CALCULATING_STEPS.map((label, i) => (
          <View key={label} style={styles.barBlock}>
            <Text style={[styles.label, i <= activeStep && styles.labelActive]}>{label}</Text>
            <View style={styles.track}>
              <Animated.View
                style={[
                  styles.fill,
                  {
                    width: fills[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default CalculatingScreen;
