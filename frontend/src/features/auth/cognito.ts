import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import {
  AuthenticationDetails,
  CognitoRefreshToken,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

WebBrowser.maybeCompleteAuthSession();

export type CognitoConfig = {
  provider: string;
  region: string;
  user_pool_id: string | null;
  client_id: string | null;
  domain: string | null;
  apple_enabled: boolean;
};

export type CognitoTokens = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

const REGION = process.env.EXPO_PUBLIC_COGNITO_REGION || "us-east-1";
const POOL_ID = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || "";
const CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || "";
const DOMAIN = (process.env.EXPO_PUBLIC_COGNITO_DOMAIN || "").replace(/^https?:\/\//, "");

let cachedPool: CognitoUserPool | null = null;

export function cognitoConfigured(): boolean {
  return Boolean(POOL_ID && CLIENT_ID);
}

function getPool(): CognitoUserPool {
  if (!cognitoConfigured()) {
    throw new Error("Cognito is not configured. Run ./scripts/sync-env-from-aws.sh");
  }
  if (!cachedPool) {
    cachedPool = new CognitoUserPool({
      UserPoolId: POOL_ID,
      ClientId: CLIENT_ID,
    });
  }
  return cachedPool;
}

export function getRedirectUri(): string {
  // Web preview must use an http(s) callback registered on the Cognito app client.
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/oauth`;
  }
  return AuthSession.makeRedirectUri({
    scheme: "frontend",
    path: "oauth",
  });
}

function hostedUiBase(): string {
  if (!DOMAIN) throw new Error("EXPO_PUBLIC_COGNITO_DOMAIN is not set");
  return `https://${DOMAIN}`;
}

function sessionToTokens(session: CognitoUserSession): CognitoTokens {
  return {
    idToken: session.getIdToken().getJwtToken(),
    accessToken: session.getAccessToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken(),
  };
}

export type SignUpResult = {
  userConfirmed: boolean;
  email: string;
};

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string
): Promise<SignUpResult> {
  const pool = getPool();
  const normalizedEmail = email.trim().toLowerCase();
  const attrs = [new CognitoUserAttribute({ Name: "name", Value: name.trim() })];
  return new Promise<SignUpResult>((resolve, reject) => {
    pool.signUp(normalizedEmail, password, attrs, [], (err, result) => {
      if (err) reject(new Error(err.message || "Sign up failed"));
      else resolve({ userConfirmed: Boolean(result?.userConfirmed), email: normalizedEmail });
    });
  });
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  const pool = getPool();
  const user = new CognitoUser({ Username: email.trim().toLowerCase(), Pool: pool });
  await new Promise<void>((resolve, reject) => {
    user.confirmRegistration(code.trim(), true, (err) => {
      if (err) reject(new Error(err.message || "Invalid verification code"));
      else resolve();
    });
  });
}

export async function resendConfirmationCode(email: string): Promise<void> {
  const pool = getPool();
  const user = new CognitoUser({ Username: email.trim().toLowerCase(), Pool: pool });
  await new Promise<void>((resolve, reject) => {
    user.resendConfirmationCode((err) => {
      if (err) reject(new Error(err.message || "Could not resend code"));
      else resolve();
    });
  });
}

export async function forgotPassword(email: string): Promise<void> {
  const pool = getPool();
  const user = new CognitoUser({ Username: email.trim().toLowerCase(), Pool: pool });
  await new Promise<void>((resolve, reject) => {
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: (err) => reject(new Error(err.message || "Could not send reset code")),
    });
  });
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const pool = getPool();
  const user = new CognitoUser({ Username: email.trim().toLowerCase(), Pool: pool });
  await new Promise<void>((resolve, reject) => {
    user.confirmPassword(code.trim(), newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(new Error(err.message || "Could not reset password")),
    });
  });
}

export async function signInWithEmail(email: string, password: string): Promise<CognitoTokens> {
  const pool = getPool();
  const user = new CognitoUser({ Username: email.trim().toLowerCase(), Pool: pool });
  const details = new AuthenticationDetails({
    Username: email.trim().toLowerCase(),
    Password: password,
  });

  const session = await new Promise<CognitoUserSession>((resolve, reject) => {
    user.authenticateUser(details, {
      onSuccess: resolve,
      onFailure: (err) => {
        const code = (err as { code?: string }).code;
        if (code === "UserNotConfirmedException") {
          reject(new Error("USER_NOT_CONFIRMED"));
          return;
        }
        reject(new Error(err.message || "Sign in failed"));
      },
    });
  });

  return sessionToTokens(session);
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<CognitoTokens> {
  const tokenUrl = `${hostedUiBase()}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error_description || data?.error || "Token exchange failed");
  }

  return {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

export async function signInWithProvider(
  provider: "SignInWithApple" = "SignInWithApple"
): Promise<CognitoTokens> {
  if (!DOMAIN) {
    throw new Error("Cognito domain is not configured. Run ./scripts/sync-env-from-aws.sh");
  }

  const redirectUri = getRedirectUri();
  const discovery: AuthSession.DiscoveryDocument = {
    authorizationEndpoint: `${hostedUiBase()}/oauth2/authorize`,
    tokenEndpoint: `${hostedUiBase()}/oauth2/token`,
  };

  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    redirectUri,
    scopes: ["openid", "email", "profile"],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      identity_provider: provider,
    },
  });

  const result = await request.promptAsync(discovery, {
    showInRecents: true,
    preferEphemeralSession: Platform.OS !== "web",
  });

  if (result.type === "dismiss" || result.type === "cancel") {
    throw new Error("Sign-in was cancelled");
  }
  if (result.type !== "success" || !result.params?.code) {
    const err =
      (result as { params?: { error_description?: string; error?: string } }).params
        ?.error_description ||
      (result as { params?: { error?: string } }).params?.error ||
      "Apple sign-in failed";
    if (/invalid_request|not enabled|not found|identity.?provider/i.test(err)) {
      throw new Error(
        "Apple sign-in is not linked in Cognito yet. Add Apple Services ID + key to infrastructure/terraform/terraform.tfvars (see config/auth/README.md), then ./scripts/deploy-aws.sh apply."
      );
    }
    throw new Error(err);
  }

  if (request.codeVerifier) {
    const tokenUrl = `${hostedUiBase()}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code: result.params.code,
      redirect_uri: redirectUri,
      code_verifier: request.codeVerifier,
    });
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error_description || data?.error || "Token exchange failed");
    }
    return {
      idToken: data.id_token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  return exchangeCodeForTokens(result.params.code, redirectUri);
}

export async function refreshTokens(refreshToken: string): Promise<CognitoTokens> {
  const pool = getPool();
  const user = new CognitoUser({ Username: "_", Pool: pool });
  const session = await new Promise<CognitoUserSession>((resolve, reject) => {
    user.refreshSession(new CognitoRefreshToken({ RefreshToken: refreshToken }), (err, sess) => {
      if (err || !sess) reject(new Error(err?.message || "Session refresh failed"));
      else resolve(sess);
    });
  });
  return sessionToTokens(session);
}

export function signOutCognito(): void {
  const pool = getPool();
  const user = pool.getCurrentUser();
  if (user) user.signOut();
}

export async function fetchAuthConfig(apiBase: string): Promise<CognitoConfig | null> {
  try {
    const res = await fetch(`${apiBase}/auth/config`);
    if (!res.ok) return null;
    return (await res.json()) as CognitoConfig;
  } catch {
    return null;
  }
}

/** Parse tokens returned via deep link (fallback). */
export function parseOAuthRedirect(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/[?&#]code=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function cognitoLogoutUrl(): string {
  const redirect = Linking.createURL("oauth");
  return `${hostedUiBase()}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(redirect)}`;
}