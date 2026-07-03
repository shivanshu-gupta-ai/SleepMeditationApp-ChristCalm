import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, radius, shadows } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";

export default function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "?").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name} testID="profile-name">
            {user?.name}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.is_premium ? (
            <View style={styles.premiumChip}>
              <Ionicons name="star" size={14} color={colors.white} />
              <Text style={styles.premiumChipText}>Premium Member</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.upgradeBanner}
              onPress={() => router.push("/paywall")}
              testID="profile-upgrade-btn"
            >
              <Ionicons name="star" size={16} color={colors.white} />
              <Text style={styles.upgradeBannerText}>Unlock Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.minutes_meditated ?? 0}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.prayers_completed ?? 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          <MenuItem
            icon="heart-outline"
            label="Panic Relief (SOS)"
            onPress={() => router.push("/sos")}
            testID="menu-sos"
          />
          <MenuItem
            icon="sparkles-outline"
            label="AI Prayer Generator"
            onPress={() => router.push("/ai-prayer")}
            testID="menu-ai-prayer"
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
          />
        </View>

        <Text style={styles.footerText}>
          "The Lord is close to the brokenhearted." — Psalm 34:18
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
  testID,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={22} color={danger ? colors.accentSOSDark : colors.textPrimary} />
      <Text style={[styles.menuLabel, danger && { color: colors.accentSOSDark }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: "center", paddingTop: spacing.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarText: { fontFamily: fonts.headingBold, fontSize: 34, color: colors.white },
  name: {
    fontFamily: fonts.headingBold,
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  email: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  premiumChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.premium,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  premiumChipText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 13 },
  upgradeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.premium,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
    marginTop: spacing.md,
    ...shadows.soft,
  },
  upgradeBannerText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  statValue: {
    fontFamily: fonts.headingBold,
    fontSize: 26,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  menu: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  menuLabel: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.textPrimary },
  footerText: {
    textAlign: "center",
    fontFamily: fonts.scriptureItalic,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
});
