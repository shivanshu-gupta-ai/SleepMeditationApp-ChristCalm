import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";

const AUTH_HOST = "https://auth.emergentagent.com";

type Props = {
  label?: string;
  onError?: (message: string) => void;
};

/**
 * Sign in with Google (Emergent-managed OAuth).
 *
 * Web: does a full-page navigation to the auth host; the app remounts at
 * `/#session_id=...` and AuthContext detects and processes it.
 * Mobile: opens `WebBrowser.openAuthSessionAsync`, reads `result.url`, then
 * hands the session_id to AuthContext.loginWithGoogleSessionId.
 */
export default function GoogleSignInButton({ label = "Continue with Google", onError }: Props) {
  const router = useRouter();
  const { loginWithGoogleSessionId, googleAuthPending } = useAuth();
  const [loading, setLoading] = useState(false);

  const startAuth = async () => {
    setLoading(true);
    try {
      let redirectUrl: string;

      if (Platform.OS === "web" && typeof window !== "undefined") {
        redirectUrl = window.location.origin + "/";
        const authUrl = `${AUTH_HOST}/?redirect=${encodeURIComponent(redirectUrl)}`;
        window.location.href = authUrl;
        return; // page will unload
      }

      redirectUrl = Linking.createURL("auth");
      const authUrl = `${AUTH_HOST}/?redirect=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type !== "success" || !result.url) {
        setLoading(false);
        return; // user cancelled
      }

      const match = result.url.match(/[#?&]session_id=([^&]+)/);
      const sessionId = match ? decodeURIComponent(match[1]) : null;
      if (!sessionId) {
        onError?.("No session returned from Google");
        setLoading(false);
        return;
      }

      await loginWithGoogleSessionId(sessionId);
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
      style={styles.btn}
      onPress={startAuth}
      disabled={isBusy}
      testID="google-signin-btn"
      activeOpacity={0.85}
    >
      {isBusy ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <>
          <View style={styles.gIconWrap}>
            <Text style={styles.gIcon}>G</Text>
          </View>
          <Text style={styles.label}>{label}</Text>
          <View style={{ width: 22 }} />
        </>
      )}
    </TouchableOpacity>
  );
}

export function AuthDivider({ text = "or" }: { text?: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
  },
  gIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  gIcon: {
    fontFamily: fonts.headingBold,
    fontWeight: "700",
    fontSize: 16,
    color: "#4285F4",
    lineHeight: 20,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontWeight: "600",
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: "center",
    flex: 1,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderSoft },
  dividerText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, letterSpacing: 1 },
});
