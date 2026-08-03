import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import BackButton from "@/src/components/BackButton";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import { Screen, Button, TextField, ErrorBanner, SectionHeader } from "@/src/components/ui";

export default function ConfirmEmail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { confirmEmail, resendEmailCode, signIn } = useAuth();
  const { colors, fonts, spacing } = useTheme();
  const [email, setEmail] = useState((params.email as string) || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !code.trim()) {
      setError("Enter your email and verification code");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmEmail(email.trim(), code.trim());
      if (password) {
        await signIn(email.trim(), password);
      }
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email.trim()) {
      setError("Enter your email first");
      return;
    }
    setError(null);
    setResending(true);
    try {
      await resendEmailCode(email.trim());
      setMessage("A new code was sent to your email.");
    } catch (e: any) {
      setError(e.message || "Could not resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen scroll keyboard edges={["top", "bottom"]} contentStyle={{ paddingTop: spacing.md }}>
      <BackButton
        fallback="/(auth)/sign-in?mode=signup"
        size={24}
        style={{ marginBottom: spacing.md }}
      />

      <SectionHeader
        overline="Verify email"
        title="Check your inbox."
        subtitle="Enter the 6-digit code we sent to confirm your account."
        large
      />

      {error ? (
        <View style={{ marginBottom: spacing.md }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </View>
      ) : null}

      {message ? (
        <Text style={{ fontFamily: fonts.body, color: colors.primary, marginBottom: spacing.md }}>{message}</Text>
      ) : null}

      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="confirm-email-input"
      />

      <TextField
        label="Verification code"
        placeholder="123456"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        testID="confirm-code-input"
      />

      <TextField
        label="Password (optional)"
        placeholder="Sign in after verifying"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="confirm-password-input"
      />

      <Button label="Verify & Continue" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />

      <TouchableOpacity onPress={resend} disabled={resending} style={{ marginTop: spacing.lg, alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.bodyBold, color: colors.primary }}>
          {resending ? "Sending…" : "Resend code"}
        </Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.xl, gap: spacing.xs }}>
        <Text style={{ fontFamily: fonts.body, color: colors.textSecondary }}>Wrong email?</Text>
        <Link href="/(auth)/sign-in?mode=signup" asChild>
          <TouchableOpacity>
            <Text style={{ fontFamily: fonts.bodyBold, color: colors.primary }}>Back to account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </Screen>
  );
}