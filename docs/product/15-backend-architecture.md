# Backend architecture (reference: FastAPI + Lambda)

API product contract: [08-api-contract.md](./08-api-contract.md).  
AI behavior: [09-ai-wisdom.md](./09-ai-wisdom.md).

---

## Process model

| Mode | Entrypoint | How |
|------|------------|-----|
| **Lambda** | `handler.handler` | Mangum wraps FastAPI `app` |
| **Local** | `uvicorn server:app` | `./scripts/run-backend-local.sh` |

One codebase for both.

---

## Package layout

```
backend/
├── server.py          # App, middleware, include_router
├── handler.py         # Mangum
├── seed_data.py       # EMOTIONS, MEDITATIONS, PRAYERS, DEVOTIONALS
├── api/
│   ├── models.py
│   ├── deps.py
│   ├── middleware.py
│   └── routes/        # health, auth, catalog, user_content, wisdom, billing, analytics
├── auth/cognito.py
├── ai/
│   ├── llm.py
│   ├── wisdom_rag.py
│   ├── wisdom_guardrails.py
│   ├── voice_transcribe.py
│   └── corpus/
├── core/
│   ├── config.py
│   └── rate_limit.py
└── data/dynamodb.py
```

Lambda zip (via CodeBuild) includes: `server.py`, `handler.py`, `seed_data.py`, packages `api/`, `auth/`, `ai/` (with corpus), `core/`, `data/`, and `requirements-lambda.txt` install.

---

## Config bootstrap

Order of precedence (typical):

1. Process env (Lambda environment: `SSM_PREFIX`, table prefix, region, voice bucket)  
2. SSM SecureString parameters under `SSM_PREFIX` (JWT, webhook auth, model ids, etc.)  
3. Local `.env` **non-secret flags only** when developing  

`core/config.py` loads SSM at startup when prefix is set.  
**Never** bake secrets into the deployment zip.

### Important env / SSM keys

| Key | Role |
|-----|------|
| `SSM_PREFIX` | e.g. `/christcalm-dev` |
| `DYNAMODB_TABLE_PREFIX` | Table name prefix |
| `AWS_REGION` | DynamoDB, Bedrock, S3 |
| `JWT_SECRET` | Legacy/local JWT if used |
| `LLM_PROVIDER` | `bedrock` |
| `BEDROCK_MODEL_ID` | Primary model |
| `BEDROCK_MAX_TOKENS` | Default ~900 |
| `BEDROCK_TEMPERATURE` | Default ~0.6 |
| `AI_MONTHLY_LIMIT` | Default 100 |
| `REVENUECAT_WEBHOOK_AUTHORIZATION` | Bearer secret |
| `REVENUECAT_ENTITLEMENT_ID` | `christcalm_premium` |
| `CORS_ORIGINS` | Comma-separated |
| `MEDIA_BASE_URL` | S3/CDN for audio/covers |

---

## Routing map (`api/routes/*` via `server.py`)

Prefix: `/api`

### Health
- `GET /`, `GET /health`

### Auth
- `GET /auth/config`
- `GET /auth/me`
- `POST /auth/onboarding`
- Cognito Bearer validated in `get_current_user` (email + Apple tokens)

### Catalog
- `GET /emotions`
- `GET /meditations`, `GET /meditations/{id}`
- `POST /meditations/rate`, `POST /meditations/complete`
- `GET /meditations/ratings`
- `GET /prayers`
- `GET /devotional/today`

### User content
- `POST /mood/log`, `GET /mood/history`
- `POST /journal`, `GET /journal`
- `POST /feedback`, `GET /feedback`

### Wisdom / AI
- `GET /wisdom/status`
- `GET /wisdom/quota`
- `POST /wisdom/chat`
- `POST /wisdom/chat/stream` (SSE)
- `GET /wisdom/history`
- `POST /wisdom/voice/presign`
- `POST /wisdom/voice/transcribe`

### Subscriptions
- `POST /subscription/sync`
- `GET /subscription/status`
- `POST /revenuecat/webhook`

### Analytics
- `POST /analytics/events`
- `GET /analytics/me`
- `GET /analytics/summary`

---

## Auth internals

### Cognito mode (production path)

1. Client obtains Cognito **access token**.  
2. `get_current_user` calls Cognito (or verifies JWT) via `auth/cognito.py`.  
3. Extract `sub`, email, name.  
4. Find DynamoDB user by id/email; **create** if missing.  
5. Attach user dict to request.  

### Legacy email JWT (dev fallback)

When Cognito disabled: signup stores password hash; signin returns HS256 JWT (`JWT_SECRET`).  
Not the primary production path when Cognito is on.

### Premium resolution

`resolve_premium_user` merges Dynamo flags with any sync/webhook updates for response DTOs.

---

## Data layer (`data/dynamodb.py`)

Responsibilities:

- Table name resolution from prefix  
- User get/put/update (stats, onboarding, quota, premium)  
- Journal list/create  
- Mood logs  
- AI prayer / wisdom turns  
- Payment transactions  
- Rate-limit counters  
- Analytics ingest + rollups  

Use boto3 resource/client. On-demand capacity.

---

## AI pipeline modules

### Guardrails (`wisdom_guardrails.py`)

- Deny regex set (code, homework, jailbreak, …)  
- Allow regex set (emotion/faith language)  
- Returns `(allowed, reason)`  
- Fixed `GUARDRAIL_REPLY` string for denials  

### RAG (`wisdom_rag.py`)

- Load `corpus/*.md` from package  
- Chunk + simple retrieve (keyword/score or embeddings if added)  
- Return top passages for prompt  

### LLM (`llm.py`)

- Bedrock **Converse** API  
- Ordered fallback chain cheaper → stronger  
- No Claude if account policy blocks / product choice  
- Client-safe errors only  

### Voice (`voice_transcribe.py`)

- Presign PUT to voice bucket  
- Start/wait Transcribe job  
- Return transcript text  

---

## Rate limiting

| Key pattern | Limit (reference) |
|-------------|-------------------|
| Auth signup/signin per IP | 30 / 15 min |
| Wisdom per user | ~12 / hour |
| Wisdom per IP | looser secondary |
| Monthly AI turns | `AI_MONTHLY_LIMIT` on user record |
| API Gateway | Stage throttle (Terraform vars) |

Prefer DynamoDB `rate-limits` table so limits work across concurrent Lambdas.

---

## Seed content

`seed_data.py` builds:

- `EMOTIONS`  
- `MEDITATIONS` from emotion→track map (exclusive)  
- `PRAYERS`, `PRAYER_CATEGORIES`  
- `DEVOTIONALS`  

`MEDIA_BASE_URL` rewrites `audio_url` and `cover` to S3/CDN.  
All sessions may ship with `premium: false` in preview unlock mode.

---

## Middleware

1. **CORS**  
2. **Response timing** → `X-Response-Time-Ms`  
3. **Catalog cache** — Cache-Control on public catalog paths  

---

## Dependencies

| Set | File | Use |
|-----|------|-----|
| Local/dev | `requirements.txt` | uvicorn, test tools, full boto3 |
| Lambda | `requirements-lambda.txt` | Slim: FastAPI, Mangum, boto3, pyjwt, … |

---

## Testing hooks

- Pure unit: guardrails, rate limit math, LLM validation (mocked)  
- Integration: need `API_URL` + credentials for Cognito paths  
- Performance: assert catalog latency headers  

See [18-testing-ops-and-scalability.md](./18-testing-ops-and-scalability.md).

---

## Rebuild notes

Port modules 1:1:

| Python module | Generic service |
|---------------|-----------------|
| `server.py` routes | HTTP controllers |
| `auth/cognito.py` | Auth middleware |
| `data/dynamodb.py` | Repository layer |
| `ai/*` | Wisdom service |
| `seed_data.py` | Content provider |
| `core/config.py` | Config + secret manager |
| `handler.py` | Serverless adapter (optional) |
