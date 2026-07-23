# System architecture

## Logical architecture (stack-agnostic)

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile / Web Client                      │
│  Screens · Theme · Secure session · Audio player · IAP SDK   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS JSON
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend API                           │
│  Auth · Catalog · Journal · Mood · Wisdom · Subscriptions    │
│  Analytics · Rate limits                                     │
└───────┬──────────────┬──────────────┬──────────────┬────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
   User store     Content seed    LLM + RAG     Object store
   (profiles,     (emotions,      (Wisdom)      (voice audio)
    journal,       meditations)
    quotas)
```

### Core principles

1. **Client is a thin experience layer** — catalog + personal data via API.  
2. **Catalog can be static** — low latency, no DB required for meditations.  
3. **Secrets never in the client** — only public config (`BACKEND_URL`, Cognito pool ids, RevenueCat *public* keys).  
4. **Wisdom is isolated** — guardrails → RAG → LLM → quota → store turn.  
5. **Premium is entitlement-driven** — store/RevenueCat is source of truth; API mirrors flags.

---

## Reference runtime architecture (AWS + Expo)

```
┌──────────────────────────┐
│  Expo (React Native)     │
│  frontend/               │
│  · app/  (Expo Router)   │
│  · src/features/*        │
└────────────┬─────────────┘
             │ HTTPS
             ▼
┌──────────────────────────┐
│  API Gateway HTTP API    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐     ┌─────────────────────┐
│  Lambda + FastAPI        │────►│  DynamoDB           │
│  backend/                │     │  users, journal,    │
│  · auth/  · ai/          │     │  ai-prayers, usage  │
│  · core/  · data/        │     │  rate-limits, …     │
└────────────┬─────────────┘     └─────────────────────┘
             │
     ┌───────┴────────┬──────────────┐
     ▼                ▼              ▼
 Bedrock LLM     Cognito IdP    S3 + Transcribe
 (Wisdom RAG)    (email/Apple/  (voice notes)
                  Google)
     │
     ▼
 SSM Parameter Store (secrets at cold start)
```

### Runtime stack table

| Layer | Choice (reference) | Replaceable with |
|-------|--------------------|------------------|
| Client | Expo 54, RN, TS, Expo Router | SwiftUI, Compose, Flutter, RN bare |
| API | FastAPI + Mangum on Lambda | Any HTTP server |
| Edge | API Gateway HTTP API | ALB, Cloudflare Workers, nginx |
| Data | DynamoDB on-demand | Postgres, Mongo, Firestore |
| Auth | Amazon Cognito | Auth0, Clerk, Firebase, custom JWT |
| AI | Amazon Bedrock Converse | OpenAI, Anthropic, Gemini, local |
| Voice | S3 + Amazon Transcribe | Whisper API, on-device STT |
| Payments | RevenueCat | StoreKit 2 + Play Billing direct |
| Media | S3 public/CF URLs | Any CDN |
| IaC | Terraform | CDK, Pulumi, Console |
| CI package | CodeBuild + buildspec | GitHub Actions, local zip |

---

## Request flows

### A. Authenticated API call

```
App SecureStore token
  → Authorization: Bearer <access_token>
  → API Gateway → Lambda
  → auth/cognito: validate token (Cognito GetUser / JWT)
  → upsert/load users row in DynamoDB
  → route handler
  → JSON response + X-Response-Time-Ms
```

### B. Catalog (public)

```
GET /api/emotions | /meditations | /prayers | /devotional/today
  → seed_data in-memory (no DynamoDB read)
  → Cache-Control middleware (server)
  → Client api-cache ~5 min (optional)
```

### C. Meditation complete

```
Player finish
  → POST /api/meditations/complete { meditation_id, duration_sec? }
  → Update user: practices_completed++, minutes, streak
  → Client may show soft paywall if first practice
```

### D. Wisdom chat

```
POST /api/wisdom/chat { message }
  → Auth + hourly rate limit + monthly quota
  → wisdom_guardrails.is_emotional_concern
  → if deny: fixed reply, no Bedrock
  → wisdom_rag retrieve chunks from corpus/*.md
  → llm.converse with fallback model chain
  → store turn in ai-prayers table
  → return { reply, allowed, quota }
```

### E. Voice → Wisdom

```
POST /api/wisdom/voice/presign → { upload_url, key }
  → Client PUT audio to S3
POST /api/wisdom/voice/transcribe { key }
  → Amazon Transcribe → text
  → same path as chat (or return text for client to send)
```

### F. Subscription

```
Store purchase → RevenueCat SDK entitlement
  → POST /api/subscription/sync
  and/or RevenueCat webhook → POST /api/revenuecat/webhook
  → users.is_premium = true, plan, expires_at
```

### G. Analytics

```
Client track(event) → local buffer
  → POST /api/analytics/events (batch)
  → usage-events (TTL ~90d) + usage-daily rollups
```

### H. Auth (Cognito + Apple)

```
Expo app
  1. Email: Cognito USER_PASSWORD_AUTH
     OR Apple: Cognito Hosted UI OAuth code + PKCE
  2. Receive access + id + refresh tokens
  3. API calls with access token
  4. Backend finds/creates DynamoDB user by Cognito sub + email
```

Email + password and Apple both end as **Cognito access tokens** the API trusts.  
Apple first time creates federated Cognito user; later signs same user in.

---

## Data stores (DynamoDB tables)

Prefix: `{DYNAMODB_TABLE_PREFIX}` e.g. `christcalm-dev`

| Table suffix | Purpose | Key design (typical) |
|--------------|---------|----------------------|
| `users` | Accounts, premium, AI quota, stats | `id` PK; GSI `email-index` |
| `mood-logs` | Emotion logs | user_id + timestamp |
| `journal-entries` | Journal | user_id + id/timestamp |
| `meditation-ratings` | Per-session 1–5 star ratings | user_id + created_at#id |
| `user-feedback` | Me-tab product feedback (free-text) | user_id + created_at#id |
| `ai-prayers` | Wisdom turns / prayer history | user_id + timestamp |
| `payment-transactions` | RevenueCat-related events | id / user_id |
| `rate-limits` | Distributed burst counters | key + window |
| `usage-events` | Raw analytics (TTL ~90d) | user_id + sk |
| `usage-daily` | Daily rollups | day + metric keys |

---

## Middleware & cross-cutting (API)

| Concern | Behavior |
|---------|----------|
| CORS | Allowlist origins from config |
| Timing | `X-Response-Time-Ms` on responses |
| Catalog cache headers | Public catalog paths get Cache-Control |
| Rate limits | Auth IP limits; AI user+IP limits; API GW stage throttle |
| Errors | No stack traces / provider errors to clients on AI paths |
| Secrets | Loaded from SSM when `SSM_PREFIX` set |

---

## Environments

| Env | API | Client | Notes |
|-----|-----|--------|-------|
| **Local UI** | Usually **remote** preview API | Expo web/iOS/Android | `./scripts/preview.sh` |
| **Local API** | uvicorn + SSM secrets | Point `EXPO_PUBLIC_BACKEND_URL` to `:8000` | `./scripts/run-backend-local.sh` |
| **Dev** | Lambda `christcalm-dev*` | Expo against API GW URL | Cognito auto-confirm may be on |
| **Production** | Same pattern, prod vars | Store builds | Email verification on; webhook secret required |

Primary day-to-day: **preview AWS API + local Expo**.

---

## Scalability posture

Default: **serverless** — no Fargate/Docker required.

| Lever | Default / guidance |
|-------|--------------------|
| DynamoDB | On-demand |
| API Gateway throttle | Configurable (e.g. 100–2000 rps) |
| Lambda | On-demand; optional provisioned concurrency later |
| AI cost | Monthly quota + hourly rate limit |
| Catalog | In-memory seed + HTTP cache |
| Client catalog | 5 min memory cache |

**Cost drivers:** Bedrock (Wisdom) + Transcribe minutes. Idle cost near zero.

**Not required yet:** Redis, multi-region, WAF (add for public marketing), Fargate.

---

## Security architecture

| Control | Implementation |
|---------|----------------|
| Transport | HTTPS only |
| AuthN | Cognito / JWT Bearer |
| Passwords | Strong KDF (PBKDF2 100k+) if local hash path |
| Secrets | SSM SecureString; never in git or `EXPO_PUBLIC_*` private keys |
| AI abuse | Guardrails + rate limits + monthly cap |
| Webhooks | Shared-secret Bearer (required in prod) |
| Journal privacy | Not sent to analytics props |
| CORS | Explicit origins |

### Residual risks to close in prod

- Webhook secret must not be empty  
- Prefer distributed rate limits (Dynamo) over pure in-process  
- JWT lifetime / refresh policy  
- Server-side premium gates if product requires hard locks  

---

## Observability

| Signal | Where |
|--------|-------|
| Latency | `X-Response-Time-Ms`, CloudWatch Lambda duration |
| Errors | Lambda logs, structured logging in server |
| Product usage | `usage-events` / `usage-daily`, `/api/analytics/summary` |
| AI spend | Cost Explorer → Bedrock |
| Model access | `./scripts/check-bedrock-models.sh` |

---

## Component diagram (deployables)

```
[Expo app binary / web]
        │
        ▼
[API Gateway] ──► [Lambda: FastAPI]
                      │
        ┌─────────────┼──────────────┬─────────────┐
        ▼             ▼              ▼             ▼
   [DynamoDB]    [Cognito]      [Bedrock]    [S3 voice]
        ▲             │
        │             ▼
   [SSM secrets]  [Apple/Google IdP]
        ▲
   [Terraform apply]
        ▲
   [CodeBuild] ◄── backend tarball from deploy-aws.sh code
```

---

## Sequence: cold start Wisdom call

```
1. Client POST /wisdom/chat
2. API GW → new Lambda instance (1–3s possible)
3. config loads SSM secrets once per instance
4. Auth validates Cognito token
5. Rate limit + quota checks (Dynamo)
6. Guardrails (CPU, ms)
7. RAG load corpus (from package filesystem)
8. Bedrock Converse (1–8s); on failure try next model
9. Write ai-prayers + increment quota
10. Response to client
```

Warm instances skip steps 2–3 cost.

---

## Architecture decision records (summary)

| Decision | Why |
|----------|-----|
| Serverless API | Idle cost ~0; mobile traffic spiky |
| Catalog in code | Simple, fast, versioned with deploy |
| Cognito | Email + Apple + Google federation |
| Bedrock | IAM auth, multi-model fallback, no long-lived AI keys in app |
| RevenueCat | Cross-platform entitlements |
| SSM-first secrets | No secret `.env` in git or laptops long-term |
| Emotion-exclusive tracks | Clear UX; simpler content ops |
