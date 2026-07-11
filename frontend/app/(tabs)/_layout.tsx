import React from "react";
import { Platform, StyleSheet } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import { LoadingState } from "@/src/components/ui";
import { playHaptic } from "@/src/utils/haptics";
import { track } from "@/src/utils/analytics";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();
  const { colors, fonts, isDark } = useTheme();

  if (loading) return <LoadingState message="Loading…" />;
  if (!user) return <Redirect href="/(auth)/sign-in" />;

  const tabPress = (name: string) => ({
    tabPress: () => {
      void playHaptic("medium");
      void track("tab_change", { tab: name });
    },
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Subtle scene fade on web/native where supported
        animation: "fade",
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.borderSoft,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 10,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOpacity: isDark ? 0.35 : 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -4 },
            },
            android: { elevation: 8 },
            default: {},
          }),
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.body,
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        listeners={tabPress("home")}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
          tabBarAccessibilityLabel: "Home",
          tabBarButtonTestID: "tab-home",
        }}
      />
      <Tabs.Screen
        name="meditate"
        listeners={tabPress("meditate")}
        options={{
          title: "Meditate",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "leaf" : "leaf-outline"} size={size} color={color} />
          ),
          tabBarAccessibilityLabel: "Meditate",
          tabBarButtonTestID: "tab-meditate",
        }}
      />
      <Tabs.Screen
        name="wisdom"
        listeners={tabPress("wisdom")}
        options={{
          title: "Wisdom",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={size}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: "Wisdom",
          tabBarButtonTestID: "tab-wisdom",
        }}
      />
      {/* Prayer library deferred — hide route from tab bar if file remains */}
      <Tabs.Screen
        name="prayers"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="journal"
        listeners={tabPress("journal")}
        options={{
          title: "Journal",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "create" : "create-outline"} size={size} color={color} />
          ),
          tabBarAccessibilityLabel: "Journal",
          tabBarButtonTestID: "tab-journal",
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={tabPress("profile")}
        options={{
          title: "Me",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
          tabBarAccessibilityLabel: "Profile",
          tabBarButtonTestID: "tab-profile",
        }}
      />
    </Tabs>
  );
}
