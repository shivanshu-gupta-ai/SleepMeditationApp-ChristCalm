import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/theme";

export default function Index() {
  const { loading, user, onboardingComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!onboardingComplete) {
      router.replace("/onboarding");
    } else if (!user) {
      router.replace("/(auth)/sign-in");
    } else {
      router.replace("/(tabs)/home");
    }
  }, [loading, user, onboardingComplete, router]);

  return (
    <View style={styles.container} testID="app-loading">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
