import React, { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

type SkeletonProps = {
  width?: number | `${number}%` | "100%";
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Soft shimmer block — calm loading placeholder (not a harsh spinner).
 */
export function Skeleton({ width = "100%", height = 16, radius, style }: SkeletonProps) {
  const { colors, radius: themeRadius } = useTheme();
  const pulse = useSharedValue(0.45);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 0.7;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [pulse, reduceMotion]);

  const anim = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? themeRadius.md,
          backgroundColor: colors.surfaceAlt || colors.borderSoft,
        },
        anim,
        style,
      ]}
    />
  );
}

type ListSkeletonProps = {
  rows?: number;
  fullScreen?: boolean;
  testID?: string;
};

/** Card-row skeleton for meditate / journal style lists */
export function ListSkeleton({ rows = 4, fullScreen = false, testID = "list-skeleton" }: ListSkeletonProps) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={[styles.list, fullScreen && styles.full, { backgroundColor: fullScreen ? colors.background : "transparent" }]}
      testID={testID}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            gap: spacing.md,
            marginBottom: spacing.md,
            alignItems: "center",
          }}
        >
          <Skeleton width={72} height={72} radius={18} />
          <View style={{ flex: 1, gap: 10 }}>
            <Skeleton width="72%" height={14} />
            <Skeleton width="48%" height={12} />
            <Skeleton width="36%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Emotion grid skeleton for Home */
export function GridSkeleton({
  cells = 6,
  cols = 2,
  fullScreen = false,
  testID = "grid-skeleton",
}: {
  cells?: number;
  cols?: number;
  fullScreen?: boolean;
  testID?: string;
}) {
  const { colors, spacing, radius } = useTheme();
  const gap = spacing.md;
  return (
    <View
      style={[
        styles.list,
        fullScreen && styles.full,
        { backgroundColor: fullScreen ? colors.background : "transparent", paddingTop: spacing.lg },
      ]}
      testID={testID}
    >
      <Skeleton width="40%" height={12} style={{ marginBottom: spacing.sm }} />
      <Skeleton width="55%" height={22} style={{ marginBottom: spacing.lg }} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
        {Array.from({ length: cells }).map((_, i) => (
          <View key={i} style={{ width: `${100 / cols}%` as `${number}%`, paddingRight: gap, marginBottom: gap }}>
            <Skeleton width="100%" height={96} radius={radius.lg} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%",
    paddingVertical: 8,
  },
  full: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
});
