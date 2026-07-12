import React, { useEffect } from "react";
import { Text, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  emoji?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Chip({
  label,
  selected = false,
  onPress,
  emoji,
  accentColor,
  style,
  testID,
}: Props) {
  const { colors, fonts, radius } = useTheme();
  const activeBorder = accentColor || colors.primary;
  const pop = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      pop.value = withSequence(
        withSpring(1.06, { damping: 12, stiffness: 320 }),
        withSpring(1, { damping: 14, stiffness: 240 })
      );
    } else {
      pop.value = withTiming(1, { duration: 120 });
    }
  }, [selected, pop]);

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  return (
    <Animated.View style={popStyle}>
      <PressableScale
        onPress={onPress}
        testID={testID}
        scaleTo={0.96}
        style={[
          {
            height: 40,
            paddingHorizontal: 16,
            borderRadius: radius.full,
            backgroundColor: selected ? colors.primarySoft : colors.surface,
            borderWidth: 1.5,
            borderColor: selected ? activeBorder : colors.borderSoft,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          },
          style,
        ]}
      >
        {emoji ? <Text style={{ fontSize: 15 }}>{emoji}</Text> : null}
        <Text
          style={{
            fontFamily: selected ? fonts.bodyBold : fonts.body,
            fontSize: 14,
            color: selected ? colors.primary : colors.textPrimary,
          }}
        >
          {label}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}
