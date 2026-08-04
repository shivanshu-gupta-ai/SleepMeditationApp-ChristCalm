import type {
  DayBar,
  JourneySnapshot,
  Milestone,
  PracticeSlice,
  RecentSession,
  StatsRange,
} from "@/src/features/stats/types";
import type { PracticeDay, PracticeSession } from "@/src/utils/practice-history";
import {
  dateKeysInRange,
  dayMap,
  lastNDateKeys,
  localDateKey,
  sumDaysInKeys,
} from "@/src/utils/practice-history";

const CALM_MOODS = new Set([
  "peaceful",
  "grateful",
  "hopeful",
  "calm",
  "content",
  "rested",
]);

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

export type Rating = {
  id: string;
  meditation_id: string;
  stars: number;
  minutes?: number | null;
  created_at: string;
};

export type MoodLog = {
  id: string;
  emotion: string;
  created_at: string;
};

export type MedCatalog = {
  id: string;
  title: string;
  emotion?: string;
  duration_min?: number;
};

function shortDayLabel(dateKey: string, mode: "weekday" | "day"): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (mode === "day") return String(d);
  return WEEKDAY[dt.getDay()];
}

function barsForKeys(
  keys: string[],
  days: PracticeDay[],
  labelMode: "weekday" | "day"
): DayBar[] {
  const map = dayMap(days);
  return keys.map((date) => {
    const row = map.get(date);
    return {
      date,
      label: shortDayLabel(date, labelMode),
      minutes: row?.minutes ?? 0,
      sessions: row?.sessions ?? 0,
    };
  });
}

/** Merge local days, session log, and server ratings into one day map (no double-count). */
export function buildUnifiedDays(
  days: PracticeDay[],
  sessions: PracticeSession[],
  ratings: Rating[]
): PracticeDay[] {
  const byDate = new Map<string, PracticeDay>();

  const ensure = (date: string): PracticeDay => {
    const existing = byDate.get(date);
    if (existing) return existing;
    const row: PracticeDay = { date, minutes: 0, sessions: 0 };
    byDate.set(date, row);
    return row;
  };

  // Prefer session log as ground truth when present (written per completion).
  if (sessions.length > 0) {
    for (const s of sessions) {
      const k = localDateKey(new Date(s.created_at));
      const row = ensure(k);
      row.minutes += Math.max(0, s.minutes || 0);
      row.sessions += 1;
    }
  } else {
    for (const d of days) {
      byDate.set(d.date, {
        date: d.date,
        minutes: Math.max(0, d.minutes || 0),
        sessions: Math.max(0, d.sessions || 0),
      });
    }
  }

  // Ratings fill days that have no local practice data yet.
  for (const r of ratings) {
    if (!r.created_at) continue;
    const k = localDateKey(new Date(r.created_at));
    if (byDate.has(k)) continue;
    const row = ensure(k);
    row.minutes += Math.max(0, r.minutes ?? 0);
    row.sessions += 1;
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function practiceRhythm(activeDays: number, rangeDays: number): string {
  if (rangeDays <= 0 || activeDays <= 0) return "A quiet stretch — rest is holy too.";
  const denom = Math.max(1, Math.min(rangeDays, 30));
  const ratio = activeDays / denom;
  if (ratio >= 0.7) return "A steady rhythm of returning.";
  if (ratio >= 0.4) return "A gentle, growing rhythm.";
  if (ratio >= 0.15) return "Beginning again, one day at a time.";
  return "Soft seeds of presence.";
}

function inRangeKeys(iso: string, keys: Set<string>): boolean {
  if (!iso) return false;
  if (keys.size === 0) return true;
  const local = localDateKey(new Date(iso));
  const utc = iso.slice(0, 10);
  return keys.has(local) || keys.has(utc);
}

/**
 * Soft reflection only — no clinical N-of-M ratios.
 * Prefer qualitative grace language; null when signal is thin.
 */
function buildReflection(
  ratings: Rating[],
  moods: MoodLog[],
  journalMoods: string[],
  keys: Set<string>
): string | null {
  const recentRatings = ratings
    .filter((r) => inRangeKeys(r.created_at, keys))
    .slice(0, 10);
  if (recentRatings.length >= 3) {
    const calm = recentRatings.filter((r) => r.stars >= 4).length;
    const ratio = calm / recentRatings.length;
    if (ratio >= 0.7) {
      return "Many of your recent sessions left you calmer afterward.";
    }
    if (ratio >= 0.4) {
      return "Several sessions have left a quieter heart afterward.";
    }
    if (calm > 0) {
      return "A few recent sessions left you softer afterward.";
    }
  }

  const recentMoods = moods
    .filter((m) => inRangeKeys(m.created_at, keys))
    .slice(0, 10)
    .map((m) => m.emotion.toLowerCase());
  const pool = recentMoods.length >= 3 ? recentMoods : journalMoods.slice(0, 10);
  if (pool.length >= 3) {
    const calm = pool.filter((m) => CALM_MOODS.has(m)).length;
    const ratio = calm / pool.length;
    if (ratio >= 0.5) {
      return "Your check-ins have leaned toward peace.";
    }
    if (calm > 0) {
      return "Glimpses of peace have been showing up in your check-ins.";
    }
  }
  return null;
}

function buildPractice(
  sessions: PracticeSession[],
  ratings: Rating[],
  catalog: MedCatalog[],
  keys: Set<string>
): PracticeSlice[] {
  const titleById = new Map(catalog.map((m) => [m.id, m.title]));
  const emotionById = new Map(catalog.map((m) => [m.id, m.emotion || "other"]));
  const buckets = new Map<string, number>();

  const add = (key: string, minutes: number) => {
    if (minutes <= 0) return;
    buckets.set(key, (buckets.get(key) || 0) + minutes);
  };

  for (const s of sessions) {
    if (!inRangeKeys(s.created_at, keys)) continue;
    const label =
      s.emotion ||
      emotionById.get(s.meditation_id) ||
      (s.title ? "Sessions" : "Other");
    add(label, s.minutes);
  }

  if (buckets.size === 0) {
    for (const r of ratings) {
      if (!inRangeKeys(r.created_at, keys)) continue;
      const label =
        emotionById.get(r.meditation_id) ||
        titleById.get(r.meditation_id) ||
        "Sessions";
      add(label, r.minutes ?? 0);
    }
  }

  return [...buckets.entries()]
    .map(([key, minutes]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " "),
      minutes,
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 4);
}

/** Gift-language moments only — no streak/achievement ladder (max 3 shown). */
function buildMilestones(
  allTimeSessions: number,
  allTimeMinutes: number
): Milestone[] {
  const defs: Array<{
    id: string;
    at: number;
    kind: "sessions" | "minutes";
    title: string;
    detail: string;
  }> = [
    {
      id: "first-stillness",
      at: 1,
      kind: "sessions",
      title: "First stillness",
      detail: "You paused and listened.",
    },
    {
      id: "three-returns",
      at: 3,
      kind: "sessions",
      title: "Three returns",
      detail: "Presence is becoming familiar.",
    },
    {
      id: "week-of-grace",
      at: 7,
      kind: "sessions",
      title: "Seven returns",
      detail: "You chose calm again and again.",
    },
    {
      id: "hour-with-him",
      at: 60,
      kind: "minutes",
      title: "An hour with Him",
      detail: "Sixty mindful minutes gathered.",
    },
    {
      id: "two-hours",
      at: 120,
      kind: "minutes",
      title: "Two quiet hours",
      detail: "Rest woven into ordinary days.",
    },
  ];

  const out: Milestone[] = [];
  for (const d of defs) {
    const value = d.kind === "sessions" ? allTimeSessions : allTimeMinutes;
    if (value >= d.at) {
      out.push({ id: d.id, title: d.title, detail: d.detail });
    }
  }
  return out.slice(0, 3);
}

function buildRecent(
  sessions: PracticeSession[],
  ratings: Rating[],
  catalog: MedCatalog[],
  keys: Set<string>
): RecentSession[] {
  const titleById = new Map(catalog.map((m) => [m.id, m.title]));

  if (sessions.length) {
    return sessions
      .filter((s) => inRangeKeys(s.created_at, keys))
      .slice(0, 4)
      .map((s) => ({
        id: s.id,
        title: s.title || titleById.get(s.meditation_id) || "Meditation",
        minutes: s.minutes,
        created_at: s.created_at,
      }));
  }

  return ratings
    .filter((r) => inRangeKeys(r.created_at, keys))
    .slice(0, 4)
    .map((r) => ({
      id: r.id,
      title: titleById.get(r.meditation_id) || "Meditation",
      minutes: r.minutes ?? 0,
      created_at: r.created_at,
      stars: r.stars,
    }));
}

function chartKeysForRange(range: StatsRange, unified: PracticeDay[]): string[] {
  if (range === "week") return lastNDateKeys(7);
  if (range === "month") return lastNDateKeys(30);
  // All time: chart shows recent days; hero uses full history totals
  if (!unified.length) return lastNDateKeys(7);
  const spanKeys = dateKeysInRange("all", unified);
  if (spanKeys.length > 30) return lastNDateKeys(30);
  if (spanKeys.length < 7) return lastNDateKeys(7);
  return spanKeys;
}

export function deriveJourney(input: {
  range: StatsRange;
  days: PracticeDay[];
  sessions: PracticeSession[];
  streak: number;
  serverMinutes: number;
  serverSessions: number;
  weeklyGoalMinutes: number | null;
  ratings: Rating[];
  moods: MoodLog[];
  journalMoods: string[];
  catalog: MedCatalog[];
}): JourneySnapshot {
  const unified = buildUnifiedDays(input.days, input.sessions, input.ratings);
  const keys = dateKeysInRange(input.range, unified);
  const keySet = new Set(keys);
  const summed = sumDaysInKeys(unified, keys);

  const allKeys = unified.map((d) => d.date);
  const allSumLocal = sumDaysInKeys(unified, allKeys);

  // All-time totals: local detailed history wins when higher; else server aggregates.
  const allTimeMinutes = Math.max(input.serverMinutes, allSumLocal.minutes);
  const allTimeSessions = Math.max(input.serverSessions, allSumLocal.sessions);

  let minutes = summed.minutes;
  let sessions = summed.sessions;
  let activeDays = summed.activeDays;

  // If range is "all" and we only have server aggregates (no day-level rows),
  // show those totals accurately in the hero.
  if (input.range === "all" && minutes === 0 && allTimeMinutes > 0) {
    minutes = allTimeMinutes;
    sessions = allTimeSessions;
    activeDays = allSumLocal.activeDays || (allTimeSessions > 0 ? 1 : 0);
  }

  // Week / month with only server totals and no day data: do not invent day splits.
  // Keep zeros for range metrics so the filter stays honest.
  const weekKeys = lastNDateKeys(7);
  const weekSum = sumDaysInKeys(unified, weekKeys);

  const chartKeys = chartKeysForRange(input.range, unified);
  const labelMode: "weekday" | "day" = input.range === "week" ? "weekday" : "day";
  const dayBars = barsForKeys(chartKeys, unified, labelMode);
  // Calendar demoted — keep empty array for type stability
  const calendarDays: DayBar[] = [];

  // For "all" with only server totals, keySet for secondary sections should not filter everything out
  const filterKeys =
    input.range === "all" && unified.length === 0 ? new Set<string>() : keySet;

  const practice = buildPractice(
    input.sessions,
    input.ratings,
    input.catalog,
    filterKeys
  );
  // Sparse gate: hide practice breakdown with fewer than 2 slices
  const practiceVisible = practice.length >= 2 ? practice : [];

  return {
    range: input.range,
    minutes,
    sessions,
    activeDays,
    rangeDays: Math.max(keys.length, 1),
    streak: input.streak,
    allTimeMinutes,
    allTimeSessions,
    weeklyGoalMinutes: null, // Intention scoreboard removed from Journey
    weekMinutes: weekSum.minutes,
    dayBars,
    calendarDays,
    reflection: buildReflection(
      input.ratings,
      input.moods,
      input.journalMoods,
      filterKeys
    ),
    practice: practiceVisible,
    milestones: buildMilestones(allTimeSessions, allTimeMinutes),
    recent: buildRecent(
      input.sessions,
      input.ratings,
      input.catalog,
      filterKeys
    ),
    hasAnyPractice:
      allTimeSessions > 0 ||
      allTimeMinutes > 0 ||
      unified.some((d) => d.sessions > 0 || d.minutes > 0),
  };
}

export function rhythmLabel(snapshot: JourneySnapshot): string {
  return practiceRhythm(snapshot.activeDays, snapshot.rangeDays);
}

export function chartCopy(range: StatsRange): { title: string; subtitle: string } {
  if (range === "week") {
    return { title: "This week", subtitle: "Tap a day — practice or rest" };
  }
  if (range === "month") {
    return { title: "This month", subtitle: "Each day holds practice or rest · tap for detail" };
  }
  return {
    title: "Recent rhythm",
    subtitle: "Day by day · minutes above cover all time",
  };
}
