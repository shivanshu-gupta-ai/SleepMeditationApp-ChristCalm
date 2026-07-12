import React, { useEffect, useState } from "react";
import { View, Text, AccessibilityInfo } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** 0–1 */
  progress: number;
  size?: number;
  stroke?: number;
  /** Center label (e.g. minutes). If number-like, animates count-up. */
  label?: string;
  sublabel?: string;
  testID?: string;
};

/**
 * Circular progress — draws ring + optional numeric count-up on mount.
 */
export function ProgressRing({
  progress,
  size = 160,
  stroke = 10,
  label,
  sublabel,
  testID,
}: Props) {
  const { colors, fonts } = useTheme();
  const p = Math.min(1, Math.max(0, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const dashOffset = useSharedValue(c);
  const [displayLabel, setDisplayLabel] = useState(label ?? "0");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    const target = c * (1 - p);
    if (reduceMotion) {
      dashOffset.value = target;
    } else {
      dashOffset.value = c;
      dashOffset.value = withTiming(target, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [p, c, reduceMotion, dashOffset]);

  // Count-up for numeric labels
  useEffect(() => {
    const raw = label ?? `${Math.round(p * 100)}`;
    const num = Number(String(raw).replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(num) || reduceMotion) {
      setDisplayLabel(raw);
      return;
    }
    const duration = 800;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayLabel(String(Math.round(num * eased)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplayLabel(raw.includes("%") ? `${Math.round(num)}%` : String(Math.round(num)));
    };
    setDisplayLabel("0");
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [label, p, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  return (
    <View
      testID={testID}
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.borderSoft}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.premium}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text
        style={{
          fontFamily: fonts.headingBold,
          fontSize: size * 0.2,
          color: colors.textPrimary,
          letterSpacing: -0.5,
        }}
      >
        {displayLabel}
      </Text>
      {sublabel ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.textMuted,
            marginTop: 2,
            textAlign: "center",
            paddingHorizontal: 12,
          }}
        >
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
}
