import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  bindBrowserConnectivity,
  isOnline,
  onConnectivityChange,
} from "@/src/utils/connectivity";
import {
  emitSessionCleared,
  onSessionEvent,
} from "@/src/utils/session-events";

type ConnectivityState = {
  online: boolean;
  sessionNotice: string | null;
  dismissSessionNotice: () => void;
};

const ConnectivityContext = createContext<ConnectivityState | undefined>(undefined);

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(isOnline);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  useEffect(() => {
    const unbind = bindBrowserConnectivity();
    const unsubNet = onConnectivityChange(setOnline);
    const unsubSession = onSessionEvent((event) => {
      if (event.type === "expired") {
        setSessionNotice(
          event.message ||
            "Your session ended quietly. Sign in again to continue your journey."
        );
      }
      if (event.type === "cleared") {
        setSessionNotice(null);
      }
    });
    return () => {
      unbind();
      unsubNet();
      unsubSession();
    };
  }, []);

  const value = useMemo(
    () => ({
      online,
      sessionNotice,
      dismissSessionNotice: () => {
        setSessionNotice(null);
        emitSessionCleared();
      },
    }),
    [online, sessionNotice]
  );

  return (
    <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) {
    return {
      online: true,
      sessionNotice: null as string | null,
      dismissSessionNotice: () => {},
    };
  }
  return ctx;
}
