# ChristCalm — API & configuration requirements

**Product API contract (stack-agnostic):** [`../docs/product/08-api-contract.md`](../docs/product/08-api-contract.md)

This file documents **env vars**, **external APIs**, and routes for the **current AWS reference backend**.  
Templates live in this folder; production values live in **SSM** (`/christcalm-dev/*`).

---

## 1. Configuration files (this folder)

| File | Purpose |
|------|---------|
| `env/backend.env.example` | Non-secret local flags only (`SSM_PREFIX`, region) |
| `env/frontend.env.example` | Public Expo `EXPO_PUBLIC_*` only |
| `env/integrations.env.example` | Docs: secrets go in `terraform.tfvars` → SSM |
| `auth/` | Cognito / Apple / RevenueCat notes |
| `API_REQUIREMENTS.md` | This document |

**Secrets never live in local `.env`.** They are stored in SSM and loaded at runtime.

```bash
./scripts/sync-env-from-aws.sh    # regenerate disposable local env (no secrets)
./scripts/run-backend-local.sh    # local API with secrets from SSM
./scripts/preview.sh              # Expo UI → deployed Lambda
```

---

## 2. Environment variables

### Backend / Lambda

| Variable | Required | Default | Notes |
|----------|----------|---------|--------|
| `AWS_REGION` | Yes (AWS) | `us-east-1` | DynamoDB + Bedrock |
| `DYNAMODB_TABLE_PREFIX` | Yes | `christcalm` | Table names |
| `SSM_PREFIX` | **Yes (Lambda + local)** | `/christcalm-dev` | Loads **all secrets** from SSM |
| `CORS_ORIGINS` | Recommended | — | Comma-separated |
| `LLM_PROVIDER` | No | **`bedrock`** | Bedrock only for wisdom |
| `BEDROCK_MODEL_ID` | No | **`openai.gpt-oss-20b-1:0`** | Or Mistral IDs; **not Claude** |
| `BEDROCK_MAX_TOKENS` | No | `900` | Converse max tokens |
| `BEDROCK_TEMPERATURE` | No | `0.6` | |
| `REVENUECAT_WEBHOOK_AUTHORIZATION` | Prod | — | Bearer for webhooks |
| `REVENUECAT_ENTITLEMENT_ID` | No | `christcalm_premium` | |
| `AI_MONTHLY_LIMIT` | No | `100` | Free Wisdom text/voice turns per calendar month |
| `VOICE_BUCKET` | Voice | — | Temporary Wisdom audio uploads |

### Frontend (public)

| Variable | Required | Notes |
|----------|----------|--------|
| `EXPO_PUBLIC_BACKEND_URL` | **Yes** | API Gateway base URL (no trailing slash preferred) |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | iOS IAP | Public SDK key |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | Android IAP | Public SDK key |

---

## 3. External API / AWS requirements

### AWS Bedrock (Wisdom chat — **required**)

- Model default: **`openai.gpt-oss-20b-1:0`** (GPT-OSS 20B). Alternatives: Mistral instruct models.
- **Do not** use Claude for generation.
- Lambda role: `bedrock:InvokeModel` + Converse (Terraform `lambda_bedrock`).
- Corpus: `backend/ai/corpus/*.md` packaged into Lambda.
- SSM: `/christcalm-dev/BEDROCK_MODEL_ID`, `LLM_PROVIDER=bedrock`

### Amazon Cognito

- Email/password authentication runs directly against the Cognito public app client.
- Sign in with Apple uses Cognito Hosted UI when `enable_apple_sign_in` is configured.
- The API accepts Cognito **access tokens** and validates them with Cognito `GetUser`.
- Google Sign-In and API-owned password/JWT endpoints are not implemented.

### RevenueCat

- App Store / Play products + entitlement `christcalm_premium`.
- Webhook → `POST /api/revenuecat/webhook` with Authorization header.

### DynamoDB tables

- `{prefix}-users` (+ GSI `email-index`)
- `{prefix}-mood-logs`, `journal-entries`, `meditation-ratings`, `user-feedback`
- `{prefix}-ai-prayers`, `payment-transactions`, `rate-limits`
- `{prefix}-usage-events`, `usage-daily`

---

## 4. HTTP API surface

Base: `{EXPO_PUBLIC_BACKEND_URL}/api`

| Method | Path | Auth | Rate limit (app) |
|--------|------|------|------------------|
| GET | `/` or `/health` | No | — |
| GET | `/auth/config` | No | Public Cognito/Apple readiness |
| GET | `/auth/me` | Bearer | — |
| POST | `/auth/onboarding` | Bearer | — |
| GET | `/emotions` | No | — |
| GET | `/meditations` | No | — |
| GET | `/meditations/{id}` | No | — |
| POST | `/meditations/complete` | Bearer | — |
| POST | `/meditations/rate` | Bearer | — |
| GET | `/meditations/ratings` | Bearer | — |
| GET | `/prayers` | No | — |
| GET | `/devotional/today` | No | — |
| POST | `/mood/log` | Bearer | — |
| GET | `/mood/history` | Bearer | — |
| POST | `/journal` | Bearer | — |
| GET | `/journal` | Bearer | — |
| POST | `/feedback` | Bearer | **~12 / hour / user** |
| GET | `/feedback` | Bearer | — |
| GET | `/wisdom/status` | No | Corpus + model diagnostic |
| GET | `/wisdom/quota` | Bearer | Monthly text + voice allowance |
| POST | `/wisdom/chat` | Bearer | **12 / hour / user** (+ IP) — conversational RAG |
| POST | `/wisdom/chat/stream` | Bearer | SSE primary client path |
| GET | `/wisdom/history` | Bearer | Past turns |
| POST | `/wisdom/voice/presign` | Bearer | Presigned S3 upload |
| POST | `/wisdom/voice/transcribe` | Bearer | Transcribe; counts toward quota |
| POST | `/subscription/sync` | Bearer | — |
| GET | `/subscription/status` | Bearer | — |
| POST | `/revenuecat/webhook` | Webhook secret | — |
| POST | `/analytics/events` | Optional | Batched scalar-only events |
| GET | `/analytics/me` | Bearer | User event summary |
| GET | `/analytics/summary` | Bearer | Aggregate window |

API Gateway stage throttle: **100 rps**, burst **50** (Terraform).

Response header: `X-Response-Time-Ms` on all requests.

---

## 5. Security notes

- Never commit real secrets; only `*.example` templates.
- Store Cognito tokens in platform secure storage; never persist passwords.
- Authentication and password policy are owned by Cognito, not the FastAPI service.
- AI errors do **not** return stack traces to clients.
- Webhook auth is shared-secret Bearer (rotate if leaked).

---

## 6. Performance expectations

| Path class | Typical (p50) | Notes |
|------------|---------------|--------|
| Static content (emotions, meds) | &lt; 200 ms | Seeded in-memory |
| Auth + DynamoDB | 100–400 ms | Cold start + DDB |
| Wisdom (Bedrock) | 1–8 s | Model latency; streaming starts earlier when supported |
| Lambda cold start | 1–3 s | First invoke after idle |

Measure with `X-Response-Time-Ms` or `tests/backend/test_performance.py`.
