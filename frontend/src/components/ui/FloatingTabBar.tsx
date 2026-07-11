import React, { useState } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { PressableScale } from "@/src/components/ui/PressableScale";
import { StartCalmSheet } from "@/src/components/ui/StartCalmSheet";
import { playHaptic } from "@/src/utils/haptics";
import { track } from "@/src/utils/analytics";
import { useResponsive } from "@/src/hooks/use-responsive";

/**
 * Floating pill tab bar + FAB.
 * Nest dark: charcoal pill, muted icons, gold active + gold FAB — sparse chrome.
 * Cooper light: white pill, lavender active + FAB.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, fonts, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isCompact, width } = useResponsive();
  const [sheetOpen, setSheetOpen] = useState(false);

  const HIDDEN = new Set(["prayers"]);
  const visibleRoutes = state.routes.filter((route) => {
    if (HIDDEN.has(route.name)) return false;
    const opts = descriptors[route.key]?.options as { href?: string | null };
    return opts?.href !== null;
  });

  const bottomPad = Math.max(insets.bottom, Platform.OS === "web" ? 10 : 8);
  const hPad = isCompact ? 12 : 16;
  const fabSize = isCompact ? 48 : 52;
  const pillMinH = isCompact ? 58 : 64;
  const iconSize = isCompact ? 22 : 24;
  const labelSize = isCompact ? 10 : 11;
  const gap = isCompact ? 8 : 10;

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[
          styles.wrap,
          {
            paddingBottom: bottomPad,
            paddingHorizontal: hPad,
            gap,
            maxWidth: width + hPad * 2,
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
              // Nest: solid charcoal float · Cooper: white
              backgroundColor: isDark ? "rgba(22,22,24,0.94)" : "rgba(255,255,255,0.96)",
              borderWidth: isDark ? 0 : StyleSheet.hairlineWidth,
              borderColor: colors.borderSoft,
              paddingHorizontal: isCompact ? 4 : 8,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOpacity: isDark ? 0.45 : 0.1,
                  shadowRadius: isDark ? 24 : 20,
                  shadowOffset: { width: 0, height: 10 },
                },
                android: { elevation: 16 },
                default: {},
              }),
            },
          ]}
        >
          {visibleRoutes.map((route) => {
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

            // Nest: soft gold when active. Cooper: lavender.
            const activeColor = isDark ? colors.premium : colors.primary;
            const color = focused ? activeColor : colors.textMuted;
            const icon =
              options.tabBarIcon?.({
                focused,
                color,
                size: iconSize,
              }) ?? null;

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
                style={[styles.tabItem, isCompact && { minWidth: 0 }]}
              >
                {/* Nest: no busy icon wells — icon alone, like the reference bar */}
                {icon}
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

        {/* Nest gold FAB */}
        <PressableScale
          haptic="medium"
          onPress={() => {
            void track("fab_start_calm");
            setSheetOpen(true);
          }}
          accessibilityLabel="Start calm"
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
          <Ionicons name="add" size={isCompact ? 24 : 26} color={colors.fabText} />
        </PressableScale>
      </View>

      <StartCalmSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
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
