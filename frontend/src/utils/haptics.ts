/**
 * Soft haptic hierarchy for ChristCalm.
 * Light = chips/tiles · Medium = tabs/primary · Success = completed action
 * No-ops on web / when unsupported.
 */
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export type HapticStrength = "none" | "light" | "medium" | "heavy" | "success" | "warning";

export async function playHaptic(strength: HapticStrength = "light"): Promise<void> {
  if (strength === "none" || Platform.OS === "web") return;
  try {
    switch (strength) {
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
    }
  } catch {
    // Simulator / unsupported device
  }
}
