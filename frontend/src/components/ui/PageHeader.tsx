import React from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { layout } from "@/src/theme/layout";
import { useResponsive } from "@/src/hooks/use-responsive";

type Props = {
  overline?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Page header — title scale adapts for SE → Pro Max.
 */
export function PageHeader({ overline, title, subtitle, right, style, testID }: Props) {
  const { colors, fonts, spacing } = useTheme();
  const { titleSize, titleLineHeight, isCompact } = useResponsive();

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          // Nest: generous air under titles
          marginBottom: isCompact ? spacing.lg : spacing.xl,
          width: "100%",
          maxWidth: "100%",
        },
        style,
      ]}
    >
      <View style={{ flex: 1, minWidth: 0, paddingRight: right ? spacing.sm : 0 }}>
        {overline ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 13,
              letterSpacing: 0.2,
              color: colors.textMuted,
              marginBottom: 6,
            }}
          >
            {overline}
          </Text>
        ) : null}
        <Text
          style={{
            // Inter Bold — Nest SF Pro–like display (tight tracking)
            fontFamily: fonts.headingBold,
            fontSize: titleSize,
            lineHeight: titleLineHeight,
            color: colors.textPrimary,
            letterSpacing: -0.8,
            paddingRight: 2,
            flexShrink: 1,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: isCompact ? 14 : layout.subtitleSize,
              lineHeight: isCompact ? 20 : layout.subtitleLineHeight,
              color: colors.textSecondary,
              marginTop: 6,
              paddingRight: 4,
              flexShrink: 1,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={{ flexShrink: 0 }}>{right}</View> : null}
    </View>
  );
}
