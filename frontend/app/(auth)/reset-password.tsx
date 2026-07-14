import React, { useState } from "react";
import { View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import BackButton from "@/src/components/BackButton";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import { validateCognitoPassword } from "@/src/utils/password";
import { Screen, Button, TextField, ErrorBanner, SectionHeader } from "@/src/components/ui";

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { resetPassword, signIn } = useAuth();
  const { spacing } = useTheme();
  const [email, setEmail] = useState((params.email as string) || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const pwErr = validateCognitoPassword(password);
    if (!email.trim() || !code.trim() || pwErr) {
      setError(pwErr || "Fill in all fields");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim(), code.trim(), password);
      await signIn(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard edges={["top", "bottom"]} contentStyle={{ paddingTop: spacing.md }}>
      <BackButton fallback="/(auth)/forgot-password" size={24} style={{ marginBottom: spacing.md }} />

      <SectionHeader
        overline="New password"
        title="Choose a new password."
        subtitle="Enter the code from your email and a new password (8+ chars, upper, lower, number)."
        large
      />

      {error ? (
        <View style={{ marginBottom: spacing.md }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </View>
      ) : null}

      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Reset code" value={code} onChangeText={setCode} keyboardType="number-pad" />
      <TextField label="New password" value={password} onChangeText={setPassword} secureTextEntry />

      <Button label="Update Password" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />
    </Screen>
  );
}