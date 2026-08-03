import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { storage } from "@/src/utils/storage";
import { api } from "@/src/api/client";
import {
  appleSignInSupported,
  cognitoConfigured,
  confirmForgotPassword,
  confirmSignUp,
  forgotPassword,
  refreshTokens,
  resendConfirmationCode,
  signInWithEmail,
  signInWithProvider,
  signOutCognito,
  signUpWithEmail,
  type CognitoTokens,
  type SignUpResult,
} from "@/src/features/auth/cognito";
import { COGNITO_TOKENS_KEY } from "@/src/utils/auth-token";
import { onSessionEvent } from "@/src/utils/session-events";

export type User = {
  id: string;
  name: string;
  email: string;
  is_premium: boolean;
  /** free | premium — from backend */
  subscription_tier?: "free" | "premium";
  plan?: string | null;
  premium_until?: string | null;
  provider?: string | null;
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
  appleAuthPending: boolean;
  appleEnabled: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  resendEmailCode: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

async function saveTokens(tokens: CognitoTokens): Promise<void> {
  await storage.secureSet(COGNITO_TOKENS_KEY, JSON.stringify(tokens));
}

async function loadTokens(): Promise<CognitoTokens | null> {
  const raw = await storage.secureGet(COGNITO_TOKENS_KEY, "");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CognitoTokens;
  } catch {
    return null;
  }
}

async function clearTokens(): Promise<void> {
  await storage.secureRemove(COGNITO_TOKENS_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [appleAuthPending, setAppleAuthPending] = useState(false);
  const [appleEnabled, setAppleEnabled] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch (e: any) {
      // Only end the session on auth failure — keep tokens on network blips
      const kind = e?.kind as string | undefined;
      const status = e?.status as number | undefined;
      const msg = String(e?.message || "").toLowerCase();
      const unauthorized =
        kind === "unauthorized" ||
        status === 401 ||
        status === 403 ||
        msg.includes("session ended") ||
        msg.includes("not authenticated") ||
        msg.includes("unauthorized");
      if (unauthorized) {
        setUser(null);
        await clearTokens();
      }
      // network / 5xx: leave existing user + tokens so offline banner can show
    }
  }, []);

  const establishSession = useCallback(
    async (tokens: CognitoTokens) => {
      await saveTokens(tokens);
      await refreshUser();
    },
    [refreshUser]
  );

  const signingOutRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // Show Sign in with Apple whenever Hosted UI is possible (domain + client).
      // Backend `apple_enabled` reflects whether the Apple IdP is fully configured in Cognito;
      // the button still appears so users can attempt Apple login/signup.
      if (mounted) {
        setAppleEnabled(appleSignInSupported());
      }
      try {
        const config = await api.authConfig();
        if (mounted && config) {
          // Prefer true when server reports IdP ready; keep button if client can open Hosted UI
          setAppleEnabled(
            appleSignInSupported() &&
              (Boolean(config.apple_enabled) || Boolean(config.domain && config.client_id))
          );
        }
      } catch {
        // non-blocking — client env alone is enough to show the button
      }

      const ob = await storage.getItem("cc_onboarding_done", false);
      if (mounted) setOnboardingComplete(Boolean(ob));

      if (!cognitoConfigured()) {
        if (mounted) setLoading(false);
        return;
      }

      let tokens = await loadTokens();
      if (tokens?.refreshToken) {
        try {
          tokens = await refreshTokens(tokens.refreshToken);
          await saveTokens(tokens);
        } catch {
          await clearTokens();
          tokens = null;
        }
      }

      if (tokens?.idToken) {
        await refreshUser();
      }

      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  // Mid-session 401/403 → clear tokens softly (banner handled by ConnectivityProvider)
  useEffect(() => {
    return onSessionEvent(async (event) => {
      if (event.type !== "expired" || signingOutRef.current) return;
      signingOutRef.current = true;
      try {
        try {
          const { stopActiveMeditationPlayer } = await import(
            "@/src/utils/meditation-audio"
          );
          stopActiveMeditationPlayer();
        } catch {
          // ignore
        }
        if (cognitoConfigured()) signOutCognito();
        await clearTokens();
        setUser(null);
      } finally {
        signingOutRef.current = false;
      }
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const tokens = await signInWithEmail(email, password);
    await establishSession(tokens);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const result = await signUpWithEmail(name, email, password);
    if (result.userConfirmed) {
      const tokens = await signInWithEmail(email, password);
      await establishSession(tokens);
    }
    return result;
  };

  const confirmEmail = async (email: string, code: string) => {
    await confirmSignUp(email, code);
  };

  const resendEmailCode = async (email: string) => {
    await resendConfirmationCode(email);
  };

  const requestPasswordReset = async (email: string) => {
    await forgotPassword(email);
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await confirmForgotPassword(email, code, newPassword);
  };

  const signInWithApple = async () => {
    setAppleAuthPending(true);
    try {
      const tokens = await signInWithProvider("SignInWithApple");
      await establishSession(tokens);
      await storage.setItem("cc_onboarding_done", true);
      setOnboardingComplete(true);
    } finally {
      setAppleAuthPending(false);
    }
  };

  const signOut = async () => {
    // Stop any meditation audio so it cannot keep playing after logout
    try {
      const { stopActiveMeditationPlayer } = await import(
        "@/src/utils/meditation-audio"
      );
      stopActiveMeditationPlayer();
    } catch {
      // ignore
    }
    if (cognitoConfigured()) signOutCognito();
    await clearTokens();
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
        appleAuthPending,
        appleEnabled,
        signIn,
        signUp,
        confirmEmail,
        resendEmailCode,
        requestPasswordReset,
        resetPassword,
        signInWithApple,
        signOut,
        refreshUser,
        markOnboardingComplete,
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
