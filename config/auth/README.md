# Auth & subscription keys

Put **real** values in `backend/.env` (local) or AWS SSM (production). Use the `.example` files here as templates.

## Google Sign-In

1. [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth 2.0 Client ID (Web).
2. Authorized redirect URI:
   ```
   https://YOUR_API_GATEWAY_URL/api/auth/google/callback
   ```
3. Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` into `backend/.env` or `aws/terraform/terraform.tfvars`.

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
- `aws/terraform/terraform.tfvars` → `revenuecat_webhook_authorization`

Then redeploy backend: `./scripts/deploy-aws.sh code`

### 4. App User ID

The app calls `Purchases.logIn(user.id)` so RevenueCat `app_user_id` matches your ChristCalm user ID. Webhooks update `is_premium` in DynamoDB.

## JWT

`JWT_SECRET` — long random string for signing session tokens. Required for email/password and Google auth.