/**
 * Lightweight product analytics for funnel insight.
 * Events are stored locally (ring buffer) and logged in __DEV__.
 * Swap `emit` body later for Amplitude / PostHog / CloudWatch without changing call sites.
 */
import { storage } from "@/src/utils/storage";

const EVENTS_KEY = "cc_analytics_events_v1";
const MAX_EVENTS = 200;

export type AnalyticsEvent =
  | "app_open"
  | "emotion_selected"
  | "meditate_open"
  | "meditation_start"
  | "meditation_complete"
  | "sos_start"
  | "sos_stop"
  | "wisdom_send"
  | "wisdom_voice"
  | "wisdom_blocked"
  | "journal_save"
  | "journal_to_wisdom"
  | "paywall_shown"
  | "tab_change"
  | "first_step_complete";

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type StoredEvent = {
  name: AnalyticsEvent | string;
  props?: AnalyticsProps;
  ts: string;
};

async function readBuffer(): Promise<StoredEvent[]> {
  const raw = await storage.getItem<string>(EVENTS_KEY, "[]");
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBuffer(events: StoredEvent[]): Promise<void> {
  await storage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export async function track(
  name: AnalyticsEvent | string,
  props?: AnalyticsProps
): Promise<void> {
  const entry: StoredEvent = {
    name,
    props,
    ts: new Date().toISOString(),
  };
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[analytics]", name, props || {});
  }
  try {
    const buf = await readBuffer();
    buf.push(entry);
    await writeBuffer(buf);
  } catch {
    // never block UX
  }
}

/** Recent events for debug / future sync */
export async function getRecentEvents(limit = 50): Promise<StoredEvent[]> {
  const buf = await readBuffer();
  return buf.slice(-limit);
}

/** Funnel helper counts for a simple profile debug view */
export async function countEvent(name: AnalyticsEvent | string): Promise<number> {
  const buf = await readBuffer();
  return buf.filter((e) => e.name === name).length;
}
