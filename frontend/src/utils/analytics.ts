/**
 * Product analytics — local buffer + sync to DynamoDB via API.
 * Events power usage monitoring / funnel analysis.
 *
 * - track() never blocks UX
 * - flush() batches to POST /api/analytics/events
 * - Works signed-in (user_id) or anon (device_id)
 */
import { Platform } from "react-native";
import { storage } from "@/src/utils/storage";

const EVENTS_KEY = "cc_analytics_events_v1";
const DEVICE_KEY = "cc_analytics_device_id";
const SESSION_KEY = "cc_analytics_session_id";
const MAX_EVENTS = 200;
const FLUSH_BATCH = 40;
const FLUSH_INTERVAL_MS = 20_000;

export type AnalyticsEvent =
  | "app_open"
  | "emotion_selected"
  | "meditate_open"
  | "meditation_start"
  | "meditation_complete"
  | "meditation_rated"
  | "sos_start"
  | "sos_stop"
  | "wisdom_send"
  | "wisdom_voice"
  | "wisdom_blocked"
  | "journal_save"
  | "journal_voice"
  | "journal_to_wisdom"
  | "paywall_shown"
  | "paywall_view"
  | "paywall_plan_select"
  | "paywall_purchase_start"
  | "paywall_purchase_success"
  | "paywall_purchase_cancel"
  | "paywall_purchase_error"
  | "paywall_skip"
  | "paywall_timer_expire"
  | "paywall_restore"
  | "tab_change"
  | "first_step_complete"
  | "fab_start_calm"
  | "start_calm_action"
  | "screen_view"
  | "feedback_submit"
  | "feedback_open";

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type StoredEvent = {
  name: AnalyticsEvent | string;
  props?: AnalyticsProps;
  ts: string;
  id?: string;
};

let flushTimer: ReturnType<typeof setInterval> | null = null;
let flushing = false;
let sessionId: string | null = null;

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function getDeviceId(): Promise<string> {
  let id = await storage.getItem<string>(DEVICE_KEY, "");
  if (!id) {
    id = `d_${newId()}`;
    await storage.setItem(DEVICE_KEY, id);
  }
  return id;
}

async function getSessionId(): Promise<string> {
  if (sessionId) return sessionId;
  // New session each cold start of the JS runtime
  sessionId = `s_${newId()}`;
  try {
    await storage.setItem(SESSION_KEY, sessionId);
  } catch {
    // ignore
  }
  return sessionId;
}

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
    id: newId(),
  };
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[analytics]", name, props || {});
  }
  try {
    const buf = await readBuffer();
    buf.push(entry);
    await writeBuffer(buf);
    // Flush when buffer gets large
    if (buf.length >= 12) {
      void flushAnalytics();
    }
  } catch {
    // never block UX
  }
}

/** Flush buffered events to backend. Concurrent calls are coalesced. */
export async function flushAnalytics(): Promise<{ sent: number; ok: boolean }> {
  if (flushing) return { sent: 0, ok: false };
  flushing = true;
  try {
    const buf = await readBuffer();
    if (!buf.length) return { sent: 0, ok: true };

    const batch = buf.slice(0, FLUSH_BATCH);
    const rest = buf.slice(FLUSH_BATCH);

    const backend = (process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
    if (!backend) {
      return { sent: 0, ok: false };
    }

    const { getAccessToken } = await import("@/src/utils/auth-token");
    const token = await getAccessToken();
    const deviceId = await getDeviceId();
    const sid = await getSessionId();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${backend}/api/analytics/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        events: batch.map((e) => ({
          name: e.name,
          props: e.props || undefined,
          ts: e.ts,
          id: e.id,
        })),
        platform: Platform.OS,
        session_id: sid,
        device_id: deviceId,
      }),
    });

    if (!res.ok) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[analytics] flush failed", res.status);
      }
      return { sent: 0, ok: false };
    }

    await writeBuffer(rest);
    // If more remain, schedule another pass
    if (rest.length > 0) {
      setTimeout(() => {
        void flushAnalytics();
      }, 1500);
    }
    return { sent: batch.length, ok: true };
  } catch {
    return { sent: 0, ok: false };
  } finally {
    flushing = false;
  }
}

/** Start periodic flush + app_open (call once from root layout). */
export function startAnalytics(): void {
  void track("app_open", { platform: Platform.OS });
  void flushAnalytics();
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    void flushAnalytics();
  }, FLUSH_INTERVAL_MS);
}

export function stopAnalytics(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  void flushAnalytics();
}
