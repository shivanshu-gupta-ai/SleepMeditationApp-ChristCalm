import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { useResponsive } from "@/src/hooks/use-responsive";

type Props = {
  children: React.ReactNode;
  edges?: Edge[];
  scroll?: boolean;
  keyboard?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /**
   * When true (default), centers a readable content column on tablet / wide layouts.
   * Set false for full-bleed screens (e.g. immersive players).
   */
  constrain?: boolean;
};

/**
 * Adaptive screen shell for iPhone SE → Pro Max and all iPads.
 * Horizontal padding + optional centered content max-width on large devices.
 */
export function Screen({
  children,
  edges = ["top"],
  scroll = false,
  keyboard = false,
  refreshing,
  onRefresh,
  contentStyle,
  style,
  testID,
  constrain = true,
}: Props) {
  const { colors } = useTheme();
  const { pagePadding, bottomClearance, contentMaxWidth, isTablet } = useResponsive();

  const columnStyle: ViewStyle = constrain
    ? {
        width: "100%",
        maxWidth: contentMaxWidth,
        alignSelf: "center",
      }
    : {
        width: "100%",
        maxWidth: "100%",
      };

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        columnStyle,
        {
          paddingHorizontal: pagePadding,
          paddingBottom: bottomClearance,
        },
        contentStyle,
      ]}
      style={styles.fill}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces
      // Slightly roomier bounce feel on iPad
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, styles.centerCol]}>
      <View
        style={[
          styles.fill,
          columnStyle,
          {
            paddingHorizontal: pagePadding,
            // Leave room for floating tab bar on non-scroll screens
            paddingBottom: isTablet ? bottomClearance * 0.4 : bottomClearance * 0.35,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );

  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView
      style={[styles.fill, { backgroundColor: colors.background }, style]}
      edges={edges}
      testID={testID}
    >
      {wrapped}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: "100%", maxWidth: "100%" },
  centerCol: { alignItems: "center" },
  scrollContent: { flexGrow: 1 },
});
