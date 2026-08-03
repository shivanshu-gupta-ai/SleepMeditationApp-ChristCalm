import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

export type YearDotGridProps = {
  /** Total years / dots to draw (remaining life inventory). */
  total: number;
  /**
   * How many leading dots are "lost" (filled in urgency color).
   * 0 = all soft remaining (screen 17).
   */
  lostCount?: number;
  testID?: string;
};

const COLS = 10;
const MAX_DOTS = 60;

/**
 * Clean high-contrast year inventory grid (design screens 17–18).
 * Soft gray = years left. Warm red/orange = years on track to lose.
 */
export function YearDotGrid({ total, lostCount = 0, testID }: YearDotGridProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const count = Math.min(MAX_DOTS, Math.max(1, total));
  const lost = Math.min(count, Math.max(0, lostCount));

  // Fit grid in content width with breathing room
  const gridWidth = Math.min(width - 48, 320);
  const gap = 6;
  const cell = (gridWidth - gap * (COLS - 1)) / COLS;
  const size = Math.max(8, Math.min(14, cell));

  const remainingColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(26,21,37,0.12)";
  // Warm urgency — orange/coral, not pure danger red (emotionally heavy, not alarming-UI)
  const lostColor = isDark ? "#E89B6E" : "#D4784A";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: {
          width: gridWidth,
          flexDirection: "row",
          flexWrap: "wrap",
          gap,
          justifyContent: "flex-start",
          alignSelf: "center",
        },
        dot: {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      }),
    [gridWidth, size, gap]
  );

  return (
    <View
      style={styles.grid}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel={
        lost > 0
          ? `Grid of ${count} years; ${lost} years highlighted as time being lost`
          : `Grid of ${count} years remaining`
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i < lost ? lostColor : remainingColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default YearDotGrid;
