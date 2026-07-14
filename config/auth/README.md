# Auth & subscription keys

Put **real** values in `infrastructure/terraform/terraform.tfvars` (infrastructure) or AWS SSM (runtime). Use the `.example` files here as templates.

ChristCalm uses **AWS Cognito** for production auth (email/password + Google + Apple via Hosted UI).

## Email / password

Handled entirely in the mobile app via Cognito SDK. The backend validates Cognito **access tokens** on `/api/auth/me` and protected routes.

- **Preview/staging:** `cognito_auto_confirm_users = true` in `terraform.tfvars` (no email verification step).
- **Production:** set `cognito_auto_confirm_users = false` — users verify via the in-app confirm-email screen. Cognito sends email (50/day on default sender; use SES for scale).

Password policy (enforced by Cognito + app): 8+ chars, upper, lower, number.

## Google Sign-In (Cognito federated)

1. [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth 2.0 Client ID (**Web application**).
2. **Authorized redirect URI** (Cognito IdP callback — not your API):
   ```
   https://YOUR_COGNITO_DOMAIN.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
   ```
   Example: `https://christcalm-preview.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
3. Set in `infrastructure/terraform/terraform.tfvars`:
   ```hcl
   google_client_id     = "YOUR_CLIENT_ID.apps.googleusercontent.com"
   google_client_secret = "YOUR_CLIENT_SECRET"
   ```
4. Apply: `./scripts/deploy-aws.sh apply`
5. Sync app env: `./scripts/sync-env-from-aws.sh`

The app opens Cognito Hosted UI with `identity_provider=Google` (PKCE). Callback URLs are in `cognito_callback_urls` (deep links + localhost for preview).

## Apple Sign-In (Cognito federated)

1. Apple Developer → Identifiers → Services ID + Sign in with Apple key (.p8).
2. Configure return URLs in Apple to match Cognito Hosted UI (same pattern as Google).
3. Set in `terraform.tfvars`:
   ```hcl
   apple_services_id  = "com.christcalm.app.signin"
   apple_team_id      = "YOUR_TEAM_ID"
   apple_key_id       = "YOUR_KEY_ID"
   apple_private_key  = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```
4. `./scripts/deploy-aws.sh apply` && `./scripts/sync-env-from-aws.sh`

## Local preview

```bash
./scripts/sync-env-from-aws.sh
./scripts/preview.sh
```

Open http://localhost:8081 (web) or Expo Go / simulator. Backend stays on AWS Lambda.

## RevenueCat (in-app subscriptions)

ChristCalm uses **RevenueCat** for iOS/Android subscriptions (required by App Store / Google Play).

### 1. RevenueCat project setup

1. Create a project at [RevenueCat](https://www.revenuecat.com/) — framework: **Expo**.
2. Add apps:
   - iOS bundle ID: `com.christcalm.app`
   - Android package: `com.christcalm.app`
3. Create products in **App Store Connect** and **Google Play Console**, then link them in RevenueCat.

### 2. Keys to copy into the app

| Value | Where to find it | Goes in |
|-------|------------------|---------|
| iOS public SDK key (`appl_…`) | RevenueCat → Project → iOS app → API keys | `frontend/.env` → `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` |
| Android public SDK key (`goog_…`) | RevenueCat → Android app → API keys | `frontend/.env` → `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` |
| Entitlement ID | RevenueCat → Entitlements | `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` (default: `christcalm_premium`) |
| Offering ID | RevenueCat → Offerings | `EXPO_PUBLIC_REVENUECAT_OFFERING_ID` (default: `default`) |
| Monthly product ID | App Store / Play product ID | `EXPO_PUBLIC_REVENUECAT_PRODUCT_MONTHLY` |
| Annual product ID | App Store / Play product ID | `EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL` |

See `revenuecat.example.json` for the full template.

### 3. Webhook (backend sync)

In RevenueCat → Project → Integrations → Webhooks:

- **URL**: `https://YOUR_API_GATEWAY_URL/api/revenuecat/webhook`
- **Authorization header**: choose a secret string (e.g. random 32+ chars)

Copy that secret to:

- `backend/.env` → `REVENUECAT_WEBHOOK_AUTHORIZATION`
- `infrastructure/terraform/terraform.tfvars` → `revenuecat_webhook_authorization`

Then redeploy backend: `./scripts/deploy-aws.sh code`

### 4. App User ID

The app calls `Purchases.logIn(user.id)` so RevenueCat `app_user_id` matches your ChristCalm user ID. Webhooks update `is_premium` in DynamoDB.

## JWT (legacy)

`JWT_SECRET` remains in SSM for legacy token fallback during migration. New clients use Cognito only.