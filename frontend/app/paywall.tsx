import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { colors, fonts, spacing, radius, shadows } from "@/src/theme";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

const FEATURES = [
  { icon: "leaf", label: "Unlimited emotion-based meditations" },
  { icon: "sparkles", label: "AI personal prayer generator" },
  { icon: "book", label: "Full prayer library (all categories)" },
  { icon: "musical-notes", label: "Guided audio sessions" },
  { icon: "heart", label: "Priority SOS support" },
  { icon: "cloud-offline", label: "Ad-free forever" },
];

export default function Paywall() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const origin =
        process.env.EXPO_PUBLIC_BACKEND_URL ||
        "https://example.com";
      const res = await api.createCheckout(plan, origin);
      setCheckoutSessionId(res.session_id);
      await WebBrowser.openBrowserAsync(res.url);
    } catch (e: any) {
      setError(e.message || "Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Poll subscription status when user comes back to app
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active" && checkoutSessionId) {
        try {
          const v = await api.verifyCheckout(checkoutSessionId);
          if (v.active) {
            await refreshUser();
            router.replace("/(tabs)/home");
          }
        } catch {}
      }
    });
    return () => sub.remove();
  }, [checkoutSessionId, refreshUser, router]);

  const priceLabel = plan === "monthly" ? "$9.99 / month" : "$59.99 / year";
  const priceSubLabel = plan === "annual" ? "Just $5.00 / month — save 50%" : "Billed monthly";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} testID="paywall-close-btn">
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <LinearGradient
          colors={[colors.premium, colors.premiumDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="star" size={30} color={colors.white} />
          </View>
          <Text style={styles.heroTitle}>ChristCalm Premium</Text>
          <Text style={styles.heroSub}>
            Full access to every meditation, prayer, and calm tool.
          </Text>
        </LinearGradient>

        {user?.is_premium && (
          <View style={styles.activeBanner} testID="paywall-active-banner">
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            <Text style={styles.activeText}>You're a Premium member — thank you!</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>What's included</Text>
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Choose your plan</Text>

        <TouchableOpacity
          style={[styles.planCard, plan === "annual" && styles.planCardActive]}
          onPress={() => setPlan("annual")}
          testID="plan-annual"
        >
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeText}>SAVE 50%</Text>
          </View>
          <Text style={styles.planLabel}>Annual</Text>
          <Text style={styles.planPrice}>$59.99</Text>
          <Text style={styles.planSub}>$5.00 / month · billed yearly</Text>
          {plan === "annual" && (
            <View style={styles.planCheck}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, plan === "monthly" && styles.planCardActive]}
          onPress={() => setPlan("monthly")}
          testID="plan-monthly"
        >
          <Text style={styles.planLabel}>Monthly</Text>
          <Text style={styles.planPrice}>$9.99</Text>
          <Text style={styles.planSub}>billed monthly</Text>
          {plan === "monthly" && (
            <View style={styles.planCheck}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>

        {!user?.is_premium && (
          <>
            {error && (
              <View style={styles.errorBox} testID="paywall-error">
                <Ionicons name="alert-circle" size={18} color={colors.accentSOSDark} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={start}
              disabled={loading}
              testID="paywall-subscribe-btn"
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.ctaText}>Subscribe · {priceLabel}</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.white} />
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.finePrint}>
          {priceSubLabel} · Cancel anytime · Secure checkout via Stripe
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  closeBtn: { alignSelf: "flex-end", padding: spacing.sm, marginBottom: spacing.sm },
  hero: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 26,
    color: colors.white,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
    marginTop: 6,
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EEF6F7",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  activeText: { fontFamily: fonts.bodyBold, color: colors.primary, fontSize: 14 },
  sectionTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  featureList: { gap: spacing.sm },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF6F7",
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.borderSoft,
    marginBottom: spacing.md,
    position: "relative",
  },
  planCardActive: { borderColor: colors.primary },
  savingsBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: colors.premium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  savingsBadgeText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  planLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  planPrice: {
    fontFamily: fonts.headingBold,
    fontSize: 32,
    color: colors.textPrimary,
    marginTop: 4,
  },
  planSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  planCheck: { position: "absolute", right: 16, top: 16 },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radius.full,
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 15 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FCEDEB",
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  errorText: { color: colors.accentSOSDark, fontFamily: fonts.body, fontSize: 13, flex: 1 },
  finePrint: {
    textAlign: "center",
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
