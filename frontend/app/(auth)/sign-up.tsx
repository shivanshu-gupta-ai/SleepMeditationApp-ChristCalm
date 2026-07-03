import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, radius } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";
import GoogleSignInButton, { AuthDivider } from "@/src/components/GoogleSignInButton";

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      // Persist onboarding answers if any
      try {
        await api.saveOnboarding(null, []);
      } catch {
        // ignore
      }
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="signup-back">
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.overline}>CREATE ACCOUNT</Text>
          <Text style={styles.title}>Begin your journey.</Text>
          <Text style={styles.sub}>A tender space for your heart, rooted in Christ.</Text>

          <View style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
            <GoogleSignInButton label="Sign up with Google" onError={setError} />
          </View>
          <AuthDivider text="OR SIGN UP WITH EMAIL" />

          {error && (
            <View style={styles.errorBox} testID="signup-error">
              <Ionicons name="alert-circle" size={18} color={colors.accentSOSDark} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your first name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              testID="signup-name-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              testID="signup-email-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password (6+ characters)</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Create a password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                testID="signup-password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.cta}
            onPress={submit}
            disabled={loading}
            testID="signup-submit-btn"
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.ctaText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.linkRow}>
            <Text style={styles.linkPre}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity testID="switch-to-signin">
                <Text style={styles.link}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.md },
  backBtn: { padding: spacing.sm, marginBottom: spacing.md, alignSelf: "flex-start" },
  overline: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: 34,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.8,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#FCEDEB",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.accentSOSDark, fontFamily: fonts.body, flex: 1 },
  field: { marginBottom: spacing.md },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  eyeBtn: { position: "absolute", right: 12, padding: spacing.sm },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 18,
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  ctaText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 17 },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  linkPre: { fontFamily: fonts.body, color: colors.textSecondary },
  link: { fontFamily: fonts.bodyBold, color: colors.primary },
});
