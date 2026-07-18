/**
 * Focus Mode — guide the user to silence system notifications.
 *
 * Apps cannot force OS-wide Do Not Disturb (Apple / Google restriction).
 * We open system Focus / DND settings so the user can silence interruptions
 * before a meditation or from Profile.
 */
import { Alert, Linking, Platform } from "react-native";
import { storage } from "@/src/utils/storage";
import { track } from "@/src/utils/analytics";

const PREF_KEY = "cc_focus_prompt_enabled";

export async function isFocusPromptEnabled(): Promise<boolean> {
  const v = await storage.getItem(PREF_KEY, "1");
  // default on when unset
  return String(v ?? "1") !== "0";
}

export async function setFocusPromptEnabled(on: boolean): Promise<void> {
  await storage.setItem(PREF_KEY, on ? "1" : "0");
}

/** Open OS Focus / Do Not Disturb settings when possible. */
export async function openSystemFocusSettings(): Promise<boolean> {
  void track("focus_mode_open", { platform: Platform.OS });
  try {
    if (Platform.OS === "android") {
      // Zen Mode / DND settings
      try {
        await Linking.sendIntent("android.settings.ZEN_MODE_SETTINGS");
        return true;
      } catch {
        try {
          await Linking.sendIntent("android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS");
          return true;
        } catch {
          await Linking.openSettings();
          return true;
        }
      }
    }

    if (Platform.OS === "ios") {
      // Prefer Focus / DND pane; may be blocked on some iOS versions
      const candidates = [
        "App-prefs:root=DO_NOT_DISTURB",
        "App-prefs:DO_NOT_DISTURB",
        "prefs:root=DO_NOT_DISTURB",
      ];
      for (const url of candidates) {
        try {
          const can = await Linking.canOpenURL(url);
          if (can) {
            await Linking.openURL(url);
            return true;
          }
        } catch {
          // try next
        }
      }
      await Linking.openSettings();
      return true;
    }

    // Web / other — explain limitation
    Alert.alert(
      "Silence notifications",
      "On this device, turn on Do Not Disturb or Focus Mode from your system settings so nothing interrupts your session."
    );
    return false;
  } catch {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      Alert.alert(
        "Couldn’t open settings",
        "Please enable Do Not Disturb or Focus Mode from your phone’s Settings app."
      );
      return false;
    }
  }
}

/** Soft prompt before a session — respects user preference. */
export async function promptSilenceBeforeSession(): Promise<void> {
  const enabled = await isFocusPromptEnabled();
  if (!enabled) return;
  if (Platform.OS === "web") return;

  return new Promise((resolve) => {
    Alert.alert(
      "Silence interruptions?",
      "Turn on Focus / Do Not Disturb so calls and notifications don’t break your peace.",
      [
        { text: "Not now", style: "cancel", onPress: () => resolve() },
        {
          text: "Open settings",
          onPress: () => {
            void openSystemFocusSettings().finally(() => resolve());
          },
        },
      ]
    );
  });
}
