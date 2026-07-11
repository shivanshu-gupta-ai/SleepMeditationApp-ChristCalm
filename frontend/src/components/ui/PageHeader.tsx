import React from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { layout } from "@/src/theme/layout";

type Props = {
  overline?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Canonical page header — same rhythm on Home, Meditate, Wisdom, Journal, Profile.
 */
export function PageHeader({ overline, title, subtitle, right, style, testID }: Props) {
  const { colors, fonts, spacing } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: spacing.lg + 4,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, paddingRight: right ? spacing.md : 0 }}>
        {overline ? (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: layout.overlineSize,
              letterSpacing: layout.overlineTracking,
              textTransform: "uppercase",
              color: colors.textMuted,
              marginBottom: 8,
            }}
          >
            {overline}
          </Text>
        ) : null}
        <Text
          style={{
            fontFamily: fonts.headingBold,
            fontSize: layout.titleSize,
            lineHeight: layout.titleLineHeight + 2,
            color: colors.textPrimary,
            letterSpacing: -0.4,
            // Slight padding so descenders / tight tracking aren't clipped
            paddingRight: 2,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: layout.subtitleSize,
              lineHeight: layout.subtitleLineHeight + 1,
              color: colors.textSecondary,
              marginTop: 8,
              maxWidth: 360,
              paddingRight: 4,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
