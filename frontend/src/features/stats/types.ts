export type StatsRange = "week" | "month" | "all";

export type DayBar = {
  date: string;
  label: string;
  minutes: number;
  sessions: number;
};

export type PracticeSlice = {
  key: string;
  label: string;
  minutes: number;
};

export type Milestone = {
  id: string;
  title: string;
  detail: string;
  achievedAt?: string;
};

export type RecentSession = {
  id: string;
  title: string;
  minutes: number;
  created_at: string;
  stars?: number;
};

export type JourneySnapshot = {
  range: StatsRange;
  minutes: number;
  sessions: number;
  activeDays: number;
  rangeDays: number;
  streak: number;
  allTimeMinutes: number;
  allTimeSessions: number;
  weeklyGoalMinutes: number | null;
  weekMinutes: number;
  dayBars: DayBar[];
  calendarDays: DayBar[];
  reflection: string | null;
  practice: PracticeSlice[];
  milestones: Milestone[];
  recent: RecentSession[];
  hasAnyPractice: boolean;
};
