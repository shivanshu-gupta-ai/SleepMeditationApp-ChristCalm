import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { layout } from "@/src/theme/layout";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
  testID?: string;
};

/** Shared surface card used across tabs for visual continuity. */
export function Surface({
  children,
  style,
  padded = true,
  elevated = true,
  testID,
}: Props) {
  const { colors, shadows } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: layout.surfaceRadius,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          // Avoid overflow:hidden — it clips multi-line text near soft curves
          ...(elevated ? shadows.soft : null),
        },
        padded ? { padding: layout.cardPad } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
