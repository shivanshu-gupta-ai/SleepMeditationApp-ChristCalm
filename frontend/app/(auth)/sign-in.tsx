import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "@/src/components/BackButton";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import { AuthDivider, AppleSignInButton } from "@/src/features/auth";
import { api } from "@/src/api/client";
import {
  loadOnboardingDraft,
  clearOnboardingDraft,
  draftToApiPayload,
} from "@/src/utils/onboarding-draft";
import { validateCognitoPassword } from "@/src/utils/password";
import {
  Screen,
  Button,
  TextField,
  ErrorBanner,
  SectionHeader,
  FadeIn,
} from "@/src/components/ui";

type AuthMode = "signin" | "signup";

/**
 * Unified auth — best practice: one screen, clear Sign in / Create account toggle.
 * Deep links: /(auth)/sign-in?mode=signup
 */
export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { signIn, signUp, signInWithApple, appleEnabled } = useAuth();
  const { colors, fonts, spacing, radius } = useTheme();

  const initialMode: AuthMode =
    params.mode === "signup" || params.mode === "sign-up" ? "signup" : "signin";
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.mode === "signup" || params.mode === "sign-up") {
      setMode("signup");
    } else if (params.mode === "signin" || params.mode === "sign-in") {
      setMode("signin");
    }
  }, [params.mode]);

  useEffect(() => {
    if (mode !== "signup") return;
    loadOnboardingDraft().then((draft) => {
      if (draft.name) setName(draft.name);
    });
  }, [mode]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setShowPassword(false);
  };

  const syncOnboardingDraft = async () => {
    try {
      const draft = await loadOnboardingDraft();
      await api.saveOnboarding(draftToApiPayload(draft));
      await clearOnboardingDraft();
    } catch {
      // draft sync is best-effort
    }
  };

  const submitSignIn = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      await syncOnboardingDraft();
      router.replace("/(tabs)/home");
    } catch (e: unknown) {
      const err = e as { message?: string };
      if (err.message === "USER_NOT_CONFIRMED") {
        router.push({
          pathname: "/(auth)/confirm-email",
          params: { email: email.trim() },
        });
        return;
      }
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
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
        router.push({
          pathname: "/(auth)/confirm-email",
          params: { email: result.email },
        });
        return;
      }
      await syncOnboardingDraft();
      router.replace("/(tabs)/home");
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  const onApple = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithApple();
      await syncOnboardingDraft();
      router.replace("/(tabs)/home");
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || "Apple sign-in failed";
      if (!/cancel/i.test(msg)) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        segment: {
          flexDirection: "row",
          backgroundColor: colors.surfaceAlt,
          borderRadius: radius.full,
          padding: 4,
          marginTop: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.borderSoft,
        },
        segBtn: {
          flex: 1,
          paddingVertical: 12,
          borderRadius: radius.full,
          alignItems: "center",
        },
        segBtnActive: {
          backgroundColor: colors.surface,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        segText: {
          fontFamily: fonts.bodyMedium,
          fontSize: 14,
          color: colors.textSecondary,
        },
        segTextActive: {
          fontFamily: fonts.bodyBold,
          color: colors.textPrimary,
        },
      }),
    [colors, fonts, spacing, radius]
  );

  const isSignIn = mode === "signin";

  return (
    <Screen scroll keyboard edges={["top", "bottom"]} contentStyle={{ paddingTop: spacing.md }}>
      <FadeIn>
        <BackButton
          fallback="/onboarding"
          size={24}
          style={{ marginBottom: spacing.md }}
          testID="auth-back"
        />

        <SectionHeader
          overline={isSignIn ? "Welcome back" : "Join ChristCalm"}
          title={isSignIn ? "Peace is waiting." : "Begin your journey."}
          subtitle={
            isSignIn
              ? "Sign in to continue."
              : "A quiet space for your heart."
          }
          large
        />

        <View style={styles.segment} accessibilityRole="tablist">
          <TouchableOpacity
            style={[styles.segBtn, isSignIn && styles.segBtnActive]}
            onPress={() => switchMode("signin")}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSignIn }}
            testID="auth-tab-signin"
          >
            <Text style={[styles.segText, isSignIn && styles.segTextActive]}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, !isSignIn && styles.segBtnActive]}
            onPress={() => switchMode("signup")}
            accessibilityRole="tab"
            accessibilityState={{ selected: !isSignIn }}
            testID="auth-tab-signup"
          >
            <Text style={[styles.segText, !isSignIn && styles.segTextActive]}>
              Create account
            </Text>
          </TouchableOpacity>
        </View>
      </FadeIn>

      <FadeIn delay={60} key={mode}>
        {error ? (
          <View style={{ marginBottom: spacing.md, marginTop: spacing.sm }}>
            <ErrorBanner message={error} onDismiss={() => setError(null)} testID="auth-error" />
          </View>
        ) : null}

        {appleEnabled ? (
          <>
            <View style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>
              <AppleSignInButton
                label="Continue with Apple"
                disabled={loading}
                onPress={onApple}
              />
            </View>
            <AuthDivider text="OR CONTINUE WITH EMAIL" />
          </>
        ) : null}

        {!isSignIn ? (
          <TextField
            label="Name"
            placeholder="Your first name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            testID="auth-name-input"
          />
        ) : null}

        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          testID="auth-email-input"
        />

        <TextField
          label={isSignIn ? "Password" : "Password"}
          placeholder={isSignIn ? "Your password" : "8+ chars, upper, lower, number"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete={isSignIn ? "password" : "password-new"}
          testID="auth-password-input"
          rightSlot={
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ padding: 8 }}
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          }
        />

        <Button
          label={isSignIn ? "Sign In" : "Create Account"}
          icon="arrow-forward"
          iconPosition="right"
          onPress={isSignIn ? submitSignIn : submitSignUp}
          loading={loading}
          testID="auth-submit-btn"
          style={{ marginTop: spacing.sm }}
        />

        {isSignIn ? (
          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            style={{ alignItems: "center", marginTop: spacing.md }}
            testID="forgot-password-link"
          >
            <Text style={{ fontFamily: fonts.body, color: colors.primary }}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: colors.textMuted,
              textAlign: "center",
              marginTop: spacing.md,
              lineHeight: 18,
            }}
          >
            By creating an account you agree to continue in peace and privacy.
          </Text>
        )}
      </FadeIn>
    </Screen>
  );
}
