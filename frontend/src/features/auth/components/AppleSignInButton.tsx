import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  label?: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
};

export default function AppleSignInButton({
  label = "Sign in with Apple",
  onPress,
  disabled,
}: Props) {
  const { colors, fonts, radius } = useTheme();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      await onPress();
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || disabled;

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.textPrimary,
        borderRadius: radius.full,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderWidth: 1.5,
        borderColor: colors.textPrimary,
        marginTop: 0,
      }}
      onPress={handlePress}
      disabled={isBusy}
      testID="apple-signin-btn"
      activeOpacity={0.85}
    >
      {isBusy ? (
        <ActivityIndicator color={colors.background} style={{ flex: 1 }} />
      ) : (
        <>
          <Ionicons name="logo-apple" size={22} color={colors.background} />
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontWeight: "600",
              fontSize: 15,
              color: colors.background,
              textAlign: "center",
              flex: 1,
            }}
          >
            {label}
          </Text>
          <View style={{ width: 22 }} />
        </>
      )}
    </TouchableOpacity>
  );
}