import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type ThemePreference } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/features/auth";
import { usePremium, useRevenueCat } from "@/src/features/subscriptions";
import { layout } from "@/src/theme/layout";
import {
  Screen,
  PageHeader,
  Button,
  Surface,
  FadeIn,
  FeedbackCard,
} from "@/src/components/ui";
import { useResponsive } from "@/src/hooks/use-responsive";
import {
  isFocusPromptEnabled,
  openSystemFocusSettings,
  setFocusPromptEnabled,
} from "@/src/utils/focus-mode";

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "Light",
  light: "Light",
  dark: "Dark",
};

const THEME_ICONS: Record<ThemePreference, keyof typeof Ionicons.glyphMap> = {
  system: "sunny-outline",
  light: "sunny-outline",
  dark: "moon-outline",
};

export default function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPremium, subscriptionTier, plan } = usePremium();
  const { supported: rcSupported, presentCustomerCenter, presentPaywallIfNeeded } =
    useRevenueCat();
  const { colors, fonts, spacing, radius, preference, setPreference } = useTheme();
  const { bottomClearance, isCompact } = useResponsive();
  const [focusPrompt, setFocusPrompt] = useState(true);

  useEffect(() => {
    isFocusPromptEnabled().then(setFocusPrompt);
  }, []);

  const cycleTheme = () => {
    // Light is product default; dark only when the user opts in (no System).
    const order: ThemePreference[] = ["light", "dark"];
    const current = preference === "dark" ? "dark" : "light";
    const idx = order.indexOf(current);
    setPreference(order[(idx + 1) % order.length]);
  };

  return (
    <Screen
      scroll
      contentStyle={{
        paddingTop: isCompact ? 12 : layout.pageTop,
        paddingBottom: bottomClearance,
      }}
    >
      <FadeIn>
        <PageHeader overline="Your space" title="Profile" subtitle={user?.email || undefined} />
      </FadeIn>

      <FadeIn delay={40}>
        <View style={{ alignItems: "center", marginBottom: layout.sectionGap }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.primarySoft,
              borderWidth: 2,
              borderColor: colors.primary + "55",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.headingBold,
                fontSize: 34,
                color: colors.primary,
              }}
            >
              {(user?.name || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: fonts.headingBold,
              fontSize: 24,
              color: colors.textPrimary,
              letterSpacing: -0.4,
            }}
            testID="profile-name"
          >
            {user?.name}
          </Text>

          {isPremium ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: colors.premiumSoft,
                borderWidth: 1,
                borderColor: colors.premium + "55",
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: radius.full,
                marginTop: spacing.md,
              }}
              testID="profile-premium-badge"
              accessibilityLabel={`Subscription tier ${subscriptionTier}${plan ? `, plan ${plan}` : ""}`}
            >
              <Ionicons name="star" size={14} color={colors.premium} />
              <Text style={{ color: colors.premiumDark, fontFamily: fonts.bodyBold, fontSize: 13 }}>
                Premium{plan ? ` · ${plan}` : ""}
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: spacing.md, width: "72%", alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: colors.textMuted,
                  marginBottom: spacing.sm,
                }}
                testID="profile-free-badge"
              >
                Free plan
              </Text>
              <Button
                label="Unlock Premium"
                variant="premium"
                icon="star"
                onPress={() => router.push("/paywall")}
                testID="profile-upgrade-btn"
              />
            </View>
          )}
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 13,
            letterSpacing: 0.2,
            color: colors.textMuted,
            marginBottom: spacing.md,
          }}
        >
          Preferences
        </Text>
        <Surface padded={false} style={{ marginBottom: spacing.lg, overflow: "hidden" }}>
          <MenuItem
            icon={THEME_ICONS[preference]}
            label="Appearance"
            value={THEME_LABELS[preference]}
            onPress={cycleTheme}
            testID="menu-theme"
          />
          <MenuItem
            icon="notifications-off-outline"
            label="Silence notifications"
            value="Focus / DND"
            onPress={() => void openSystemFocusSettings()}
            testID="menu-silence-notifications"
          />
          <MenuItem
            icon="moon-outline"
            label="Remind before sessions"
            value={focusPrompt ? "On" : "Off"}
            onPress={async () => {
              const next = !focusPrompt;
              setFocusPrompt(next);
              await setFocusPromptEnabled(next);
            }}
            testID="menu-focus-prompt"
            last
          />
        </Surface>

        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 13,
            letterSpacing: 0.2,
            color: colors.textMuted,
            marginBottom: spacing.md,
          }}
        >
          Support
        </Text>
        <FeedbackCard />

        <Text
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 13,
            letterSpacing: 0.2,
            color: colors.textMuted,
            marginBottom: spacing.md,
          }}
        >
          Journey
        </Text>
        <Surface padded={false} style={{ overflow: "hidden" }}>
          <MenuItem
            icon="stats-chart-outline"
            label="Your Journey"
            onPress={() => router.push("/(tabs)/stats")}
            testID="menu-stats"
          />
          <MenuItem
            icon="create-outline"
            label="Journal"
            onPress={() => router.push("/(tabs)/journal")}
            testID="menu-journal"
          />
          <MenuItem
            icon="heart-outline"
            label="Panic Relief (SOS)"
            onPress={() => router.push("/sos")}
            testID="menu-sos"
          />
          <MenuItem
            icon="chatbubbles-outline"
            label="What would Jesus say?"
            onPress={() => router.push("/(tabs)/wisdom")}
            testID="menu-wisdom"
          />
          <MenuItem
            icon="star-outline"
            label={isPremium ? "Upgrade / Change plan" : "Unlock Premium"}
            onPress={() => {
              if (rcSupported) {
                presentPaywallIfNeeded().catch(() => router.push("/paywall"));
              } else {
                router.push("/paywall");
              }
            }}
            testID="menu-subscription"
          />
          {rcSupported ? (
            <MenuItem
              icon="card-outline"
              label="Manage Subscription"
              onPress={() => {
                presentCustomerCenter().catch(() => router.push("/paywall"));
              }}
              testID="menu-customer-center"
            />
          ) : null}
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/sign-in");
            }}
            danger
            testID="menu-signout"
            last
          />
        </Surface>
      </FadeIn>

      <Text
        style={{
          textAlign: "center",
          fontFamily: fonts.scripture,
          fontSize: 15,
          color: colors.textSecondary,
          marginTop: layout.sectionGap,
          lineHeight: 22,
          letterSpacing: -0.1,
        }}
      >
        “Be still, and know that I am God.”
      </Text>
    </Screen>
  );
}

function MenuItem({
  icon,
  label,
  value,
  onPress,
  danger,
  last,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
  testID?: string;
}) {
  const { colors, fonts, spacing, isDark } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      testID={testID}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: spacing.md,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderSoft,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: danger ? colors.dangerSoft : colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.bodyBold,
          fontSize: 15,
          color: danger ? colors.danger : colors.textPrimary,
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textMuted }}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}
