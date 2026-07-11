import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { FadeIn } from "@/src/components/ui/FadeIn";

const GRACE = require("@/assets/images/grace-mascot.jpg");

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  /** Use Grace mascot for personality (empty / no-data) */
  withGrace?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/**
 * Calm empty state — optional Grace illustration for personality
 * (premium apps use mascot empties instead of bare text).
 */
export function EmptyState({
  icon = "leaf-outline",
  title,
  message,
  withGrace = true,
  actionLabel,
  onAction,
  testID = "empty-state",
}: Props) {
  const { colors, fonts, spacing, radius } = useTheme();

  return (
    <FadeIn>
      <View style={styles.wrap} testID={testID}>
        {withGrace ? (
          <View
            style={[
              styles.graceRing,
              {
                borderColor: colors.borderSoft,
                backgroundColor: colors.primarySoft,
              },
            ]}
          >
            <Image source={GRACE} style={styles.grace} accessibilityLabel="Grace" />
          </View>
        ) : (
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={icon} size={26} color={colors.primary} />
          </View>
        )}
        <Text
          style={{
            fontFamily: fonts.headingBold,
            fontSize: 17,
            color: colors.textPrimary,
            marginTop: spacing.md,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
        {message ? (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.textSecondary,
              marginTop: spacing.xs,
              textAlign: "center",
              lineHeight: 21,
              maxWidth: 280,
            }}
          >
            {message}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <Text
            onPress={onAction}
            style={{
              marginTop: spacing.md,
              fontFamily: fonts.bodyBold,
              fontSize: 14,
              color: colors.primary,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
            accessibilityRole="button"
          >
            {actionLabel}
          </Text>
        ) : null}
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  graceRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  grace: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});
