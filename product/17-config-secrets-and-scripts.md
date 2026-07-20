# Config, secrets & scripts

## Golden rule

**Secrets live only in AWS SSM Parameter Store.**  
Local `.env` files are disposable and must **not** hold secrets.

```
terraform.tfvars  ──apply──►  SSM  ──►  Lambda (always)
                              │
                              └──►  Local API (SSM_PREFIX + AWS creds)

sync-env-from-aws.sh  ──►  frontend/.env  (public Expo only)
                      ──►  backend/.env   (SSM_PREFIX + region + table prefix)
```

---

## Config folder layout

```
config/
├── env/
│   ├── backend.env.example      # non-secret flags only
│   ├── frontend.env.example     # public EXPO_PUBLIC_* only
│   └── integrations.env.example # docs: secrets go tfvars → SSM
├── auth/
│   ├── README.md                # Cognito / Apple / Google setup
│   ├── env.example
│   └── revenuecat.example.json
├── ci/
│   └── buildspec.yml            # CodeBuild Lambda packaging
├── API_REQUIREMENTS.md          # Env + routes for this stack
└── README.md
```

---

## Frontend public config

Template: `config/env/frontend.env.example`

```bash
EXPO_PUBLIC_BACKEND_URL=https://YOUR_API_GATEWAY_URL
EXPO_PUBLIC_COGNITO_USER_POOL_ID=
EXPO_PUBLIC_COGNITO_CLIENT_ID=
EXPO_PUBLIC_COGNITO_DOMAIN=christcalm-dev.auth.us-east-1.amazoncognito.com
EXPO_PUBLIC_COGNITO_REGION=us-east-1

# Optional public RevenueCat SDK keys
# EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
# EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=

# Preview unlock (never force on in production store builds)
EXPO_PUBLIC_UNLOCK_ALL=1
```

Auto-generate:

```bash
./scripts/sync-env-from-aws.sh
```

Safe to delete `frontend/.env` anytime and re-sync.

---

## Backend local flags

Template: `config/env/backend.env.example`

Only things like:

- `SSM_PREFIX=/christcalm-dev`  
- `AWS_REGION=us-east-1`  
- `DYNAMODB_TABLE_PREFIX=christcalm-dev`  

Secrets (JWT, Apple key, webhook auth, …) load **from SSM at process start**.

---

## SSM parameter map (typical)

Path: `/christcalm-dev/`

| Parameter | Purpose |
|-----------|---------|
| `JWT_SECRET` | Legacy/local JWT signing |
| `REVENUECAT_WEBHOOK_AUTHORIZATION` | Webhook Bearer |
| `BEDROCK_MODEL_ID` / `LLM_PROVIDER` | AI routing |
| Apple private key / Team / Key IDs | Cognito IdP (server-side) |
| Google client secret | If Google federation |
| Other integration secrets | As added in `ssm.tf` |

Lambda env only needs: `SSM_PREFIX`, table prefix, region, voice bucket name — then reads the rest.

---

## Scripts encyclopedia

| Script | When to use | Side effects |
|--------|-------------|--------------|
| `bootstrap-new-account.sh` | Brand-new AWS account | Writes tfvars, apply, code, sync, seed user |
| `deploy-aws.sh apply` | Infra change | Terraform apply |
| `deploy-aws.sh code` | Backend code change | CodeBuild + Lambda update |
| `deploy-aws.sh deploy` | Both | apply + code |
| `sync-env-from-aws.sh` | Missing/stale local env | Overwrites disposable `.env` |
| `preview.sh` | Run UI | sync (if AWS) + npm install + expo start |
| `run-backend-local.sh` | Local API | uvicorn; secrets from SSM |
| `setup-config.sh` | First clone | sync or empty placeholders |
| `seed-test-user.sh` | QA login | Creates Cognito/test user |
| `seed-apple-ssm-once.sh` | Apple keys into SSM | Writes SecureString params |
| `check-bedrock-models.sh` | Validate model access | Read-only probes |
| `sync-meditation-covers.sh` | After new cover art | Copies to `frontend/assets/…` |
| `build-lambda.sh` | Alias | Calls `deploy-aws.sh code` |
| `lib/aws-auth.sh` | Shared | Detects AWS profile/SSO |

---

## Auth configuration notes

Source: `config/auth/README.md`

### Email

- Cognito `USER_PASSWORD_AUTH`  
- App: `frontend/src/features/auth/cognito.ts`  
- Seed: `./scripts/seed-test-user.sh`  

### Apple

1. Apple Developer: Services ID, key, return URL exact match Cognito  
2. Terraform `enable_apple_sign_in = true`  
3. Secrets in SSM (not app)  
4. App uses Hosted UI / `signInWithProvider("SignInWithApple")`  

**Sign up and sign in with Apple are the same button** — Cognito creates or links user.

### Google

- Web client id/secret; redirect = Cognito / API callback as configured  
- Allowed mobile redirect prefixes: `exp://`, `com.christcalm.app://`, localhost  

### RevenueCat

- Entitlement: `christcalm_premium`  
- Products: `christcalm_monthly`, `christcalm_annual`  
- Public SDK keys in Expo env  
- Webhook → `POST /api/revenuecat/webhook` with Authorization header  
- Example JSON shape: `config/auth/revenuecat.example.json`  

---

## Media config

| Item | Location |
|------|----------|
| Source covers | `assets/meditations/covers/<track>.jpg` |
| Source audio | `assets/meditations/audio/<track>.*` |
| Bundled covers | `frontend/assets/meditations/covers/` via sync script |
| Runtime URLs | `MEDIA_BASE_URL` in seed_data / env  
| Default media host (example) | `https://christcalm-preview-media-<account>.s3…` |

---

## CI files

| Path | Role |
|------|------|
| `config/ci/buildspec.yml` | CodeBuild Lambda package |
| `.github/workflows/*` | Optional GitHub Actions |
| `pytest.ini` | Pytest config |

---

## Security hygiene checklist

- [ ] Never commit `terraform.tfvars` or real `.env` with secrets  
- [ ] `EXPO_PUBLIC_*` contains only public values  
- [ ] Rotate webhook secret if leaked  
- [ ] Apple private key only in SSM / Secrets Manager  
- [ ] Prod CORS locked  
- [ ] Delete local `.env` freely; re-run sync  

---

## Operator cheat sheet

```bash
# Who am I?
aws sts get-caller-identity

# Full new account
./scripts/bootstrap-new-account.sh

# Ship API code
./scripts/deploy-aws.sh code

# Run app UI
./scripts/preview.sh
# Web: http://localhost:8081

# Local API + remote data plane
./scripts/run-backend-local.sh

# Tests
pytest tests/backend/test_wisdom_guardrails.py -v
```
