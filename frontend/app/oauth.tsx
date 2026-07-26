import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "@/src/context/ThemeContext";

// Completes AuthSession when Hosted UI returns to this route (web + deep link)
WebBrowser.maybeCompleteAuthSession();

/**
 * Cognito Hosted UI redirect target.
 * - Native: AuthSession.promptAsync usually captures the code before this screen is needed.
 * - Web: full-page return lands here; maybeCompleteAuthSession hands the code back to the opener.
 */
export default function OAuthCallback() {
  const router = useRouter();
  const { colors, fonts, spacing } = useTheme();
  const [note, setNote] = useState("Finishing sign-in…");

  useEffect(() => {
    // Give AuthSession a beat to receive the redirect, then return to sign-in.
    // Successful Apple/email flows navigate home from the sign-in/sign-up handlers.
    const t = setTimeout(() => {
      setNote("Taking you back…");
      router.replace("/(auth)/sign-in");
    }, 900);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
        padding: spacing.lg,
        gap: 12,
      }}
    >
      <ActivityIndicator color={colors.primary} />
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
        }}
      >
        {note}
      </Text>
    </View>
  );
}
