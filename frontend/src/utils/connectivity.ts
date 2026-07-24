/**
 * App-wide connectivity signals without a native NetInfo dependency.
 * Sources: successful/failed fetches + browser online/offline events.
 */

type Listener = (online: boolean) => void;

let online = true;
const listeners = new Set<Listener>();
let recoverTimer: ReturnType<typeof setTimeout> | null = null;

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(online);
    } catch {
      // ignore
    }
  });
}

export function isOnline(): boolean {
  return online;
}

export function onConnectivityChange(listener: Listener): () => void {
  listeners.add(listener);
  listener(online);
  return () => {
    listeners.delete(listener);
  };
}

export function reportNetworkSuccess() {
  if (!online) {
    online = true;
    if (recoverTimer) {
      clearTimeout(recoverTimer);
      recoverTimer = null;
    }
    notify();
  }
}

export function reportNetworkFailure() {
  if (online) {
    online = false;
    notify();
  }
  // Soft auto-recover probe after a few seconds of quiet
  if (recoverTimer) clearTimeout(recoverTimer);
  recoverTimer = setTimeout(() => {
    // Optimistic flip — next successful request confirms; failures re-assert offline
    if (!online) {
      online = true;
      notify();
    }
  }, 12_000);
}

/** Browser-only hooks (safe no-ops on native). */
export function bindBrowserConnectivity() {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return () => {};
  }
  const on = () => reportNetworkSuccess();
  const off = () => reportNetworkFailure();
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    reportNetworkFailure();
  }
  return () => {
    window.removeEventListener("online", on);
    window.removeEventListener("offline", off);
  };
}

/** Friendly classification helpers for UI copy. */
export function isNetworkErrorMessage(message?: string | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("cannot reach api") ||
    m.includes("network") ||
    m.includes("failed to fetch") ||
    m.includes("network request failed") ||
    m.includes("offline") ||
    m.includes("internet") ||
    m.includes("timed out") ||
    m.includes("timeout")
  );
}

export function isSessionErrorMessage(message?: string | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("session") ||
    m.includes("unauthorized") ||
    m.includes("not authenticated") ||
    m.includes("sign in again") ||
    m.includes("token") ||
    m.includes("expired")
  );
}
