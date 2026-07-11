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

/**
 * Premium pill buttons — Cooper black CTA / Nest gold-violet emphasis.
 * Logic unchanged; visual language only.
 */
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
  const { colors, fonts, radius, shadows, isDark } = useTheme();
  const isDisabled = disabled || loading;

  // Light: primary = deep ink (Cooper). Dark: Nest light pill (not loud violet fill).
  const palette: Record<
    Variant,
    { bg: string; text: string; border?: string; shadow?: object }
  > = {
    primary: {
      bg: isDark ? colors.white : colors.textPrimary,
      text: isDark ? "#0A0A0A" : colors.white,
      shadow: isDark ? shadows.soft : shadows.glow,
    },
    secondary: {
      bg: isDark ? colors.surfaceAlt : colors.surface,
      text: colors.textPrimary,
      border: isDark ? undefined : colors.border,
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
      // Nest gold CTA — dark ink on gold for premium contrast
      bg: colors.premium,
      text: "#1A1525",
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
              letterSpacing: 0.15,
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
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
