import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { iconSize, touchTarget } from "@/src/theme/primitives";

type Props = {
  label: string;
  sub?: string;
  /** Ionicons name — preferred over emoji (ui-ux-pro-max: no emoji as icons) */
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress?: () => void;
  testID?: string;
  /**
   * multi = allow multiple selections (behavior only).
   * Visual indicator is identical for single & multi for a consistent UI.
   */
  multi?: boolean;
};

/**
 * Unified selection row for onboarding.
 * Soft UI Evolution: soft surface, clear selected state, 44pt+ touch.
 */
export function OnboardingOption({
  label,
  sub,
  icon,
  selected = false,
  onPress,
  testID,
  multi = false,
}: Props) {
  const { colors, fonts, spacing, radius, shadows } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      testID={testID}
      scaleTo={0.985}
      accessibilityLabel={`${label}${sub ? `, ${sub}` : ""}${selected ? ", selected" : ""}`}
      accessibilityRole="button"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: touchTarget + 12,
        backgroundColor: selected ? colors.primarySoft : colors.surface,
        borderRadius: radius.lg,
        paddingVertical: 16,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.borderSoft,
        ...(selected ? shadows.soft : null),
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: selected ? colors.primary + "28" : colors.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
        importantForAccessibility="no-hide-descendants"
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={iconSize.md}
            color={selected ? colors.primary : colors.textSecondary}
          />
        ) : null}
      </View>

      <View style={{ flex: 1, paddingRight: spacing.xs }}>
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 16,
            color: colors.textPrimary,
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
        {sub ? (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 13,
              color: colors.textSecondary,
              marginTop: 3,
              lineHeight: 19,
            }}
          >
            {sub}
          </Text>
        ) : null}
      </View>

      {/* Shared selection control — same for single & multi */}
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {selected ? (
          <Ionicons name="checkmark" size={15} color={colors.textOnPrimary} />
        ) : null}
      </View>
    </PressableScale>
  );
}
