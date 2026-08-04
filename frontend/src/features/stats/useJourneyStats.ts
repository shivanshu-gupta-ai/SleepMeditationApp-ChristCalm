import { useCallback, useRef, useState } from "react";
import { api } from "@/src/api/client";
import {
  deriveJourney,
  type MedCatalog,
  type MoodLog,
  type Rating,
} from "@/src/features/stats/deriveJourney";
import type { JourneySnapshot, StatsRange } from "@/src/features/stats/types";
import type { PracticeDay, PracticeSession } from "@/src/utils/practice-history";
import {
  getPracticeDays,
  getPracticeSessions,
  getWeeklyGoalMinutes,
} from "@/src/utils/practice-history";
import { getCompletedCount, getStreak } from "@/src/utils/session-progress";

type RawJourney = {
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
};

type State = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  range: StatsRange;
  snapshot: JourneySnapshot | null;
};

export function useJourneyStats() {
  const [state, setState] = useState<State>({
    loading: true,
    refreshing: false,
    error: null,
    range: "week",
    snapshot: null,
  });
  const rawRef = useRef<RawJourney | null>(null);
  const requestId = useRef(0);

  const applyRange = useCallback((range: StatsRange, raw: RawJourney) => {
    return deriveJourney({ ...raw, range });
  }, []);

  const load = useCallback(
    async (range: StatsRange, soft = false) => {
      const id = ++requestId.current;
      setState((s) => ({
        ...s,
        loading: soft ? s.loading : true,
        refreshing: soft,
        error: null,
        range,
      }));
      try {
        const [
          days,
          sessions,
          streak,
          completed,
          weeklyGoal,
          me,
          ratingsRes,
          moodsRes,
          journalRes,
          medsRes,
        ] = await Promise.all([
          getPracticeDays(),
          getPracticeSessions(),
          getStreak(),
          getCompletedCount(),
          getWeeklyGoalMinutes(),
          api.me().catch(() => null),
          api.listMeditationRatings().catch(() => ({ ratings: [] as Rating[] })),
          api.moodHistory().catch(() => ({ logs: [] as MoodLog[] })),
          api.listJournal().catch(() => ({ entries: [] as Array<{ mood?: string }> })),
          api.meditations(undefined, true).catch(() => ({ meditations: [] })),
        ]);

        if (id !== requestId.current) return;

        const user =
          (me as {
            minutes_meditated?: number;
            prayers_completed?: number;
            streak?: number;
          } | null) || null;

        const journalMoods = (journalRes.entries || [])
          .map((e: { mood?: string }) => (e.mood || "").toLowerCase())
          .filter(Boolean);

        const raw: RawJourney = {
          days,
          sessions,
          streak: Math.max(streak, user?.streak ?? 0),
          serverMinutes: user?.minutes_meditated ?? 0,
          serverSessions: Math.max(user?.prayers_completed ?? 0, completed),
          weeklyGoalMinutes: weeklyGoal,
          ratings: ratingsRes.ratings || [],
          moods: moodsRes.logs || [],
          journalMoods,
          catalog: (medsRes.meditations || []).map(
            (m: {
              id: string;
              title: string;
              emotion?: string;
              duration_min?: number;
            }) => ({
              id: m.id,
              title: m.title,
              emotion: m.emotion,
              duration_min: m.duration_min,
            })
          ),
        };

        rawRef.current = raw;
        const snapshot = applyRange(range, raw);

        setState({
          loading: false,
          refreshing: false,
          error: null,
          range,
          snapshot,
        });
      } catch (e: any) {
        if (id !== requestId.current) return;
        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          error: e?.message || "Could not load your journey.",
        }));
      }
    },
    [applyRange]
  );

  /** Instant filter switch — re-derives from cached data without a network round-trip. */
  const setRange = useCallback(
    (range: StatsRange) => {
      const raw = rawRef.current;
      if (raw) {
        setState((s) => ({
          ...s,
          range,
          error: null,
          snapshot: applyRange(range, raw),
        }));
        return;
      }
      void load(range, true);
    },
    [applyRange, load]
  );

  return {
    ...state,
    load,
    setRange,
    refresh: () => load(state.range, true),
  };
}
