/**
 * Single secure store for Cognito session tokens.
 * Access token is derived for API Authorization headers.
 */

import { storage } from "@/src/utils/storage";

export const COGNITO_TOKENS_KEY = "cc_cognito_tokens";

export type StoredCognitoTokens = {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
};

export async function getAccessToken(): Promise<string> {
  const raw = await storage.secureGet(COGNITO_TOKENS_KEY, "");
  if (!raw) return "";
  try {
    const tokens = JSON.parse(raw) as StoredCognitoTokens;
    return typeof tokens?.accessToken === "string" ? tokens.accessToken : "";
  } catch {
    return "";
  }
}
