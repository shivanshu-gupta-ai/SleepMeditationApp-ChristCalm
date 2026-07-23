/**
 * Per-session meditation ratings (1–5 stars).
 *
 * - Always cached locally for instant UI on this device.
 * - Persisted to DynamoDB via POST /api/meditations/rate for every authenticated user
 *   so ratings survive reinstall and are available server-side.
 */
import { storage } from "@/src/utils/storage";
import { api } from "@/src/api/client";

const KEY = "cc_meditation_ratings_v1";

type RatingsMap = Record<string, { stars: number; at: string }>;

async function loadMap(): Promise<RatingsMap> {
  try {
    const raw = await storage.getItem<string>(KEY, "");
    if (!raw) return {};
    return JSON.parse(raw) as RatingsMap;
  } catch {
    return {};
  }
}

export async function getMeditationRating(meditationId: string): Promise<number | null> {
  const map = await loadMap();
  const row = map[meditationId];
  return row?.stars ?? null;
}

/**
 * Save rating locally and sync to backend DynamoDB for the signed-in user.
 * Local write always succeeds; server write is best-effort (offline / unauth).
 */
export async function saveMeditationRating(
  meditationId: string,
  stars: number,
  minutes?: number
): Promise<{ local: true; synced: boolean }> {
  const n = Math.max(1, Math.min(5, Math.round(stars)));
  const map = await loadMap();
  map[meditationId] = { stars: n, at: new Date().toISOString() };
  await storage.setItem(KEY, JSON.stringify(map));

  try {
    await api.rateMeditation(meditationId, n, minutes);
    return { local: true, synced: true };
  } catch (e) {
    console.warn("Meditation rating not synced to server", e);
    return { local: true, synced: false };
  }
}
