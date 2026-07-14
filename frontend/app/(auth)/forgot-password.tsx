import React, { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import BackButton from "@/src/components/BackButton";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import { Screen, Button, TextField, ErrorBanner, SectionHeader } from "@/src/components/ui";

export default function ForgotPassword() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const { colors, fonts, spacing } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) {
      setError("Enter your email");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      router.push({ pathname: "/(auth)/reset-password", params: { email: email.trim() } });
    } catch (e: any) {
      setError(e.message || "Could not send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard edges={["top", "bottom"]} contentStyle={{ paddingTop: spacing.md }}>
      <BackButton fallback="/(auth)/sign-in" size={24} style={{ marginBottom: spacing.md }} />

      <SectionHeader
        overline="Reset password"
        title="We'll send a code."
        subtitle="Enter the email on your account and we'll email a reset code."
        large
      />

      {error ? (
        <View style={{ marginBottom: spacing.md }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </View>
      ) : null}

      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="forgot-email-input"
      />

      <Button label="Send Reset Code" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />

      <Text
        style={{
          fontFamily: fonts.body,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.xl,
        }}
      >
        Codes expire after a short time. Check spam if you don't see the email.
      </Text>
    </Screen>
  );
}