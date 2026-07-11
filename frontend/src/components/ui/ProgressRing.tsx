import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  /** 0–1 */
  progress: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  testID?: string;
};

/**
 * Circular progress — fitness-board language adapted for calm stats.
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
  const offset = c * (1 - p);

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
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.premium}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
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
        {label ?? `${Math.round(p * 100)}%`}
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
