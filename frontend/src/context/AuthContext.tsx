import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      setUser(null);
      await storage.secureRemove("cc_token");
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await storage.secureGet("cc_token", "");
      const ob = await storage.getItem("cc_onboarding_done", false);
      setOnboardingComplete(Boolean(ob));
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    })();
  }, [refreshUser]);

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
      value={{ loading, user, onboardingComplete, signIn, signUp, signOut, refreshUser, markOnboardingComplete }}
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
