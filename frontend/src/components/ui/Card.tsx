import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
  glass?: boolean;
  testID?: string;
  onPress?: () => void;
};

export function Card({
  children,
  style,
  padded = true,
  elevated = true,
  glass = false,
  testID,
  onPress,
}: Props) {
  const { colors, spacing, radius, shadows, isDark } = useTheme();

  const cardStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: glass ? colors.cardGlass : colors.surface,
      borderRadius: radius.lg,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? "transparent" : colors.borderSoft,
      ...(elevated ? shadows.soft : null),
    },
    padded ? { padding: spacing.lg } : null,
    style,
  ];

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        testID={testID}
        accessibilityRole="button"
        style={cardStyle}
      >
        {children}
      </PressableScale>
    );
  }

  return (
    <View testID={testID} style={cardStyle}>
      {children}
    </View>
  );
}
