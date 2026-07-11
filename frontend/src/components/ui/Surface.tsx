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

/**
 * Premium card surface.
 * Nest dark: borderless charcoal on pure black (fill = hierarchy).
 * Cooper light: white card + soft border.
 */
export function Surface({
  children,
  style,
  padded = true,
  elevated = true,
  testID,
}: Props) {
  const { colors, shadows, radius, isDark } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          // Nest: no hard outlines — light keeps a whisper border
          borderWidth: isDark ? 0 : 1,
          borderColor: isDark ? "transparent" : colors.borderSoft,
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
