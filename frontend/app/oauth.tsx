import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "@/src/context/ThemeContext";

WebBrowser.maybeCompleteAuthSession();

/** Cognito Hosted UI redirect target (web + mobile deep link). */
export default function OAuthCallback() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/(auth)/sign-in"), 1200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}