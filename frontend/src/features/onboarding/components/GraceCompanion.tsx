import React, { useEffect } from "react";
import { View, Image, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/** ChristCalm bunny mascot (transparent PNG) */
const GRACE_IDLE = require("@/assets/images/grace/companion.png");
const GRACE_WAVE = require("@/assets/images/grace/wave.png");

export type GraceMood = "idle" | "wave";

type Props = {
  mood?: GraceMood;
  size?: number;
  showRing?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Mascot companion — gentle bob + stills from ChristCalm bunny asset.
 */
export function GraceCompanion({
  mood = "idle",
  size = 120,
  showRing = false,
  style,
  testID = "grace-companion",
}: Props) {
  const bob = useSharedValue(0);
  const still = mood === "wave" ? GRACE_WAVE : GRACE_IDLE;

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [bob]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  return (
    <View
      style={[{ width: size + 16, height: size + 16, alignItems: "center", justifyContent: "center" }, style]}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="ChristCalm mascot"
    >
      <Animated.View style={bobStyle}>
        <Image
          source={still}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

export default GraceCompanion;
