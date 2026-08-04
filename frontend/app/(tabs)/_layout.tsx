import React from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import { LoadingState } from "@/src/components/ui";
import { FloatingTabBar } from "@/src/components/ui/FloatingTabBar";

/**
 * Floating tabs + Start Calm FAB.
 * Visible: Home · Meditate · Wisdom · Journey · Me
 * Hidden routes: Journal (via Me), Prayers library (deferred)
 */
export default function TabsLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <LoadingState
        message="Opening your space…"
        slowMessage="Still preparing — thank you for waiting…"
      />
    );
  }
  if (!user) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "fade",
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="home"
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
      <Tabs.Screen
        name="stats"
        options={{
          title: "Journey",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "compass" : "compass-outline"}
              size={size}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: "Your journey",
          tabBarButtonTestID: "tab-stats",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Me",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
          tabBarAccessibilityLabel: "Profile",
          tabBarButtonTestID: "tab-profile",
        }}
      />
      {/* Journal kept as a stackable tab route; open from Me */}
      <Tabs.Screen
        name="journal"
        options={{
          href: null,
          title: "Journal",
        }}
      />
      {/* Prayer library deferred — fully hidden from navigation */}
      <Tabs.Screen
        name="prayers"
        options={{
          href: null,
          title: "Prayers",
        }}
      />
    </Tabs>
  );
}
