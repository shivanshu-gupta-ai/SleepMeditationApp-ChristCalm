import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  fullScreen?: boolean;
  testID?: string;
};

export function ErrorState({
  title = "Something went quiet",
  message = "We couldn't load this right now. Take a breath and try again.",
  onRetry,
  retryLabel = "Try again",
  fullScreen = true,
  testID = "error-state",
}: Props) {
  const { colors, fonts, spacing, radius, shadows } = useTheme();

  return (
    <View
      style={[styles.wrap, fullScreen && styles.full, { backgroundColor: colors.background }]}
      testID={testID}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSoft,
            borderRadius: radius.lg,
            ...shadows.soft,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.dangerSoft }]}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
        </View>
        <Text
          style={{
            fontFamily: fonts.headingBold,
            fontSize: 20,
            color: colors.textPrimary,
            textAlign: "center",
            letterSpacing: -0.3,
            marginTop: spacing.md,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
            marginTop: spacing.sm,
          }}
        >
          {message}
        </Text>
        {onRetry ? (
          <TouchableOpacity
            onPress={onRetry}
            style={[
              styles.retry,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.full,
                marginTop: spacing.lg,
              },
            ]}
            activeOpacity={0.85}
            testID={`${testID}-retry`}
          >
            <Ionicons name="refresh" size={18} color={colors.white} />
            <Text
              style={{
                color: colors.white,
                fontFamily: fonts.bodyBold,
                fontSize: 15,
              }}
            >
              {retryLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function ErrorBanner({
  message,
  onDismiss,
  testID = "error-banner",
}: {
  message: string;
  onDismiss?: () => void;
  testID?: string;
}) {
  const { colors, fonts, spacing, radius } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.dangerSoft,
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.accentSOS + "33",
      }}
      testID={testID}
    >
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.danger }}>
        {message}
      </Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} hitSlop={12}>
          <Ionicons name="close" size={18} color={colors.danger} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  full: { flex: 1 },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  retry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
});
