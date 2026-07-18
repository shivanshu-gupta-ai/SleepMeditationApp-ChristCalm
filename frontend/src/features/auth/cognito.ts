import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

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

const IDP_URL = `https://cognito-idp.${REGION}.amazonaws.com/`;

export function cognitoConfigured(): boolean {
  return Boolean(POOL_ID && CLIENT_ID);
}

/**
 * Sign in with Apple via Cognito Hosted UI works on iOS, Android, and web
 * once Apple Developer Services ID + return URL are configured (see config/auth/README.md).
 */
export function appleSignInSupported(): boolean {
  return Boolean(DOMAIN && CLIENT_ID);
}

function requireCognito() {
  if (!cognitoConfigured()) {
    throw new Error("Cognito is not configured. Run ./scripts/sync-env-from-aws.sh and restart Expo.");
  }
}

export function getRedirectUri(): string {
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

/** Low-level Cognito IDP JSON API (works on web + native; no SRP / secret hash). */
async function cognitoIdp<T = Record<string, unknown>>(
  target: string,
  body: Record<string, unknown>
): Promise<T> {
  requireCognito();
  const res = await fetch(IDP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || `Cognito HTTP ${res.status}` };
  }

  if (!res.ok) {
    const type = String(data.__type || data.code || "");
    const msg = String(data.message || data.__type || `Cognito error ${res.status}`);
    // Normalize common cases for the UI
    if (type.includes("UserNotConfirmedException") || /not confirmed/i.test(msg)) {
      throw new Error("USER_NOT_CONFIRMED");
    }
    if (type.includes("NotAuthorizedException") || /incorrect username or password/i.test(msg)) {
      throw new Error("Incorrect email or password");
    }
    if (type.includes("UsernameExistsException")) {
      throw new Error("An account with this email already exists");
    }
    if (type.includes("InvalidPasswordException") || type.includes("InvalidParameterException")) {
      throw new Error(msg);
    }
    if (type.includes("CodeMismatchException")) {
      throw new Error("Invalid verification code");
    }
    if (type.includes("ExpiredCodeException")) {
      throw new Error("Verification code expired — request a new one");
    }
    if (type.includes("UserNotFoundException")) {
      throw new Error("No account found with that email");
    }
    if (type.includes("ResourceNotFoundException") || /client.*does not exist/i.test(msg)) {
      throw new Error(
        "Cognito app client not found. Run ./scripts/sync-env-from-aws.sh and restart Expo with --clear."
      );
    }
    throw new Error(msg);
  }

  return data as T;
}

function authResultToTokens(result: {
  AccessToken?: string;
  IdToken?: string;
  RefreshToken?: string;
}): CognitoTokens {
  if (!result?.AccessToken || !result?.IdToken) {
    throw new Error("Sign in failed — no tokens returned");
  }
  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken || "",
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
  const normalizedEmail = email.trim().toLowerCase();
  const data = await cognitoIdp<{ UserConfirmed?: boolean; UserSub?: string }>("SignUp", {
    ClientId: CLIENT_ID,
    Username: normalizedEmail,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: normalizedEmail },
      { Name: "name", Value: name.trim() },
    ],
  });
  return {
    userConfirmed: Boolean(data.UserConfirmed),
    email: normalizedEmail,
  };
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  await cognitoIdp("ConfirmSignUp", {
    ClientId: CLIENT_ID,
    Username: email.trim().toLowerCase(),
    ConfirmationCode: code.trim(),
  });
}

export async function resendConfirmationCode(email: string): Promise<void> {
  await cognitoIdp("ResendConfirmationCode", {
    ClientId: CLIENT_ID,
    Username: email.trim().toLowerCase(),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await cognitoIdp("ForgotPassword", {
    ClientId: CLIENT_ID,
    Username: email.trim().toLowerCase(),
  });
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  await cognitoIdp("ConfirmForgotPassword", {
    ClientId: CLIENT_ID,
    Username: email.trim().toLowerCase(),
    ConfirmationCode: code.trim(),
    Password: newPassword,
  });
}

export async function signInWithEmail(email: string, password: string): Promise<CognitoTokens> {
  const data = await cognitoIdp<{
    AuthenticationResult?: {
      AccessToken?: string;
      IdToken?: string;
      RefreshToken?: string;
    };
    ChallengeName?: string;
  }>("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email.trim().toLowerCase(),
      PASSWORD: password,
    },
  });

  if (data.ChallengeName) {
    throw new Error(`Additional sign-in step required: ${data.ChallengeName}`);
  }
  return authResultToTokens(data.AuthenticationResult || {});
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
  if (!appleSignInSupported()) {
    throw new Error(
      "Sign in with Apple isn’t available in the browser. Use email and password (test@christcalm.dev / Test1234)."
    );
  }
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
    if (/invalid_client/i.test(err)) {
      throw new Error(
        "Apple Sign-In is not fully configured (invalid_client). Use email sign-in for now. See config/auth/README.md for Apple return URL setup."
      );
    }
    if (/invalid_request|not enabled|not found|identity.?provider/i.test(err)) {
      throw new Error(
        "Apple sign-in is not linked in Cognito yet. Use email sign-in, or finish Apple setup in config/auth/README.md."
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
      const err = String(data?.error_description || data?.error || "Token exchange failed");
      if (/invalid_client/i.test(err)) {
        throw new Error(
          "Apple Sign-In token exchange failed. Use email sign-in (test@christcalm.dev / Test1234)."
        );
      }
      throw new Error(err);
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
  const data = await cognitoIdp<{
    AuthenticationResult?: {
      AccessToken?: string;
      IdToken?: string;
      RefreshToken?: string;
    };
  }>("InitiateAuth", {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });
  const result = data.AuthenticationResult || {};
  // Refresh flow may omit a new refresh token — keep the old one
  return {
    accessToken: result.AccessToken || "",
    idToken: result.IdToken || "",
    refreshToken: result.RefreshToken || refreshToken,
  };
}

export function signOutCognito(): void {
  // Tokens are cleared by AuthContext; no server session for USER_PASSWORD_AUTH
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
