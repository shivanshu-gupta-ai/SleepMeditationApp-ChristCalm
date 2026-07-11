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
  /** @deprecated Viewport is always phone-sized; kept for call-site compatibility */
  constrain?: boolean;
};

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
}: Props) {
  const { colors } = useTheme();
  const { pagePadding } = useResponsive();

  // Viewport is already phone-clamped (MobileShell on web) — full width of shell
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: pagePadding, paddingBottom: 40, width: "100%" },
        contentStyle,
      ]}
      style={styles.fill}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
    <View
      style={[
        styles.fill,
        { paddingHorizontal: pagePadding, width: "100%" },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
