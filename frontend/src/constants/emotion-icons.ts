import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

/** Vector icon names — never use emoji as structural icons (ui-ux-pro-max). */
export type IonIconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Maps emotion / mood IDs to a consistent Ionicons outline set.
 * Used on Home, Meditate filters, and anywhere emotion is displayed.
 */
export const EMOTION_ICONS: Record<string, IonIconName> = {
  anxious: "water-outline",
  fearful: "shield-outline",
  sad: "rainy-outline",
  overwhelmed: "sync-outline",
  lonely: "moon-outline",
  grateful: "leaf-outline",
  joyful: "sunny-outline",
  hopeful: "sparkles-outline",
  peaceful: "flower-outline",
  // onboarding heart states
  weary: "moon-outline",
  numb: "remove-circle-outline",
  hopeful_tired: "partly-sunny-outline",
  // concerns / support
  anxiety: "water-outline",
  panic: "alert-circle-outline",
  sleep: "bed-outline",
  grief: "heart-outline",
  loneliness: "person-outline",
  overwhelm: "layers-outline",
  purpose: "compass-outline",
  faith_struggle: "help-circle-outline",
  closer_to_jesus: "heart-circle-outline",
  rest_sleep: "bed-outline",
  calm_anxiety: "water-outline",
  scripture: "book-outline",
  daily_habits: "leaf-outline",
  presence: "sparkles-outline",
  grief_emotions: "heart-outline",
  quiet: "flame-outline",
  breathe: "fitness-outline",
  share: "chatbubble-ellipses-outline",
  // how the app works
  emotions: "happy-outline",
  sos: "heart",
  devotional: "book-outline",
  wisdom: "chatbubbles-outline",
  journal: "create-outline",
};

const FALLBACK: IonIconName = "ellipse-outline";

export function emotionIcon(id: string | undefined | null): IonIconName {
  if (!id) return FALLBACK;
  return EMOTION_ICONS[id] ?? FALLBACK;
}
