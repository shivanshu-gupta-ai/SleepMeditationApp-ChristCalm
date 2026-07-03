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

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useAuth();
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="signin-back">
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.overline}>WELCOME BACK</Text>
          <Text style={styles.title}>Peace is waiting.</Text>
          <Text style={styles.sub}>Sign in to continue your journey.</Text>

          {error && (
            <View style={styles.errorBox} testID="signin-error">
              <Ionicons name="alert-circle" size={18} color={colors.accentSOSDark} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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
              testID="signin-email-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                testID="signin-password-input"
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
            testID="signin-submit-btn"
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.ctaText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.linkRow}>
            <Text style={styles.linkPre}>New to ChristCalm?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity testID="switch-to-signup">
                <Text style={styles.link}>Create an account</Text>
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
  eyeBtn: {
    position: "absolute",
    right: 12,
    padding: spacing.sm,
  },
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
