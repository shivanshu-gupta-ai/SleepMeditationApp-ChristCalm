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

export async function recordMeditationComplete(opts?: {
  emotionId?: string;
  meditationId?: string;
  minutes?: number;
  title?: string;
}): Promise<{
  completedCount: number;
  streak: number;
  isFirstComplete: boolean;
}> {
  const emotionId = opts?.emotionId;
  const prev = await getCompletedCount();
  const next = prev + 1;
  await storage.setItem(COMPLETED_KEY, next);

  if (emotionId) {
    await storage.setItem(LAST_EMOTION_KEY, emotionId);
  }

  // Simple calendar-day streak (local date)
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayKey = `${y}-${m}-${d}`;
  const lastDay = (await storage.getItem<string>(LAST_COMPLETE_DAY, "")) || "";
  let streak = (await storage.getItem<number>(STREAK_KEY, 0)) || 0;
  if (lastDay === todayKey) {
    // already counted today
  } else {
    const yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    const yk = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, "0")}-${String(yest.getDate()).padStart(2, "0")}`;
    streak = lastDay === yk ? streak + 1 : 1;
    await storage.setItem(STREAK_KEY, streak);
    await storage.setItem(LAST_COMPLETE_DAY, todayKey);
  }

  // Journey history for Stats tab (best-effort)
  if (opts?.meditationId) {
    try {
      const { recordPracticeSession } = await import("@/src/utils/practice-history");
      await recordPracticeSession({
        meditationId: opts.meditationId,
        minutes: opts.minutes ?? 0,
        title: opts.title,
        emotion: emotionId,
      });
    } catch {
      // non-blocking
    }
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
