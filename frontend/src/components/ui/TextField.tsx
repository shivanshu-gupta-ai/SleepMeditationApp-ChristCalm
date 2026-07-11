import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type Props = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  rightSlot?: React.ReactNode;
};

export function TextField({ label, containerStyle, rightSlot, style, ...rest }: Props) {
  const { colors, fonts, spacing, radius } = useTheme();

  return (
    <View style={[{ marginBottom: spacing.md }, containerStyle]}>
      {label ? (
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 13,
            color: colors.textSecondary,
            marginBottom: spacing.xs,
            letterSpacing: 0.4,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View style={{ position: "relative", justifyContent: "center" }}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            {
              backgroundColor: colors.inputFill,
              borderRadius: radius.md,
              paddingVertical: 16,
              paddingHorizontal: 18,
              paddingRight: rightSlot ? 48 : 18,
              fontSize: 16,
              fontFamily: fonts.body,
              color: colors.textPrimary,
              borderWidth: 1,
              borderColor: colors.borderSoft,
            },
            style,
          ]}
          {...rest}
        />
        {rightSlot ? <View style={styles.right}>{rightSlot}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  right: {
    position: "absolute",
    right: 12,
  },
});
