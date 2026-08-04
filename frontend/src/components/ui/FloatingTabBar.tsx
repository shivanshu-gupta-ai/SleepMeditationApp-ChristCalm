import React, { useEffect, useState } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { StartCalmSheet } from "@/src/components/ui/StartCalmSheet";
import { playHaptic } from "@/src/utils/haptics";
import { track } from "@/src/utils/analytics";
import { useResponsive } from "@/src/hooks/use-responsive";

function TabIconWrap({
  focused,
  activeColor,
  children,
}: {
  focused: boolean;
  activeColor: string;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(focused ? 1 : 0.92);
  const dot = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.12, { damping: 12, stiffness: 280 }),
        withSpring(1, { damping: 14, stiffness: 220 })
      );
      dot.value = withSpring(1, { damping: 14, stiffness: 260 });
    } else {
      scale.value = withTiming(0.92, { duration: 160 });
      dot.value = withTiming(0, { duration: 140 });
    }
  }, [focused, scale, dot]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dot.value,
    transform: [{ scale: 0.4 + 0.6 * dot.value }],
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: activeColor,
    marginTop: 2,
  }));

  return (
    <View style={{ alignItems: "center" }}>
      <Animated.View style={style}>{children}</Animated.View>
      <Animated.View style={dotStyle} />
    </View>
  );
}

/**
 * Floating pill tab bar + FAB.
 * P0 motion: active tab icon pop + FAB + → × rotate when sheet open.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, fonts, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isCompact, isTablet, tabBarMaxWidth: barMax } = useResponsive();
  const [sheetOpen, setSheetOpen] = useState(false);
  const fabRotate = useSharedValue(0);

  useEffect(() => {
    fabRotate.value = withSpring(sheetOpen ? 1 : 0, { damping: 16, stiffness: 220 });
  }, [sheetOpen, fabRotate]);

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotate.value * 45}deg` }],
  }));

  const HIDDEN = new Set(["prayers", "journal"]);
  const visibleRoutes = state.routes.filter((route) => {
    if (HIDDEN.has(route.name)) return false;
    const opts = descriptors[route.key]?.options as { href?: string | null };
    return opts?.href !== null;
  });

  // Safe area above home indicator; thumb-friendly sizes (min ~44pt tap)
  const bottomPad = Math.max(insets.bottom, Platform.OS === "web" ? 10 : 8);
  const hPad = isCompact ? 12 : isTablet ? 24 : 16;
  const fabSize = isCompact ? 48 : isTablet ? 56 : 52;
  const pillMinH = isCompact ? 58 : isTablet ? 68 : 64;
  const iconSize = isCompact ? 22 : isTablet ? 26 : 24;
  const labelSize = isCompact ? 10 : isTablet ? 12 : 11;
  const gap = isCompact ? 8 : isTablet ? 14 : 10;
  const activeColor = isDark ? colors.premium : colors.primary;
  // Inactive: lower opacity (not different colors per tab) — accessible, clean
  const inactiveColor = isDark ? "rgba(160,160,168,0.72)" : "rgba(92,85,104,0.72)";
  // Full-width plate under the floating bar so scroll content never shows through
  // the home-indicator gap or translucent pill (especially visible in dark mode).
  const scrimHeight = bottomPad + pillMinH + fabSize + gap + 28;

  return (
    <>
      {/* Edge-to-edge bottom cover + soft fade (does not intercept touches) */}
      <View
        pointerEvents="none"
        style={[styles.scrimWrap, { height: scrimHeight }]}
      >
        <LinearGradient
          colors={
            isDark
              ? ["rgba(0,0,0,0)", "rgba(0,0,0,0.72)", colors.background]
              : ["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", colors.background]
          }
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Solid strip for home indicator / bottom safe area */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: bottomPad + 10,
            backgroundColor: colors.background,
          }}
        />
      </View>

      <View
        pointerEvents="box-none"
        style={[
          styles.wrap,
          {
            paddingBottom: bottomPad,
            paddingHorizontal: hPad,
            gap,
            // Center a comfortable bar on iPad; full width on phones
            maxWidth: barMax,
            alignSelf: "center",
            width: "100%",
          },
        ]}
      >
        <View
          style={[
            styles.pill,
            {
              minHeight: pillMinH,
              // Fully opaque pill so list content cannot bleed through
              backgroundColor: isDark ? colors.surface : colors.backgroundElevated,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark ? colors.border : colors.borderSoft,
              paddingHorizontal: isCompact ? 4 : 8,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOpacity: isDark ? 0.55 : 0.1,
                  shadowRadius: isDark ? 20 : 20,
                  shadowOffset: { width: 0, height: 8 },
                },
                android: { elevation: 16 },
                default: {},
              }),
            },
          ]}
        >
          {visibleRoutes.map((route, i) => {
            const focused = state.index === state.routes.indexOf(route);
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === "string"
                ? options.tabBarLabel
                : options.title ?? route.name;

            const onPress = () => {
              void playHaptic("medium");
              void track("tab_change", { tab: route.name });
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const color = focused ? activeColor : inactiveColor;
            const icon =
              options.tabBarIcon?.({
                focused,
                color,
                size: iconSize,
              }) ?? null;

            // Short single-line labels only (nav best practice)
            const shortLabel =
              isCompact && String(label).length > 8
                ? String(label).slice(0, 7)
                : String(label);

            return (
              <PressableScale
                key={route.key}
                onPress={onPress}
                haptic="none"
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? String(label)}
                testID={(options as { tabBarButtonTestID?: string }).tabBarButtonTestID}
                style={[
                  styles.tabItem,
                  isCompact && { minWidth: 0 },
                  { minHeight: 44, minWidth: 44 },
                ]}
              >
                <TabIconWrap focused={focused} activeColor={activeColor}>
                  {icon}
                </TabIconWrap>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{
                    fontFamily: focused ? fonts.bodyBold : fonts.body,
                    fontSize: labelSize,
                    color,
                    marginTop: 3,
                    maxWidth: "100%",
                  }}
                >
                  {shortLabel}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        {/* FAB — rotates toward × when sheet open */}
        <PressableScale
          haptic="medium"
          onPress={() => {
            void track("fab_start_calm");
            setSheetOpen((o) => !o);
          }}
          accessibilityLabel={sheetOpen ? "Close start calm" : "Start calm"}
          testID="fab-start-calm"
          style={[
            styles.fab,
            {
              width: fabSize,
              height: fabSize,
              borderRadius: fabSize / 2,
              backgroundColor: colors.fab,
              shadowColor: colors.fab,
              marginBottom: isCompact ? 4 : 6,
              ...Platform.select({
                ios: {
                  shadowOpacity: 0.45,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 },
                },
                android: { elevation: 12 },
                default: {},
              }),
            },
          ]}
        >
          <Animated.View style={fabIconStyle}>
            <Ionicons name="add" size={isCompact ? 24 : 26} color={colors.fabText} />
          </Animated.View>
        </PressableScale>
      </View>

      <StartCalmSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrimWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 2,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    paddingVertical: 8,
    minWidth: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minWidth: 0,
  },
  fab: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
