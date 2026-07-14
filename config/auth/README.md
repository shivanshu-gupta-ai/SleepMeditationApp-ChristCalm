# Auth & subscription keys

**Secrets live in SSM** (via `infrastructure/terraform/terraform.tfvars` → apply).  
Do not put secrets in local `.env` files. See [`../README.md`](../README.md).

ChristCalm uses **AWS Cognito** for email/password + optional **Sign in with Apple**.

## Email / password

Handled in the app via Cognito SDK. Backend validates Cognito **access tokens** on protected routes.

- **Preview/staging:** `cognito_auto_confirm_users = true` in `terraform.tfvars`
- **Production:** `cognito_auto_confirm_users = false` (email verification in-app)

Password policy: 8+ chars, upper, lower, number.

Seed / reset preview test user:

```bash
./scripts/seed-test-user.sh
# test@christcalm.dev / Test1234
```

## Sign in with Apple (Cognito federated)

1. Apple Developer → Services ID + Sign in with Apple key (`.p8`).
2. Return URL (Cognito IdP callback):
   ```
   https://christcalm-preview.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
   ```
3. In `terraform.tfvars`:
   ```hcl
   apple_services_id  = "com.christcalm.app.signin"
   apple_team_id      = "YOUR_TEAM_ID"
   apple_key_id       = "YOUR_KEY_ID"
   apple_private_key  = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```
4. `./scripts/deploy-aws.sh apply && ./scripts/sync-env-from-aws.sh`

App uses Cognito Hosted UI with `identity_provider=SignInWithApple` (PKCE).

## Local preview

```bash
./scripts/sync-env-from-aws.sh
./scripts/preview.sh
```

## RevenueCat

Public SDK keys → optional `EXPO_PUBLIC_REVENUECAT_*` (client-safe).  
Webhook secret → `terraform.tfvars` → SSM only.

See `revenuecat.example.json`.
