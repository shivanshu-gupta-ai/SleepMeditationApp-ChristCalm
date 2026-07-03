import { storage } from "@/src/utils/storage";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  console.warn("EXPO_PUBLIC_BACKEND_URL is not set");
}

export const API_BASE = `${BACKEND_URL}/api`;

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
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
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
  saveOnboarding: (faith_journey: string | null, concerns: string[]) =>
    request("/auth/onboarding", { method: "POST", body: { faith_journey, concerns } }),

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

  generatePrayer: (feeling: string, context?: string) =>
    request("/ai/prayer", { method: "POST", body: { feeling, context } }),
  aiPrayerHistory: () => request("/ai/prayers/history"),

  createCheckout: (plan: "monthly" | "annual", origin_url: string) =>
    request("/stripe/checkout", { method: "POST", body: { plan, origin_url } }),
  verifyCheckout: (session_id: string) => request(`/stripe/verify/${session_id}`),
  subscriptionStatus: () => request("/subscription/status"),
};
