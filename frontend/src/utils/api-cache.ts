/**
 * Simple in-memory TTL cache for public catalog API responses.
 * DIY scale — cuts repeat Lambda hits for emotions/meditations/devotional.
 */

type Entry = { expires: number; data: unknown };

const store = new Map<string, Entry>();

/** Default 5 minutes — matches backend Cache-Control max-age */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) {
    store.delete(key);
    return null;
  }
  return e.data as T;
}

export function cacheSet(key: string, data: unknown, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function cacheClear(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
