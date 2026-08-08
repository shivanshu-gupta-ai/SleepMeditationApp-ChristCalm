# Auth (ChristCalm)

**Source of truth for secrets:** AWS SSM (via Terraform).  
**Identity provider:** Amazon Cognito User Pool.  
**App never holds Apple private keys** — only Cognito does.

---

## How sign-in works (architecture)

```
┌─────────────┐     1. Start auth      ┌──────────────────┐
│  Expo app   │ ─────────────────────► │  Amazon Cognito  │
│  (frontend) │                        │  User Pool       │
└─────────────┘                        └────────┬─────────┘
       ▲                                        │
       │ 4. access + id + refresh tokens        │ 2. Federate
       │                                        ▼
       │                               ┌──────────────────┐
       │                               │  Sign in with    │
       │                               │  Apple           │
       │                               └────────┬─────────┘
       │                                        │
       │ 5. Bearer access token                 │ 3. identity token
       ▼                                        ▼
┌─────────────┐                        Cognito creates/links user
│  FastAPI    │                        (sub + email) in User Pool
│  Lambda     │
│  GetUser +  │
│  DynamoDB   │
└─────────────┘
```

There are **two** user-facing methods; both end with a **Cognito access token** the API trusts.

| Method | Who authenticates the user | App code |
|--------|---------------------------|----------|
| **Email + password** | Cognito directly (`USER_PASSWORD_AUTH`) | `signInWithEmail` / `signUpWithEmail` |
| **Sign in with Apple** | Apple → Cognito Hosted UI (OAuth code + PKCE) | `signInWithProvider("SignInWithApple")` |

**Sign up vs sign in with Apple is the same button.**  
Apple only returns identity once; Cognito:

- **First time** → creates a Cognito user (`SignInWithApple_<sub>`) and maps email/name  
- **Later** → signs that same user in  

Backend (`auth/cognito.py`) then **finds or creates** a DynamoDB profile from the Cognito `sub` + email.

---

## Email / password (already working)

```bash
./scripts/seed-test-user.sh
# test@christcalm.dev / Test1234
```

App: `frontend/src/features/auth/cognito.ts` → Cognito `InitiateAuth`.  
API: validates access token with `GetUser`, then loads DynamoDB user.

---

## Sign in with Apple — full setup checklist

Your **AWS side is already wired** if `enable_apple_sign_in = true` and SSM has keys:

| Piece | Current ChristCalm-Dev value |
|-------|------------------------------|
| Cognito domain | `christcalm-dev.auth.us-east-1.amazoncognito.com` |
| App client ID | from `terraform output cognito_client_id` |
| Apple Services ID (client_id) | `com.christcalm.app.signin` |
| Team ID | `A978T8YCZZ` |
| Key ID | `DRL78NBCUL` |
| **Return URL (must match exactly)** | `https://christcalm-dev.auth.us-east-1.amazoncognito.com/oauth2/idpresponse` |

`invalid_client` almost always means **Apple Developer** is missing or mismatches that return URL / Services ID / key — not that Cognito is “broken.”

### A. Apple Developer Portal (required)

1. **Certificates, Identifiers & Profiles** → **Identifiers**
2. **App ID** (e.g. `com.christcalm.app`)
   - Enable **Sign in with Apple**
3. **Services ID** = `com.christcalm.app.signin` (this is the OAuth **client_id** Cognito uses with Apple)
   - Enable **Sign in with Apple** → **Configure**
   - **Primary App ID:** your app id  
   - **Domains and Subdomains:**  
     `christcalm-dev.auth.us-east-1.amazoncognito.com`  
     *(no `https://`)*  
   - **Return URLs:**  
     `https://christcalm-dev.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`  
     *(must be exact — trailing slash wrong will fail)*  
4. **Keys** → create or use a key with **Sign in with Apple**
   - Note **Key ID** (e.g. `DRL78NBCUL`)
   - Download **`.p8` once** — keep it safe
   - Team ID is in Membership details (e.g. `A978T8YCZZ`)

### B. Put secrets in AWS SSM (not in git)

```bash
export APPLE_SERVICES_ID=com.christcalm.app.signin
export APPLE_TEAM_ID=A978T8YCZZ
export APPLE_KEY_ID=DRL78NBCUL
export APPLE_PRIVATE_KEY_FILE=~/Downloads/AuthKey_DRL78NBCUL.p8

./scripts/seed-apple-ssm-once.sh
```

Script normalizes raw `.p8` body into PEM if headers are missing.

### C. Enable IdP in Terraform + deploy

```hcl
# infrastructure/terraform/terraform.tfvars
enable_apple_sign_in = true
```

```bash
./scripts/deploy-aws.sh apply
# After changing the private key in SSM, also refresh Cognito IdP:
#   aws cognito-idp update-identity-provider ...  (or re-seed + apply with ignore_changes removed once)
./scripts/sync-env-from-aws.sh
```

### D. App client redirect URIs (already in Terraform)

For local Expo web / native, Cognito app client must allow:

- `http://localhost:8081/oauth`
- `http://127.0.0.1:8081/oauth`
- `frontend://oauth`
- `com.christcalm.app://oauth`
- `exp://localhost:8081/--/oauth`

These are set in `infrastructure/terraform/cognito.tf` + `variables.tf`.

### E. App env (public only)

```bash
./scripts/sync-env-from-aws.sh
# frontend/.env gets EXPO_PUBLIC_COGNITO_* — no Apple secrets
```

Restart Expo: `npx expo start --clear`

---

## Runtime flow (Apple button)

1. User taps **Sign in with Apple**  
2. App opens Cognito Hosted UI:  
   `https://<cognito_domain>/oauth2/authorize?client_id=<cognito_app_client>&identity_provider=SignInWithApple&redirect_uri=...&code_challenge=...`  
3. Cognito redirects to Apple; user authenticates with Face ID / password / 2FA  
4. Apple redirects back to Cognito return URL (`/oauth2/idpresponse`)  
5. Cognito redirects to your app `redirect_uri` with `?code=...`  
6. App exchanges code (+ PKCE verifier) at Cognito `/oauth2/token`  
7. App stores access/id/refresh tokens; calls `GET /api/auth/me` with `Authorization: Bearer <accessToken>`  
8. Backend validates token with Cognito `GetUser`, upserts DynamoDB user  

**Same path for “sign up” and “sign in”** — Apple does not have a separate register API in this design.

---

## What your “auth service” owns

| Layer | Responsibility |
|-------|----------------|
| **Apple** | Prove “this is the Apple user” |
| **Cognito** | Federation, user pool, tokens, app clients |
| **Backend** | Trust Cognito tokens, app profile, premium, journal, etc. |
| **App** | Start OAuth / password auth, store tokens, call API |

Do **not** implement raw Apple token verification in Lambda unless you leave Cognito. Cognito already issues the tokens the API should accept.

---

## Troubleshooting `invalid_client`

| Check | Expected |
|-------|----------|
| Services ID | Exactly `com.christcalm.app.signin` (matches Cognito IdP `client_id`) |
| Return URL | `https://christcalm-dev.auth.us-east-1.amazoncognito.com/oauth2/idpresponse` |
| Domain | `christcalm-dev.auth.us-east-1.amazoncognito.com` |
| Key ID / Team ID / .p8 | Match the key enabled for Sign in with Apple |
| .p8 format in SSM | PEM with `-----BEGIN PRIVATE KEY-----` |
| App redirect after Cognito | Listed on Cognito app client Callback URLs |

Verify IdP:

```bash
aws cognito-idp describe-identity-provider \
  --user-pool-id "$(cd infrastructure/terraform && terraform output -raw cognito_user_pool_id)" \
  --provider-name SignInWithApple \
  --region us-east-1
```

---

## RevenueCat (iOS only)

**Full guide (App Store Connect + RC + app + webhook):**  
→ [`docs/engineering/revenuecat-ios-app-store-guide.md`](../../docs/engineering/revenuecat-ios-app-store-guide.md)

**Project:** `proj43f1dce8` (ChristCalm)  
**Catalog:** entitlement `christcalm_premium`, offering `default`, products `cc_999_1m`, `cc_5999_1y`, `cc_3999_1y`, `cc_1999_1y` (no trial)

**MCP:** `~/.grok/config.toml` → `[mcp_servers.revenuecat]`

| Env | Purpose |
|-----|---------|
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | Public SDK key (`test_…` Test Store, or `appl_…` after App Store app) |
| `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` | `christcalm_premium` |
| `EXPO_PUBLIC_REVENUECAT_OFFERING_ID` | `default` |

Webhook secret → SSM (`REVENUECAT_WEBHOOK_AUTHORIZATION`). See `config/auth/revenuecat.example.json`.

**Production iOS:** add an **App Store** app in RC (bundle `com.christcalm.app`), create matching IAP products in App Store Connect, attach them to the same entitlement/packages, then swap the public key to `appl_…`.
