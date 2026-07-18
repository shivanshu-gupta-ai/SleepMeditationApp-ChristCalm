import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "@/src/components/BackButton";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import { api } from "@/src/api/client";
import { AuthDivider, AppleSignInButton } from "@/src/features/auth";
import {
  loadOnboardingDraft,
  clearOnboardingDraft,
  draftToApiPayload,
} from "@/src/utils/onboarding-draft";
import { validateCognitoPassword } from "@/src/utils/password";
import { Screen, Button, TextField, ErrorBanner, SectionHeader } from "@/src/components/ui";

export default function SignUp() {
  const router = useRouter();
  const { signUp, signInWithApple, appleEnabled } = useAuth();
  const { colors, fonts, spacing } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOnboardingDraft().then((draft) => {
      if (draft.name) setName(draft.name);
    });
  }, []);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    const pwErr = validateCognitoPassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await signUp(name.trim(), email.trim(), password);
      if (!result.userConfirmed) {
        router.push({ pathname: "/(auth)/confirm-email", params: { email: result.email } });
        return;
      }
      try {
        const draft = await loadOnboardingDraft();
        await api.saveOnboarding(draftToApiPayload(draft));
        await clearOnboardingDraft();
      } catch {
        // ignore draft sync failures
      }
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard edges={["top", "bottom"]} contentStyle={{ paddingTop: spacing.md }}>
      <BackButton fallback="/onboarding" size={24} style={{ marginBottom: spacing.md }} testID="signup-back" />

      <SectionHeader
        overline="Create account"
        title="Begin your journey."
        subtitle="A tender space for your heart, rooted in Christ."
        large
      />

      {error ? (
        <View style={{ marginBottom: spacing.md, marginTop: spacing.sm }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} testID="signup-error" />
        </View>
      ) : null}

      {appleEnabled ? (
        <>
          <View style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>
            <AppleSignInButton
              label="Sign up with Apple"
              onPress={async () => {
                try {
                  await signInWithApple();
                  try {
                    const draft = await loadOnboardingDraft();
                    await api.saveOnboarding(draftToApiPayload(draft));
                    await clearOnboardingDraft();
                  } catch {
                    // ignore
                  }
                  router.replace("/(tabs)/home");
                } catch (e: any) {
                  setError(e?.message || "Apple sign-up failed");
                }
              }}
            />
          </View>
          <AuthDivider text="OR SIGN UP WITH EMAIL" />
        </>
      ) : null}

      <TextField
        label="Name"
        placeholder="Your first name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        testID="signup-name-input"
      />

      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        testID="signup-email-input"
      />

      <TextField
        label="Password (8+ chars, upper, lower, number)"
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        testID="signup-password-input"
        rightSlot={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        }
      />

      <Button
        label="Create Account"
        icon="arrow-forward"
        iconPosition="right"
        onPress={submit}
        loading={loading}
        testID="signup-submit-btn"
        style={{ marginTop: spacing.sm }}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: spacing.xl,
          gap: spacing.xs,
        }}
      >
        <Text style={{ fontFamily: fonts.body, color: colors.textSecondary }}>
          Already have an account?
        </Text>
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity testID="switch-to-signin">
            <Text style={{ fontFamily: fonts.bodyBold, color: colors.primary }}>Sign in</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </Screen>
  );
}
