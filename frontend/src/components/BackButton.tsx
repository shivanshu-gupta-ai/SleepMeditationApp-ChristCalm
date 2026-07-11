import React from "react";
import { TouchableOpacity, StyleSheet, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Href } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { useSafeBack } from "@/src/hooks/use-safe-back";

type Props = {
  fallback?: Href;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  size?: number;
  style?: ViewStyle;
  testID?: string;
};

export default function BackButton({
  fallback,
  icon = "chevron-back",
  color,
  size = 26,
  style,
  testID = "back-button",
}: Props) {
  const goBack = useSafeBack(fallback);
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={goBack}
      style={[styles.btn, style]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons name={icon} size={size} color={color ?? colors.textPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
  },
});
