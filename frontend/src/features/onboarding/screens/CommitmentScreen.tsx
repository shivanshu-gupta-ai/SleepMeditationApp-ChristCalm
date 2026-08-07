import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { GraceMoodImage } from "../components/GraceMoodImage";
import { useOnboarding } from "../OnboardingContext";
import { COMMITMENT_COPY } from "../copy";
import { playHaptic } from "@/src/utils/haptics";

const HOLD_MS = 1600;

/**
 * Screen 21 — Commitment Ritual
 * Hold-to-commit builds soft light + lifts Grace; persists commitment in draft.
 * Footer Continue unlocks only after commitmentAccepted (canProceed).
 */
export function CommitmentScreen() {
  const { draft, patch } = useOnboarding();
  const { colors, fonts, spacing, radius, shadows, isDark } = useTheme();

  const [holding, setHolding] = useState(false);
  const [celebrateToken, setCelebrateToken] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.2)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const done = draft.commitmentAccepted;

  useEffect(() => {
    if (done) {
      progress.setValue(1);
      rise.setValue(1);
      glow.setValue(0.55);
    }
  }, [done, progress, rise, glow]);

  const complete = useCallback(() => {
    void playHaptic("success");
    patch({
      commitmentAccepted: true,
      commitmentDate: new Date().toISOString(),
    });
    setCelebrateToken((t) => t + 1);
    setHolding(false);
  }, [patch]);

  const startHold = useCallback(() => {
    if (done) return;
    setHolding(true);
    void playHaptic("light");
    progress.setValue(0);
    animRef.current?.stop();

    const anim = Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: HOLD_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(rise, {
        toValue: 1,
        duration: HOLD_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: 0.65,
        duration: HOLD_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) complete();
    });
  }, [done, progress, rise, glow, complete]);

  const cancelHold = useCallback(() => {
    if (done) return;
    setHolding(false);
    animRef.current?.stop();
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: 0.2,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [done, progress, rise, glow]);

  const graceLift = {
    transform: [
      {
        translateY: rise.interpolate({
          inputRange: [0, 1],
          outputRange: [12, -16],
        }),
      },
    ],
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          alignItems: "center",
          justifyContent: "center",
        },
        graceStage: {
          width: 180,
          height: 180,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
        },
        glow: {
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: isDark ? colors.primary : colors.primarySoft,
        },
        title: {
          fontFamily: fonts.headingBold,
          fontSize: 26,
          lineHeight: 34,
          letterSpacing: -0.5,
          color: colors.textPrimary,
          textAlign: "center",
          marginBottom: spacing.sm,
        },
        instruction: {
          fontFamily: fonts.body,
          fontSize: 16,
          lineHeight: 24,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: spacing.xl,
          maxWidth: 300,
        },
        holdOuter: {
          width: "100%",
          maxWidth: 300,
          height: 58,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.primary,
          overflow: "hidden",
          justifyContent: "center",
          ...shadows.soft,
        },
        holdOuterDone: {
          backgroundColor: colors.primarySoft,
          borderColor: colors.primary,
        },
        holdFill: {
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: colors.primary,
        },
        holdLabel: {
          fontFamily: fonts.bodyBold,
          fontSize: 16,
          textAlign: "center",
          color: colors.primary,
          zIndex: 1,
        },
        holdLabelOnFill: {
          color: colors.textOnPrimary,
        },
      }),
    [colors, fonts, spacing, radius, shadows, isDark]
  );

  return (
    <View style={styles.root} testID="onboarding-screen-commitment">
      <View style={styles.graceStage}>
        <Animated.View style={[styles.glow, { opacity: glow }]} pointerEvents="none" />
        <Animated.View style={graceLift}>
          <GraceMoodImage
            mood="committed"
            profile={done ? "idleCelebrate" : "idleCalm"}
            showGlow={false}
            reactToken={celebrateToken}
            reactKind="celebrate"
            size={128}
            testID="grace-commitment"
          />
        </Animated.View>
      </View>

      <Text style={styles.title}>
        {done ? COMMITMENT_COPY.doneTitle : COMMITMENT_COPY.title}
      </Text>
      <Text style={styles.instruction}>
        {done
          ? COMMITMENT_COPY.doneSub
          : holding
            ? COMMITMENT_COPY.holding
            : COMMITMENT_COPY.instruction}
      </Text>

      {!done ? (
        <Pressable
          onPressIn={startHold}
          onPressOut={cancelHold}
          style={styles.holdOuter}
          testID="onboarding-commit-hold"
          accessibilityRole="button"
          accessibilityLabel={COMMITMENT_COPY.holdLabel}
          accessibilityHint="Press and hold to complete your commitment"
        >
          <Animated.View
            style={[
              styles.holdFill,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
          <Text style={[styles.holdLabel, holding && styles.holdLabelOnFill]}>
            {holding ? COMMITMENT_COPY.holding : COMMITMENT_COPY.holdLabel}
          </Text>
        </Pressable>
      ) : (
        <View
          style={[styles.holdOuter, styles.holdOuterDone]}
          accessibilityRole="text"
          accessibilityLabel={COMMITMENT_COPY.doneTitle}
        >
          <Text style={styles.holdLabel}>✓ {COMMITMENT_COPY.doneTitle}</Text>
        </View>
      )}
    </View>
  );
}

export default CommitmentScreen;
