/**
 * Per-session meditation ratings (1–5 stars), stored locally.
 */
import { storage } from "@/src/utils/storage";

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

export async function saveMeditationRating(
  meditationId: string,
  stars: number
): Promise<void> {
  const n = Math.max(1, Math.min(5, Math.round(stars)));
  const map = await loadMap();
  map[meditationId] = { stars: n, at: new Date().toISOString() };
  await storage.setItem(KEY, JSON.stringify(map));
}
