import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type ThemePreference } from "@/src/context/ThemeContext";
import { useAuth } from "@/src/context/AuthContext";
import { usePremium } from "@/src/hooks/use-premium";
import { layout } from "@/src/theme/layout";
import { Screen, PageHeader, Button, Surface, FadeIn } from "@/src/components/ui";

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const THEME_ICONS: Record<ThemePreference, keyof typeof Ionicons.glyphMap> = {
  system: "phone-portrait-outline",
  light: "sunny-outline",
  dark: "moon-outline",
};

export default function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPremium } = usePremium();
  const { colors, fonts, spacing, radius, shadows, preference, setPreference, isDark } =
    useTheme();

  const cycleTheme = () => {
    const order: ThemePreference[] = ["dark", "light", "system"];
    const idx = order.indexOf(preference);
    setPreference(order[(idx + 1) % order.length]);
  };

  return (
    <Screen
      scroll
      contentStyle={{ paddingTop: layout.pageTop, paddingBottom: layout.pageBottom }}
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
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: spacing.md,
              ...shadows.glow,
            }}
          >
            <Text style={{ fontFamily: fonts.headingBold, fontSize: 34, color: colors.white }}>
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
                backgroundColor: colors.premium,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: radius.full,
                marginTop: spacing.md,
              }}
            >
              <Ionicons name="star" size={14} color={colors.white} />
              <Text style={{ color: colors.white, fontFamily: fonts.bodyBold, fontSize: 13 }}>
                Premium Member
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: spacing.md, width: "72%" }}>
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
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: layout.sectionGap }}>
          {[
            { value: user?.streak ?? 0, label: "Day streak" },
            { value: user?.minutes_meditated ?? 0, label: "Minutes" },
            { value: user?.prayers_completed ?? 0, label: "Sessions" },
          ].map((s) => (
            <Surface
              key={s.label}
              elevated={false}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                alignItems: "center",
                ...shadows.soft,
              }}
            >
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 24, color: colors.primary }}>
                {s.value}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginTop: 4,
                }}
              >
                {s.label}
              </Text>
            </Surface>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={120}>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: layout.overlineSize,
            letterSpacing: layout.overlineTracking,
            textTransform: "uppercase",
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
        </Surface>

        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: layout.overlineSize,
            letterSpacing: layout.overlineTracking,
            textTransform: "uppercase",
            color: colors.textMuted,
            marginBottom: spacing.md,
          }}
        >
          Journey
        </Text>
        <Surface padded={false} style={{ overflow: "hidden" }}>
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
            label="Manage Subscription"
            onPress={() => router.push("/paywall")}
            testID="menu-subscription"
          />
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
          fontFamily: fonts.scriptureItalic,
          fontSize: 15,
          color: colors.textSecondary,
          marginTop: layout.sectionGap,
          lineHeight: 22,
        }}
      >
        “The Lord is close to the brokenhearted.” — Psalm 34:18
      </Text>
      <Text
        style={{
          textAlign: "center",
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
          marginTop: spacing.sm,
        }}
      >
        {isDark ? "Dark" : "Light"} calm · ChristCalm
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
  const { colors, fonts, spacing } = useTheme();
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md + 2,
        gap: spacing.md,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderSoft,
      }}
      onPress={onPress}
      testID={testID}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.textPrimary} />
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.body,
          fontSize: 16,
          color: danger ? colors.danger : colors.textPrimary,
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary }}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}
