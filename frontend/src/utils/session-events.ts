/**
 * Lightweight session lifecycle bus (no React dependency).
 * Used by the API client when auth fails mid-session.
 */

export type SessionEvent =
  | { type: "expired"; message?: string }
  | { type: "cleared" };

type Listener = (event: SessionEvent) => void;

const listeners = new Set<Listener>();

export function onSessionEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionExpired(message?: string) {
  const event: SessionEvent = {
    type: "expired",
    message:
      message ||
      "Your session ended quietly. Sign in again to continue your journey.",
  };
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      // ignore subscriber errors
    }
  });
}

export function emitSessionCleared() {
  const event: SessionEvent = { type: "cleared" };
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      // ignore
    }
  });
}
