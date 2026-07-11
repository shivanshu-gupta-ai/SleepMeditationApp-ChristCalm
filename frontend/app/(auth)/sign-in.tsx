import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "@/src/components/BackButton";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import GoogleSignInButton, { AuthDivider } from "@/src/components/GoogleSignInButton";
import { Screen, Button, TextField, ErrorBanner, SectionHeader, FadeIn } from "@/src/components/ui";

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, fonts, spacing } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboard edges={["top", "bottom"]} contentStyle={{ paddingTop: spacing.md }}>
      <FadeIn>
        <BackButton fallback="/onboarding" size={24} style={{ marginBottom: spacing.md }} testID="signin-back" />

        <SectionHeader
          overline="Welcome back"
          title="Peace is waiting."
          subtitle="Sign in to continue your journey."
          large
        />
      </FadeIn>

      <FadeIn delay={80}>
        <View style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>
          <GoogleSignInButton label="Sign in with Google" onError={setError} />
        </View>
        <AuthDivider text="OR CONTINUE WITH EMAIL" />

        {error ? (
          <View style={{ marginBottom: spacing.md }}>
            <ErrorBanner message={error} onDismiss={() => setError(null)} testID="signin-error" />
          </View>
        ) : null}

        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          testID="signin-email-input"
        />

        <TextField
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          testID="signin-password-input"
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
          label="Sign In"
          icon="arrow-forward"
          iconPosition="right"
          onPress={submit}
          loading={loading}
          testID="signin-submit-btn"
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
            New to ChristCalm?
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity testID="switch-to-signup">
              <Text style={{ fontFamily: fonts.bodyBold, color: colors.primary }}>
                Create an account
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </FadeIn>
    </Screen>
  );
}
