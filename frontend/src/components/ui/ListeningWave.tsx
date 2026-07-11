import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  /** Show the listening wave UI */
  active: boolean;
  /** Optional label override */
  label?: string;
  compact?: boolean;
};

const BAR_COUNT = 5;
const BAR_DELAYS = [0, 80, 160, 240, 120];
const BAR_PEAKS = [0.45, 0.85, 1, 0.7, 0.5];

function WaveBar({
  index,
  active,
  color,
  maxH,
}: {
  index: number;
  active: boolean;
  color: string;
  maxH: number;
}) {
  const h = useSharedValue(0.22);

  useEffect(() => {
    if (active) {
      const peak = BAR_PEAKS[index] ?? 0.7;
      h.value = withDelay(
        BAR_DELAYS[index] ?? 0,
        withRepeat(
          withSequence(
            withTiming(peak, {
              duration: 320 + index * 40,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(0.2 + (index % 3) * 0.08, {
              duration: 280 + index * 30,
              easing: Easing.inOut(Easing.sin),
            })
          ),
          -1,
          true
        )
      );
    } else {
      cancelAnimation(h);
      h.value = withTiming(0.18, { duration: 200 });
    }
  }, [active, h, index]);

  const style = useAnimatedStyle(() => ({
    height: Math.max(4, h.value * maxH),
    opacity: 0.55 + h.value * 0.45,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 4,
          borderRadius: 2,
          backgroundColor: color,
          minHeight: 4,
        },
        style,
      ]}
    />
  );
}

/**
 * Calm equalizer-style “Listening” animation for voice capture.
 * Not a spinner — feels like the app is hearing you.
 */
export function ListeningWave({
  active,
  label = "Listening",
  compact = false,
}: Props) {
  const { colors, fonts } = useTheme();
  const glow = useSharedValue(0);

  useEffect(() => {
    if (active) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(glow);
      glow.value = withTiming(0, { duration: 200 });
    }
  }, [active, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + glow.value * 0.25,
    transform: [{ scale: 0.92 + glow.value * 0.1 }],
  }));

  if (!active) return null;

  const maxH = compact ? 18 : 26;

  return (
    <View
      style={[styles.row, compact && styles.rowCompact]}
      accessibilityLiveRegion="polite"
      accessibilityLabel="Listening"
    >
      <View style={styles.waveWrap}>
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: colors.primary,
              width: compact ? 40 : 52,
              height: compact ? 40 : 52,
              borderRadius: compact ? 20 : 26,
            },
            glowStyle,
          ]}
        />
        <View style={[styles.bars, { height: maxH }]}>
          {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <WaveBar
              key={i}
              index={i}
              active={active}
              color={colors.primary}
              maxH={maxH}
            />
          ))}
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: compact ? 13 : 15,
            color: colors.textPrimary,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
          }}
        >
          Tap the mic when you’re done
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rowCompact: {
    paddingVertical: 6,
    marginBottom: 4,
  },
  waveWrap: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
  },
  bars: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 1,
  },
});
