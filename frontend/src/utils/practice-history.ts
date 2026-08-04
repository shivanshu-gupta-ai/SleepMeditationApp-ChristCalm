/**
 * Local practice history for journey stats (daily bars, calendar, sessions).
 * Complements server aggregates (minutes_meditated / prayers_completed).
 */
import { storage } from "@/src/utils/storage";

const DAYS_KEY = "cc_practice_days";
const SESSIONS_KEY = "cc_practice_sessions";
const WEEKLY_GOAL_KEY = "cc_weekly_goal_minutes";

export type PracticeDay = {
  date: string; // YYYY-MM-DD (local)
  minutes: number;
  sessions: number;
};

export type PracticeSession = {
  id: string;
  meditation_id: string;
  minutes: number;
  created_at: string;
  title?: string;
  emotion?: string;
};

function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function readJsonArray<T>(key: string): Promise<T[]> {
  const raw = (await storage.getItem<string>(key, "[]")) || "[]";
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonArray<T>(key: string, value: T[]): Promise<void> {
  await storage.setItem(key, JSON.stringify(value));
}

export async function getPracticeDays(): Promise<PracticeDay[]> {
  return readJsonArray<PracticeDay>(DAYS_KEY);
}

export async function getPracticeSessions(): Promise<PracticeSession[]> {
  return readJsonArray<PracticeSession>(SESSIONS_KEY);
}

/** Optional weekly minutes goal — null means user has not set one. */
export async function getWeeklyGoalMinutes(): Promise<number | null> {
  const n = await storage.getItem<number>(WEEKLY_GOAL_KEY, 0);
  if (typeof n === "number" && n > 0) return Math.round(n);
  return null;
}

export async function setWeeklyGoalMinutes(minutes: number | null): Promise<void> {
  if (minutes == null || minutes <= 0) {
    await storage.removeItem(WEEKLY_GOAL_KEY);
    return;
  }
  await storage.setItem(WEEKLY_GOAL_KEY, Math.round(minutes));
}

export async function recordPracticeSession(input: {
  meditationId: string;
  minutes: number;
  title?: string;
  emotion?: string;
}): Promise<{ day: PracticeDay; session: PracticeSession }> {
  const minutes = Math.max(0, Math.round(input.minutes));
  const date = localDateKey();
  const session: PracticeSession = {
    id: `ps_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    meditation_id: input.meditationId,
    minutes,
    created_at: new Date().toISOString(),
    title: input.title,
    emotion: input.emotion,
  };

  const sessions = await getPracticeSessions();
  sessions.unshift(session);
  // Cap local log so storage stays light
  await writeJsonArray(SESSIONS_KEY, sessions.slice(0, 200));

  const days = await getPracticeDays();
  const idx = days.findIndex((d) => d.date === date);
  let day: PracticeDay;
  if (idx >= 0) {
    day = {
      date,
      minutes: days[idx].minutes + minutes,
      sessions: days[idx].sessions + 1,
    };
    days[idx] = day;
  } else {
    day = { date, minutes, sessions: 1 };
    days.push(day);
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  await writeJsonArray(DAYS_KEY, days.slice(-400));

  return { day, session };
}

export function dateKeysInRange(
  range: "week" | "month" | "all",
  allDays: PracticeDay[]
): string[] {
  if (range === "all") {
    if (!allDays.length) return lastNDateKeys(7);
    const first = allDays[0].date;
    const start = parseLocalDate(first);
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const keys: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      keys.push(localDateKey(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return keys;
  }
  return lastNDateKeys(range === "week" ? 7 : 30);
}

function lastNDateKeys(n: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    keys.push(localDateKey(x));
  }
  return keys;
}

function parseLocalDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function sumDaysInKeys(
  days: PracticeDay[],
  keys: string[]
): { minutes: number; sessions: number; activeDays: number } {
  const map = new Map(days.map((d) => [d.date, d]));
  let minutes = 0;
  let sessions = 0;
  let activeDays = 0;
  for (const k of keys) {
    const row = map.get(k);
    if (row && (row.minutes > 0 || row.sessions > 0)) {
      minutes += row.minutes;
      sessions += row.sessions;
      activeDays += 1;
    }
  }
  return { minutes, sessions, activeDays };
}

export function dayMap(days: PracticeDay[]): Map<string, PracticeDay> {
  return new Map(days.map((d) => [d.date, d]));
}

export { localDateKey, lastNDateKeys };
