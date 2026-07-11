import { storage } from "@/src/utils/storage";

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
  opts: { method?: string; body?: any; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
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


  emotions: () => request("/emotions", { auth: false }),
  meditations: (emotion?: string) =>
    request(`/meditations${emotion ? `?emotion=${emotion}` : ""}`, { auth: false }),
  meditationById: (id: string) => request(`/meditations/${id}`, { auth: false }),
  completeMeditation: (meditation_id: string, minutes: number) =>
    request("/meditations/complete", { method: "POST", body: { meditation_id, minutes } }),
  prayers: (category?: string) =>
    request(`/prayers${category ? `?category=${category}` : ""}`, { auth: false }),
  devotional: () => request("/devotional/today", { auth: false }),

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
