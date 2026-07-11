# ChristCalm — API & configuration requirements

Single source of truth for **env vars**, **external APIs**, and **backend routes**.  
Templates live in this folder; production values live in **SSM** (`/christcalm-preview/*`).

---

## 1. Configuration files (this folder)

| File | Purpose |
|------|---------|
| `backend.env.example` | Server/Lambda env (JWT, AWS, LLM, CORS) |
| `frontend.env.example` | Expo `EXPO_PUBLIC_*` only |
| `integrations.env.example` | RevenueCat + LLM extras |
| `auth/` | Google OAuth, JWT, RevenueCat notes |
| `API_REQUIREMENTS.md` | This document |

Setup:

```bash
./scripts/setup-config.sh
# then edit backend/.env and frontend/.env
```

---

## 2. Environment variables

### Backend / Lambda

| Variable | Required | Default | Notes |
|----------|----------|---------|--------|
| `JWT_SECRET` | **Yes** | — | HS256 signing; SecureString in SSM |
| `AWS_REGION` | Yes (AWS) | `us-east-1` | DynamoDB + Bedrock |
| `DYNAMODB_TABLE_PREFIX` | Yes | `christcalm` | Table names |
| `SSM_PREFIX` | Lambda | `/christcalm-preview` | Loads secrets |
| `CORS_ORIGINS` | Recommended | — | Comma-separated |
| `GOOGLE_CLIENT_ID` | For Google auth | — | |
| `GOOGLE_CLIENT_SECRET` | For Google auth | — | |
| `GOOGLE_REDIRECT_URI` | For Google auth | — | `…/api/auth/google/callback` |
| `LLM_PROVIDER` | No | **`bedrock`** | Bedrock only for wisdom |
| `BEDROCK_MODEL_ID` | No | **`openai.gpt-oss-20b-1:0`** | Or Mistral IDs; **not Claude** |
| `BEDROCK_MAX_TOKENS` | No | `900` | Converse max tokens |
| `BEDROCK_TEMPERATURE` | No | `0.6` | |
| `REVENUECAT_WEBHOOK_AUTHORIZATION` | Prod | — | Bearer for webhooks |
| `REVENUECAT_ENTITLEMENT_ID` | No | `christcalm_premium` | |

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
- Corpus: repo `wisdom/*.md` packaged into Lambda.
- SSM: `/christcalm-preview/BEDROCK_MODEL_ID`, `LLM_PROVIDER=bedrock`

### Google OAuth

- Web client ID/secret; redirect = API callback URL.
- Allowed mobile redirect prefixes: `exp://`, `com.christcalm.app://`, localhost.

### RevenueCat

- App Store / Play products + entitlement `christcalm_premium`.
- Webhook → `POST /api/revenuecat/webhook` with Authorization header.

### DynamoDB tables

- `{prefix}-users` (+ GSI `email-index`)
- `{prefix}-mood-logs`, `journal-entries`, `ai-prayers`, `payment-transactions`

---

## 4. HTTP API surface

Base: `{EXPO_PUBLIC_BACKEND_URL}/api`

| Method | Path | Auth | Rate limit (app) |
|--------|------|------|------------------|
| GET | `/` or `/health` | No | — |
| POST | `/auth/signup` | No | 30 / 15 min / IP |
| POST | `/auth/signin` | No | 30 / 15 min / IP |
| GET | `/auth/me` | Bearer | — |
| POST | `/auth/onboarding` | Bearer | — |
| GET | `/auth/google/start` | No | — |
| GET | `/auth/google/callback` | No | — |
| GET | `/emotions` | No | — |
| GET | `/meditations` | No | — |
| GET | `/meditations/{id}` | No | — |
| POST | `/meditations/complete` | Bearer | — |
| GET | `/prayers` | No | — |
| GET | `/devotional/today` | No | — |
| POST | `/mood/log` | Bearer | — |
| GET | `/mood/history` | Bearer | — |
| POST | `/journal` | Bearer | — |
| GET | `/journal` | Bearer | — |
| GET | `/wisdom/status` | No | Corpus + model diagnostic |
| POST | `/wisdom/chat` | Bearer | **12 / hour / user** (+ IP) — conversational RAG |
| GET | `/wisdom/history` | Bearer | Past turns |
| POST | `/ai/prayer` | Bearer | **Legacy alias** → wisdom |
| GET | `/ai/prayers/history` | Bearer | Legacy |
| POST | `/subscription/sync` | Bearer | — |
| GET | `/subscription/status` | Bearer | — |
| POST | `/revenuecat/webhook` | Webhook secret | — |

API Gateway stage throttle: **100 rps**, burst **50** (Terraform).

Response header: `X-Response-Time-Ms` on all requests.

---

## 5. Security notes

- Never commit real secrets; only `*.example` templates.
- JWT: 30-day HS256; store in SecureStore on device.
- Passwords: PBKDF2-HMAC-SHA256 (100k iterations).
- AI errors do **not** return stack traces to clients.
- Webhook auth is shared-secret Bearer (rotate if leaked).

---

## 6. Performance expectations

| Path class | Typical (p50) | Notes |
|------------|---------------|--------|
| Static content (emotions, meds) | &lt; 200 ms | Seeded in-memory |
| Auth + DynamoDB | 100–400 ms | Cold start + DDB |
| AI prayer (Bedrock) | 1–8 s | Model latency; 30s Lambda timeout |
| Lambda cold start | 1–3 s | First invoke after idle |

Measure with `X-Response-Time-Ms` or `tests/backend/test_performance.py`.
