import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

type Props = {
  label?: string;
  onError?: (message: string) => void;
};

export default function GoogleSignInButton({ label = "Continue with Google", onError }: Props) {
  const router = useRouter();
  const { loginWithGoogleToken, googleAuthPending } = useAuth();
  const { colors, fonts, radius, spacing } = useTheme();
  const [loading, setLoading] = useState(false);

  const startAuth = async () => {
    if (!BACKEND_URL) {
      onError?.("Backend URL is not configured");
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = Linking.createURL("auth");
      const authUrl = `${BACKEND_URL}/api/auth/google/start?redirect_uri=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type !== "success" || !result.url) {
        setLoading(false);
        return;
      }

      const match = result.url.match(/[#?&]cc_token=([^&]+)/);
      const token = match ? decodeURIComponent(match[1]) : null;
      if (!token) {
        onError?.("No token returned from Google sign-in");
        setLoading(false);
        return;
      }

      await loginWithGoogleToken(token);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      onError?.(e?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || googleAuthPending;

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.surface,
        borderRadius: radius.full,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderWidth: 1.5,
        borderColor: colors.borderSoft,
      }}
      onPress={startAuth}
      disabled={isBusy}
      testID="google-signin-btn"
      activeOpacity={0.85}
    >
      {isBusy ? (
        <ActivityIndicator color={colors.textPrimary} style={{ flex: 1 }} />
      ) : (
        <>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.white,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.headingBold,
                fontWeight: "700",
                fontSize: 16,
                color: "#4285F4",
                lineHeight: 20,
              }}
            >
              G
            </Text>
          </View>
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontWeight: "600",
              fontSize: 15,
              color: colors.textPrimary,
              textAlign: "center",
              flex: 1,
            }}
          >
            {label}
          </Text>
          <View style={{ width: 22 }} />
        </>
      )}
    </TouchableOpacity>
  );
}

export function AuthDivider({ text = "or" }: { text?: string }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginVertical: spacing.md,
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSoft }} />
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
          letterSpacing: 1,
        }}
      >
        {text}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSoft }} />
    </View>
  );
}
