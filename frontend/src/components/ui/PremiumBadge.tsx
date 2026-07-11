import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";

type Props = {
  isPremium?: boolean;
  onPressUpgrade?: () => void;
  compact?: boolean;
  testID?: string;
};

export function PremiumBadge({
  isPremium,
  onPressUpgrade,
  compact = false,
  testID,
}: Props) {
  const { colors, fonts, radius } = useTheme();

  if (isPremium) {
    return (
      <View
        testID={testID}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: colors.premium,
          paddingVertical: compact ? 6 : 8,
          paddingHorizontal: compact ? 10 : 14,
          borderRadius: radius.full,
        }}
      >
        <Ionicons name="star" size={13} color={colors.white} />
        <Text style={{ color: colors.white, fontFamily: fonts.bodyBold, fontSize: 12 }}>
          Premium
        </Text>
      </View>
    );
  }

  return (
    <PressableScale
      onPress={onPressUpgrade}
      testID={testID}
      scaleTo={0.96}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.premiumSoft,
        paddingVertical: compact ? 6 : 8,
        paddingHorizontal: compact ? 10 : 14,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.premium + "55",
      }}
    >
      <Ionicons name="star-outline" size={14} color={colors.premiumDark} />
      <Text
        style={{
          color: colors.premiumDark,
          fontFamily: fonts.bodyBold,
          fontSize: 13,
        }}
      >
        Upgrade
      </Text>
    </PressableScale>
  );
}

export function PremiumTag({ testID }: { testID?: string }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View
      testID={testID}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.premiumSoft,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full,
      }}
    >
      <Ionicons name="star" size={11} color={colors.premium} />
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: colors.premiumDark }}>
        Premium
      </Text>
    </View>
  );
}
