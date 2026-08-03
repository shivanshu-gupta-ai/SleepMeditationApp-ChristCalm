import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { touchTarget } from "@/src/theme/primitives";

type Props = {
  label: string;
  sub?: string;
  /** Ionicons name — preferred over emoji */
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress?: () => void;
  testID?: string;
  /**
   * multi = allow multiple selections (behavior only).
   * Visual indicator is identical for single & multi for a consistent UI.
   */
  multi?: boolean;
  /** compact (default): denser list for many options on one screen */
  density?: "compact" | "roomy";
  /** Allow long labels (e.g. support options) to wrap to 2 lines */
  labelLines?: number;
};

/**
 * Selection row for onboarding — compact by default so lists fit short phones.
 * Keeps ≥44pt touch target without oversized padding.
 */
export function OnboardingOption({
  label,
  sub,
  icon,
  selected = false,
  onPress,
  testID,
  multi = false,
  density = "compact",
  labelLines = 1,
}: Props) {
  const { colors, fonts, spacing, radius, shadows } = useTheme();
  const compact = density === "compact";
  const iconBox = compact ? 36 : 48;
  const check = compact ? 22 : 26;

  return (
    <PressableScale
      onPress={onPress}
      testID={testID}
      scaleTo={0.985}
      accessibilityLabel={`${label}${sub ? `, ${sub}` : ""}${selected ? ", selected" : ""}${
        multi ? ", multi-select" : ""
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected, checked: multi ? selected : undefined }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: compact ? 10 : spacing.md,
        minHeight: touchTarget,
        backgroundColor: selected ? colors.primarySoft : colors.surface,
        borderRadius: radius.lg,
        paddingVertical: compact ? 10 : 16,
        paddingHorizontal: compact ? 12 : spacing.md,
        marginBottom: compact ? 8 : spacing.sm,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.borderSoft,
        ...(selected ? shadows.soft : null),
      }}
    >
      {icon ? (
        <View
          style={{
            width: iconBox,
            height: iconBox,
            borderRadius: compact ? 12 : 16,
            backgroundColor: selected ? colors.primary + "28" : colors.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons
            name={icon}
            size={compact ? 18 : 22}
            color={selected ? colors.primary : colors.textSecondary}
          />
        </View>
      ) : null}

      <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
        <Text
          numberOfLines={labelLines}
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: compact ? 15 : 16,
            color: colors.textPrimary,
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
        {sub ? (
          <Text
            numberOfLines={compact ? 1 : 2}
            style={{
              fontFamily: fonts.body,
              fontSize: compact ? 12 : 13,
              color: colors.textSecondary,
              marginTop: compact ? 1 : 3,
              lineHeight: compact ? 16 : 19,
            }}
          >
            {sub}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          width: check,
          height: check,
          borderRadius: check / 2,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {selected ? (
          <Ionicons name="checkmark" size={compact ? 13 : 15} color={colors.textOnPrimary} />
        ) : null}
      </View>
    </PressableScale>
  );
}
