import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";
import { api } from "@/src/api/client";
import {
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

const TOKEN_KEY = "cc_cognito_tokens";

async function saveTokens(tokens: CognitoTokens): Promise<void> {
  await storage.secureSet(TOKEN_KEY, JSON.stringify(tokens));
  await storage.secureSet("cc_token", tokens.accessToken);
}

async function loadTokens(): Promise<CognitoTokens | null> {
  const raw = await storage.secureGet(TOKEN_KEY, "");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CognitoTokens;
  } catch {
    return null;
  }
}

async function clearTokens(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
  await storage.secureRemove("cc_token");
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
    } catch {
      setUser(null);
      await clearTokens();
    }
  }, []);

  const establishSession = useCallback(
    async (tokens: CognitoTokens) => {
      await saveTokens(tokens);
      await refreshUser();
    },
    [refreshUser]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const config = await api.authConfig();
        if (mounted && config) {
          setAppleEnabled(Boolean(config.apple_enabled));
        }
      } catch {
        // non-blocking
      }

      const ob = await storage.getItem("cc_onboarding_done", false);
      if (mounted) setOnboardingComplete(Boolean(ob));

      if (!cognitoConfigured()) {
        const legacy = await storage.secureGet("cc_token", "");
        if (legacy) await refreshUser();
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
