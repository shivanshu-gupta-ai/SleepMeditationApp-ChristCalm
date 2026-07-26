/** Local + server meditation ratings (1–5). Local always; server best-effort. */
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
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("Meditation rating not synced to server", e);
    }
    return { local: true, synced: false };
  }
}
