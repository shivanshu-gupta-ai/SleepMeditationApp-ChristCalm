import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { storage } from "@/src/utils/storage";
import { api } from "@/src/api/client";

export type User = {
  id: string;
  name: string;
  email: string;
  is_premium: boolean;
  faith_journey?: string | null;
  concerns?: string[];
  streak?: number;
  minutes_meditated?: number;
  prayers_completed?: number;
};

type AuthState = {
  loading: boolean;
  user: User | null;
  onboardingComplete: boolean;
  googleAuthPending: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
  loginWithGoogleSessionId: (sessionId: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

function extractSessionId(url: string | null): string | null {
  if (!url) return null;
  // Look in hash or query
  const hashMatch = url.match(/[#?&]session_id=([^&]+)/);
  if (hashMatch) return decodeURIComponent(hashMatch[1]);
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [googleAuthPending, setGoogleAuthPending] = useState(false);
  const processedSessionIds = useRef<Set<string>>(new Set());

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      setUser(null);
      await storage.secureRemove("cc_token");
    }
  }, []);

  const loginWithGoogleSessionId = useCallback(
    async (sessionId: string) => {
      if (processedSessionIds.current.has(sessionId)) return;
      processedSessionIds.current.add(sessionId);
      setGoogleAuthPending(true);
      try {
        const res = await api.googleAuth(sessionId);
        await storage.secureSet("cc_token", res.token);
        setUser(res.user);
        await storage.setItem("cc_onboarding_done", true);
        setOnboardingComplete(true);
      } finally {
        setGoogleAuthPending(false);
      }
    },
    []
  );

  // Initial mount: check for session_id (web URL / mobile deep link), then fall back to stored token
  useEffect(() => {
    let mounted = true;

    (async () => {
      let sessionId: string | null = null;

      if (Platform.OS === "web" && typeof window !== "undefined") {
        sessionId =
          extractSessionId(window.location.hash) ||
          extractSessionId(window.location.search);
        if (sessionId) {
          // Clean the URL
          try {
            window.history.replaceState(null, "", window.location.pathname);
          } catch {}
        }
      } else {
        try {
          const initialUrl = await Linking.getInitialURL();
          sessionId = extractSessionId(initialUrl);
        } catch {}
      }

      if (sessionId) {
        try {
          await loginWithGoogleSessionId(sessionId);
        } catch (e) {
          console.warn("Google session exchange failed", e);
        }
        if (mounted) {
          const ob = await storage.getItem("cc_onboarding_done", false);
          setOnboardingComplete(Boolean(ob));
          setLoading(false);
        }
        return;
      }

      const token = await storage.secureGet("cc_token", "");
      const ob = await storage.getItem("cc_onboarding_done", false);
      if (mounted) setOnboardingComplete(Boolean(ob));
      if (token) {
        await refreshUser();
      }
      if (mounted) setLoading(false);
    })();

    // Mobile: listen for hot links (app already running when redirect happens)
    const sub = Linking.addEventListener("url", ({ url }) => {
      const sid = extractSessionId(url);
      if (sid) {
        loginWithGoogleSessionId(sid).catch((e) => console.warn(e));
      }
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [refreshUser, loginWithGoogleSessionId]);

  const signIn = async (email: string, password: string) => {
    const res = await api.signIn(email, password);
    await storage.secureSet("cc_token", res.token);
    setUser(res.user);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const res = await api.signUp(name, email, password);
    await storage.secureSet("cc_token", res.token);
    setUser(res.user);
  };

  const signOut = async () => {
    await storage.secureRemove("cc_token");
    setUser(null);
  };

  const markOnboardingComplete = async () => {
    await storage.setItem("cc_onboarding_done", true);
    setOnboardingComplete(true);
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        onboardingComplete,
        googleAuthPending,
        signIn,
        signUp,
        signOut,
        refreshUser,
        markOnboardingComplete,
        loginWithGoogleSessionId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
