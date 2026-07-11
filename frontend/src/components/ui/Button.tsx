import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { touchTarget } from "@/src/theme/primitives";

type Variant = "primary" | "secondary" | "ghost" | "sos" | "premium" | "danger";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  style?: StyleProp<ViewStyle>;
  testID?: string;
  fullWidth?: boolean;
  haptic?: "none" | "light" | "medium" | "heavy" | "success" | "warning";
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  style,
  testID,
  fullWidth = true,
  haptic,
}: Props) {
  const { colors, fonts, radius, shadows } = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<
    Variant,
    { bg: string; text: string; border?: string; shadow?: object }
  > = {
    primary: {
      bg: colors.primary,
      text: colors.textOnPrimary,
      shadow: shadows.glow,
    },
    secondary: {
      bg: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
    },
    ghost: {
      bg: "transparent",
      text: colors.primary,
    },
    sos: {
      bg: colors.accentSOS,
      text: colors.white,
      shadow: shadows.medium,
    },
    premium: {
      bg: colors.premium,
      text: colors.white,
      shadow: shadows.soft,
    },
    danger: {
      bg: colors.dangerSoft,
      text: colors.danger,
      border: colors.accentSOS + "44",
    },
  };

  const p = palette[variant];
  const spinnerColor = p.text;

  const hapticStrength =
    haptic ??
    (variant === "primary" || variant === "sos" || variant === "premium"
      ? "medium"
      : variant === "danger"
        ? "warning"
        : "light");

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      haptic={hapticStrength}
      accessibilityLabel={loading ? `${label}, loading` : label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.base,
        {
          backgroundColor: p.bg,
          borderRadius: radius.full,
          borderWidth: p.border ? 1.5 : 0,
          borderColor: p.border,
          alignSelf: fullWidth ? "stretch" : "center",
          ...(p.shadow || null),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {icon && iconPosition === "left" ? (
            <Ionicons name={icon} size={18} color={p.text} />
          ) : null}
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 16,
              color: p.text,
              letterSpacing: 0.2,
            }}
          >
            {label}
          </Text>
          {icon && iconPosition === "right" ? (
            <Ionicons name={icon} size={18} color={p.text} />
          ) : null}
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(54, touchTarget),
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
