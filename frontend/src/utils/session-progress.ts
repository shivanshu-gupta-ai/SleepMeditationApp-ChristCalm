/**
 * Local progress: completed meditations, last emotion, soft paywall gating.
 */
import { storage } from "@/src/utils/storage";

const COMPLETED_KEY = "cc_meditations_completed";
const LAST_EMOTION_KEY = "cc_last_emotion";
const STREAK_KEY = "cc_session_streak";
const LAST_COMPLETE_DAY = "cc_last_complete_day";

export async function getCompletedCount(): Promise<number> {
  const n = await storage.getItem<number>(COMPLETED_KEY, 0);
  return typeof n === "number" ? n : 0;
}

export async function recordMeditationComplete(emotionId?: string): Promise<{
  completedCount: number;
  streak: number;
  isFirstComplete: boolean;
}> {
  const prev = await getCompletedCount();
  const next = prev + 1;
  await storage.setItem(COMPLETED_KEY, next);

  if (emotionId) {
    await storage.setItem(LAST_EMOTION_KEY, emotionId);
  }

  // Simple calendar-day streak (UTC date string)
  const today = new Date().toISOString().slice(0, 10);
  const lastDay = (await storage.getItem<string>(LAST_COMPLETE_DAY, "")) || "";
  let streak = (await storage.getItem<number>(STREAK_KEY, 0)) || 0;
  if (lastDay === today) {
    // already counted today
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = lastDay === yesterday ? streak + 1 : 1;
    await storage.setItem(STREAK_KEY, streak);
    await storage.setItem(LAST_COMPLETE_DAY, today);
  }

  return { completedCount: next, streak, isFirstComplete: prev === 0 };
}

export async function getLastEmotionId(): Promise<string | null> {
  const id = await storage.getItem<string>(LAST_EMOTION_KEY, "");
  return id || null;
}

export async function getStreak(): Promise<number> {
  const n = await storage.getItem<number>(STREAK_KEY, 0);
  return typeof n === "number" ? n : 0;
}

/** Soft paywall after N completed free sessions (first complete = 1) */
export function shouldOfferPaywallAfterCompletes(completedCount: number, isPremium: boolean): boolean {
  // Preview: unlock-all / premium never shows soft paywall
  if (isPremium) return false;
  // Default off: only skip soft paywall when explicitly unlocked for preview demos
  if ((process.env.EXPO_PUBLIC_UNLOCK_ALL ?? "0").toString().trim() === "1") return false;
  // After first completed session, and again every 3rd thereafter
  return completedCount === 1 || completedCount % 3 === 0;
}
