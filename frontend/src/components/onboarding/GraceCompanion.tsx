import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

const GRACE_IDLE = require("@/assets/images/grace/companion.jpg");
const GRACE_WAVE = require("@/assets/images/grace/wave.jpg");
// Imagine-generated loops (web plays natively; native falls back to bob + stills)
const VIDEO_IDLE = require("@/assets/images/grace/companion-idle.mp4");
const VIDEO_WAVE = require("@/assets/images/grace/companion-wave.mp4");

function resolveAssetUri(mod: unknown): string {
  if (typeof mod === "string") return mod;
  if (mod && typeof mod === "object" && "uri" in (mod as object)) {
    return String((mod as { uri: string }).uri);
  }
  // Metro numeric asset id — build relative URL for web bundler
  if (typeof mod === "number" && Platform.OS === "web") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAssetByID } = require("react-native/Libraries/Image/AssetRegistry");
      const asset = getAssetByID(mod);
      if (asset?.httpServerLocation && asset?.name && asset?.type) {
        const scale = (asset.scales && asset.scales[0]) || 1;
        const scaleSuffix = scale === 1 ? "" : `@${scale}x`;
        return `${asset.httpServerLocation}/${asset.name}${scaleSuffix}.${asset.type}`;
      }
    } catch {
      // fall through
    }
  }
  return String(mod);
}

export type GraceMood = "idle" | "wave";

type Props = {
  /** idle = soft breathe; wave = greeting hand */
  mood?: GraceMood;
  /** Circle diameter */
  size?: number;
  showRing?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Grace companion for onboarding — Imagine idle/wave loops on web,
 * gentle Reanimated bob + stills on native (no extra video dependency).
 */
export function GraceCompanion({
  mood = "idle",
  size = 120,
  showRing = true,
  style,
  testID = "grace-companion",
}: Props) {
  const { colors, isDark, shadows } = useTheme();
  const bob = useSharedValue(0);
  const glow = useSharedValue(0.35);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [bob, glow]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const still = mood === "wave" ? GRACE_WAVE : GRACE_IDLE;
  const videoSrc = mood === "wave" ? VIDEO_WAVE : VIDEO_IDLE;
  const useVideo = Platform.OS === "web" && !videoFailed;
  const r = size / 2;

  return (
    <View
      style={[{ width: size + 16, height: size + 16, alignItems: "center", justifyContent: "center" }, style]}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="Grace, your calm companion"
    >
      {/* Soft ambient glow */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: size * 0.92,
            height: size * 0.92,
            borderRadius: size,
            backgroundColor: colors.primarySoft,
          },
          glowStyle,
        ]}
      />

      <Animated.View style={bobStyle}>
        <View
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: r,
              padding: showRing ? 4 : 0,
              backgroundColor: showRing
                ? isDark
                  ? colors.surface
                  : colors.cardGlass
                : "transparent",
              borderWidth: showRing ? 1 : 0,
              borderColor: colors.borderSoft,
              ...(showRing && !isDark ? shadows.soft : null),
            },
          ]}
        >
          {useVideo ? (
            // RN Web: native video element for Imagine loop
            <View
              style={{
                width: size - (showRing ? 8 : 0),
                height: size - (showRing ? 8 : 0),
                borderRadius: r,
                overflow: "hidden",
              }}
            >
              {React.createElement("video", {
                src: resolveAssetUri(videoSrc),
                autoPlay: true,
                loop: true,
                muted: true,
                playsInline: true,
                onError: () => setVideoFailed(true),
                style: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: r,
                  display: "block",
                },
              })}
            </View>
          ) : (
            <Image
              source={still}
              style={{
                width: size - (showRing ? 8 : 0),
                height: size - (showRing ? 8 : 0),
                borderRadius: r,
              }}
              accessibilityIgnoresInvertColors
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
