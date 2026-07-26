import { storage } from "@/src/utils/storage";
import { cacheGet, cacheSet } from "@/src/utils/api-cache";
import { ApiError } from "@/src/utils/api-errors";
import { reportNetworkFailure, reportNetworkSuccess } from "@/src/utils/connectivity";
import { emitSessionExpired } from "@/src/utils/session-events";

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

if (!BACKEND_URL && typeof __DEV__ !== "undefined" && __DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    "EXPO_PUBLIC_BACKEND_URL is not set — run ./scripts/sync-env-from-aws.sh then restart Expo with --clear"
  );
}

export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : "";

async function authHeaders() {
  const token = await storage.secureGet("cc_token", "");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T = any>(
  path: string,
  opts: { method?: string; body?: any; auth?: boolean; cache?: RequestCache } = {}
): Promise<T> {
  const { method = "GET", body, auth = true, cache } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    Object.assign(headers, await authHeaders());
  }
  if (!API_BASE) {
    throw new ApiError(
      "Backend URL not configured. Run ./scripts/sync-env-from-aws.sh and restart Expo (npm run start -- --clear).",
      "config"
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      // Avoid browser HTTP cache serving stale catalog (Cache-Control max-age on API)
      ...(cache ? { cache } : null),
    });
  } catch {
    reportNetworkFailure();
    throw new ApiError(
      "Looks like you're offline or the connection is unsteady. Check your internet and try again.",
      "network"
    );
  }
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail = (data && data.detail) || `HTTP ${res.status}`;
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);

    // Authenticated call rejected — soft session end (not for public catalog)
    if (auth && (res.status === 401 || res.status === 403)) {
      emitSessionExpired();
      throw new ApiError(
        "Your session ended quietly. Sign in again to continue.",
        "unauthorized",
        res.status,
        detail
      );
    }

    throw new ApiError(message, "http", res.status, detail);
  }
  reportNetworkSuccess();
  return data as T;
}

export const api = {
  authConfig: () =>
    request<{
      provider: string;
      region: string;
      user_pool_id: string | null;
      client_id: string | null;
      domain: string | null;
      apple_enabled: boolean;
    }>("/auth/config", { auth: false }),
  me: () => request("/auth/me"),
  saveOnboarding: (payload: {
    faith_journey: string | null;
    concerns: string[];
    emotional_state?: string | null;
    desired_support?: string[];
    preferred_time?: string | null;
    commitment_accepted?: boolean;
    commitment_date?: string | null;
    first_practices_done?: boolean[];
    display_name?: string;
  }) => request("/auth/onboarding", { method: "POST", body: payload }),


  /** Cached 5 min in-memory; force bypasses memory + browser HTTP cache */
  emotions: async (force = false) => {
    const key = "catalog:emotions";
    if (!force) {
      const hit = cacheGet<any>(key);
      if (hit) return hit;
    }
    const bust = force ? `?_=${Date.now()}` : "";
    const data = await request(`/emotions${bust}`, { auth: false, cache: "no-store" });
    cacheSet(key, data);
    return data;
  },
  meditations: async (emotion?: string, force = false) => {
    const key = `catalog:meditations:${emotion || "all"}`;
    if (!force) {
      const hit = cacheGet<any>(key);
      if (hit) return hit;
    }
    const params = new URLSearchParams();
    if (emotion) params.set("emotion", emotion);
    if (force) params.set("_", String(Date.now()));
    const q = params.toString() ? `?${params}` : "";
    const data = await request(`/meditations${q}`, { auth: false, cache: "no-store" });
    cacheSet(key, data);
    return data;
  },
  meditationById: async (id: string) => {
    const key = `catalog:meditation:${id}`;
    const hit = cacheGet<any>(key);
    if (hit) return hit;
    const data = await request(`/meditations/${id}`, { auth: false });
    cacheSet(key, data);
    return data;
  },
  completeMeditation: (meditation_id: string, minutes: number) =>
    request("/meditations/complete", { method: "POST", body: { meditation_id, minutes } }),
  /** Persist 1–5 star rating for a meditation session (DynamoDB per user). */
  rateMeditation: (meditation_id: string, stars: number, minutes?: number) =>
    request<{
      ok: boolean;
      rating: {
        id: string;
        user_id: string;
        meditation_id: string;
        stars: number;
        minutes?: number | null;
        created_at: string;
      };
    }>("/meditations/rate", {
      method: "POST",
      body: {
        meditation_id,
        stars,
        ...(typeof minutes === "number" ? { minutes } : {}),
      },
    }),
  prayers: async (category?: string) => {
    const key = `catalog:prayers:${category || "all"}`;
    const hit = cacheGet<any>(key);
    if (hit) return hit;
    const data = await request(
      `/prayers${category ? `?category=${category}` : ""}`,
      { auth: false }
    );
    cacheSet(key, data);
    return data;
  },
  devotional: async () => {
    const key = "catalog:devotional";
    const hit = cacheGet<any>(key);
    if (hit) return hit;
    const data = await request("/devotional/today", { auth: false });
    cacheSet(key, data, 15 * 60 * 1000); // day-stable; refresh every 15 min
    return data;
  },

  logMood: (emotion: string, note?: string) =>
    request("/mood/log", { method: "POST", body: { emotion, note } }),

  createJournal: (content: string, mood?: string) =>
    request("/journal", { method: "POST", body: { content, mood } }),
  listJournal: () => request("/journal"),

  /** Product feedback (Me tab) → DynamoDB; analytics should not store message body. */
  submitFeedback: (body: {
    category: "praise" | "suggestion" | "bug" | "spiritual" | "other";
    message: string;
    stars?: number;
    platform?: string;
  }) =>
    request<{
      ok: boolean;
      feedback: {
        id: string;
        category: string;
        stars?: number | null;
        created_at: string;
        status: string;
      };
    }>("/feedback", { method: "POST", body }),

  wisdomChat: (message: string, conversation_id?: string | null) =>
    request<{
      conversation_id: string;
      message_id: string;
      reply: string;
      sources?: { source: string; heading: string }[];
      model?: string;
      created_at: string;
      blocked?: boolean;
      ai_quota?: { used: number; limit: number; remaining: number; month: string; ok?: boolean };
    }>("/wisdom/chat", {
      method: "POST",
      body: { message, conversation_id: conversation_id || undefined },
    }),

  /**
   * Stream wisdom reply via SSE (POST /wisdom/chat/stream).
   * Calls onDelta for each text chunk; onDone with the final payload.
   * Falls back to non-stream wisdomChat if streaming is unavailable.
   */
  wisdomChatStream: async (
    message: string,
    conversation_id: string | null | undefined,
    handlers: {
      onMeta?: (meta: {
        conversation_id?: string;
        message_id?: string;
        blocked?: boolean;
        sources?: { source: string; heading: string }[];
        model?: string;
        ai_quota?: { used: number; limit: number; remaining: number; month: string; ok?: boolean };
      }) => void;
      onDelta: (text: string) => void;
      onDone: (done: {
        conversation_id: string;
        message_id: string;
        reply: string;
        sources?: { source: string; heading: string }[];
        model?: string;
        created_at?: string;
        blocked?: boolean;
        ai_quota?: { used: number; limit: number; remaining: number; month: string; ok?: boolean };
      }) => void;
      onError?: (message: string) => void;
      signal?: AbortSignal;
    }
  ): Promise<void> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    Object.assign(headers, await authHeaders());

    if (!API_BASE) {
      throw new ApiError(
        "Backend URL not configured. Run ./scripts/sync-env-from-aws.sh and restart Expo (npm run start -- --clear).",
        "config"
      );
    }

    const fallback = async () => {
      const res = await api.wisdomChat(message, conversation_id);
      handlers.onMeta?.({
        conversation_id: res.conversation_id,
        message_id: res.message_id,
        blocked: res.blocked,
        sources: res.sources,
        model: res.model,
        ai_quota: res.ai_quota,
      });
      if (res.reply) handlers.onDelta(res.reply);
      handlers.onDone({
        conversation_id: res.conversation_id,
        message_id: res.message_id,
        reply: res.reply,
        sources: res.sources,
        model: res.model,
        created_at: res.created_at,
        blocked: res.blocked,
        ai_quota: res.ai_quota,
      });
    };

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/wisdom/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          conversation_id: conversation_id || undefined,
        }),
        signal: handlers.signal,
      });
    } catch {
      reportNetworkFailure();
      // Network failure — try non-stream once
      try {
        await fallback();
        reportNetworkSuccess();
        return;
      } catch (e) {
        throw e instanceof ApiError
          ? e
          : new ApiError(
              "Looks like you're offline or the connection is unsteady. Check your internet and try again.",
              "network"
            );
      }
    }

    if (!res.ok) {
      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
      const detail = (data && data.detail) || `HTTP ${res.status}`;
      const errMsg = typeof detail === "string" ? detail : JSON.stringify(detail);
      if (res.status === 401 || res.status === 403) {
        emitSessionExpired();
        throw new ApiError(
          "Your session ended quietly. Sign in again to continue.",
          "unauthorized",
          res.status,
          detail
        );
      }
      // Stream route missing / not supported → non-stream fallback
      if (res.status === 404 || res.status === 405) {
        await fallback();
        return;
      }
      throw new ApiError(errMsg, "http", res.status, detail);
    }

    reportNetworkSuccess();

    const parseAndEmit = (raw: string) => {
      const lines = raw.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;
        let ev: any;
        try {
          ev = JSON.parse(jsonStr);
        } catch {
          continue;
        }
        const t = ev?.type;
        if (t === "meta") handlers.onMeta?.(ev);
        else if (t === "delta" && ev.text) handlers.onDelta(String(ev.text));
        else if (t === "done") {
          handlers.onDone({
            conversation_id: ev.conversation_id,
            message_id: ev.message_id,
            reply: ev.reply || "",
            sources: ev.sources,
            model: ev.model,
            created_at: ev.created_at,
            blocked: ev.blocked,
            ai_quota: ev.ai_quota,
          });
        } else if (t === "error") {
          handlers.onError?.(ev.message || "Wisdom is temporarily unavailable.");
        }
      }
    };

    const body = res.body as ReadableStream<Uint8Array> | null;
    const reader =
      body && typeof (body as any).getReader === "function"
        ? (body as ReadableStream<Uint8Array>).getReader()
        : null;

    if (!reader) {
      // RN / buffered: parse full body; still emit deltas for progressive UI
      const text = await res.text();
      const blocks = text.split(/\n\n+/);
      for (const block of blocks) {
        parseAndEmit(block);
        // Yield to UI thread between events when body arrived buffered
        await new Promise((r) => setTimeout(r, 0));
      }
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          if (part.trim()) parseAndEmit(part);
        }
      }
      if (buffer.trim()) parseAndEmit(buffer);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      throw e;
    }
  },

  wisdomQuota: () =>
    request<{ used: number; limit: number; remaining: number; month: string; ok: boolean }>(
      "/wisdom/quota"
    ),

  /** Voice note → Amazon Transcribe (presign → PUT S3 → transcribe). */
  wisdomVoicePresign: (media_ext = "m4a", content_type = "audio/mp4") =>
    request<{
      upload_url: string;
      s3_key: string;
      bucket: string;
      content_type: string;
      expires_in: number;
      media_format: string;
    }>("/wisdom/voice/presign", {
      method: "POST",
      body: { media_ext, content_type },
    }),
  wisdomVoiceTranscribe: (s3_key: string, media_format?: string) =>
    request<{
      text: string;
      language_code?: string;
      media_format?: string;
      ai_quota?: { used: number; limit: number; remaining: number; month: string };
    }>("/wisdom/voice/transcribe", {
      method: "POST",
      body: { s3_key, media_format: media_format || undefined },
    }),

  syncSubscription: (body: { active: boolean; plan?: "monthly" | "annual" | null }) =>
    request("/subscription/sync", { method: "POST", body }),
};
