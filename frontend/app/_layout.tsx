import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useAppFonts } from "@/src/hooks/use-app-fonts";
import { AuthProvider, useAuth } from "@/src/features/auth";
import { RevenueCatProvider } from "@/src/features/subscriptions";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { ViewportProvider } from "@/src/context/ViewportContext";
import { ConnectivityProvider } from "@/src/context/ConnectivityContext";
import { ConnectivityBanners } from "@/src/components/ui";
import { startAnalytics, stopAnalytics } from "@/src/utils/analytics";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsReady, fontsError] = useAppFonts();

  useEffect(() => {
    if (fontsReady || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady, fontsError]);

  // Product usage → DynamoDB (background flush)
  useEffect(() => {
    if (!fontsReady && !fontsError) return;
    startAnalytics();
    return () => stopAnalytics();
  }, [fontsReady, fontsError]);

  if (!fontsReady && !fontsError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ViewportProvider>
            <AuthenticatedRoot />
          </ViewportProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <RevenueCatProvider userId={user?.id ?? null}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "fade_from_bottom",
            animationDuration: 280,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        >
          <Stack.Screen name="index" options={{ animation: "fade" }} />
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
          <Stack.Screen
            name="onboarding"
            options={{ animation: "fade", gestureEnabled: false }}
          />
          <Stack.Screen
            name="sos"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
              animationDuration: 320,
            }}
          />
          <Stack.Screen
            name="paywall"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
              animationDuration: 320,
            }}
          />
          <Stack.Screen
            name="ai-prayer"
            options={{
              presentation: "card",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="meditation/[id]"
            options={{
              presentation: "fullScreenModal",
              animation: "fade",
              animationDuration: 350,
            }}
          />
        </Stack>
        <ConnectivityBanners />
      </RevenueCatProvider>
    </View>
  );
}

function AuthenticatedRoot() {
  return (
    <AuthProvider>
      <ConnectivityProvider>
        <RootNavigator />
      </ConnectivityProvider>
    </AuthProvider>
  );
}
