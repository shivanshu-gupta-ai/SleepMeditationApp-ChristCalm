import { storage } from "@/src/utils/storage";
import { cacheGet, cacheSet } from "@/src/utils/api-cache";

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

if (!BACKEND_URL) {
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
    throw new Error(
      "Backend URL not configured. Run ./scripts/sync-env-from-aws.sh and restart Expo (npm run start -- --clear)."
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
    throw new Error(
      `Cannot reach API at ${BACKEND_URL}. Use iOS/Android simulator or Expo Go (not web) if this persists, and restart with: npx expo start --clear`
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
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
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
  signUp: (name: string, email: string, password: string) =>
    request("/auth/signup", { method: "POST", body: { name, email, password }, auth: false }),
  signIn: (email: string, password: string) =>
    request("/auth/signin", { method: "POST", body: { email, password }, auth: false }),
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
  moodHistory: () => request("/mood/history"),

  createJournal: (content: string, mood?: string) =>
    request("/journal", { method: "POST", body: { content, mood } }),
  listJournal: () => request("/journal"),

  /** Conversational wisdom (RAG + Bedrock) */
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
  wisdomHistory: (conversation_id?: string) =>
    request(
      `/wisdom/history${conversation_id ? `?conversation_id=${encodeURIComponent(conversation_id)}` : ""}`
    ),
  wisdomStatus: () => request("/wisdom/status", { auth: false }),
  wisdomQuota: () =>
    request<{ used: number; limit: number; remaining: number; month: string; ok: boolean }>(
      "/wisdom/quota"
    ),

  /** Product usage summary (daily rollups for analysis) */
  analyticsSummary: (days = 7) =>
    request<{
      days: { day: string; dau: number; events: number; by_event: Record<string, number> }[];
      totals: { events: number; dau_sum: number; by_event: Record<string, number> };
    }>(`/analytics/summary?days=${days}`),
  analyticsMe: (limit = 40) =>
    request<{ events: unknown[]; counts: Record<string, number> }>(
      `/analytics/me?limit=${limit}`
    ),

  /**
   * Voice note → Amazon Transcribe.
   * 1) presign → PUT audio to S3
   * 2) transcribe(s3_key) → text for the input box (user then taps Send)
   */
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

  /** @deprecated use wisdomChat */
  generatePrayer: (feeling: string, context?: string) =>
    request("/ai/prayer", { method: "POST", body: { feeling, context } }),
  aiPrayerHistory: () => request("/ai/prayers/history"),

  subscriptionStatus: () => request("/subscription/status"),
  syncSubscription: (body: { active: boolean; plan?: "monthly" | "annual" | null }) =>
    request("/subscription/sync", { method: "POST", body }),
};
