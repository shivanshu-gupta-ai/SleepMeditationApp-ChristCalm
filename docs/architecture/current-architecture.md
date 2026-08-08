# Current architecture

ChristCalm is a **serverless** Christian meditation & wisdom app.

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
│  · auth/  · ai/          │     │  content, billing,  │
│  · core/  · data/        │     │  limits, analytics  │
│                          │     └─────────────────────┘
└────────────┬─────────────┘
             │
     ┌───────┴────────┐
     ▼                ▼
 Bedrock LLM     S3 + Transcribe
 (Wisdom RAG)    (voice notes)
```

## Repository layout (organized domains)

```
ChristCalmApp/
├── frontend/                 # Mobile/web client (Expo)
│   ├── app/                  # Expo Router screens (routes only)
│   │   ├── (auth)/           # Sign-in, sign-up, password flows
│   │   ├── (tabs)/           # Home · Meditate · Wisdom · Journey · Me
│   │   └── …                 # onboarding, paywall, sos, oauth
│   ├── src/
│   │   ├── features/         # Domain modules
│   │   │   ├── auth/         # AuthContext, Cognito, Apple button
│   │   │   ├── subscriptions/# RevenueCat + premium hooks
│   │   │   ├── onboarding/   # 27-step flow + Grace mascot
│   │   │   └── stats/        # Journey tab
│   │   ├── components/ui/    # Shared design-system primitives
│   │   ├── context/          # Theme, Viewport, Connectivity
│   │   ├── api/              # HTTP client
│   │   ├── theme/            # Nest/Cooper tokens
│   │   └── utils/
│   └── assets/               # Bundled images / mascot / covers
│
├── backend/                  # FastAPI on AWS Lambda
│   ├── server.py             # App + router includes
│   ├── api/routes/           # HTTP surface modules
│   ├── handler.py            # Mangum entrypoint
│   ├── seed_data.py          # Catalog seed
│   ├── auth/ · ai/ · core/ · data/
│
├── infrastructure/terraform/
├── config/
├── assets/meditations/
├── docs/
│   ├── product/              # Canonical product pack (01–18)
│   ├── architecture/ · engineering/ · screenshots/
├── skills/
├── tests/
├── scripts/
└── pytest.ini
```

## Domain map

| Concern | Location |
|---------|----------|
| Product truth (any stack) | `docs/product/` (01–18) |
| Auth (client) | `frontend/src/features/auth/` + routes `frontend/app/(auth)/` |
| Auth (server) | `backend/auth/` + routes `/api/auth/*` |
| Auth config | `config/auth/`, Cognito in `infrastructure/terraform/cognito*.tf` |
| AI / Wisdom (client) | `(tabs)/wisdom.tsx` + `src/api/client.ts` (stream + voice) |
| AI / Wisdom (server) | `backend/ai/` + `api/routes/wisdom.py` + corpus |
| Journey / stats | `frontend/src/features/stats/` + `(tabs)/stats.tsx` |
| Subscriptions | `frontend/src/features/subscriptions/` + `api/routes/billing.py` |
| Meditation catalog | `backend/seed_data.py` → API `/emotions`, `/meditations` |
| Content media | `assets/meditations/` (source) → S3 audio + `frontend/assets/` covers |
| Secrets | **SSM only** (`/christcalm-dev/*`); local `.env` is disposable public config |
| Agent skills | `skills/` |
| Tests | `tests/backend/` |

## Runtime stack

| Layer | Choice |
|-------|--------|
| Client | Expo Router, React Native, TypeScript |
| API | FastAPI + Mangum on Lambda |
| Data | DynamoDB (on-demand) |
| Auth | AWS Cognito (email/password + optional Sign in with Apple) |
| AI | Amazon Bedrock Converse, multi-model fallback chain |
| Voice | S3 upload + Amazon Transcribe |
| Payments | RevenueCat (client) + webhook → DynamoDB premium flags |
| Infra as code | Terraform |
| CI package | CodeBuild (`config/ci/buildspec.yml`) |

## Data stores (DynamoDB)

| Table suffix | Purpose |
|--------------|---------|
| `users` | Accounts, premium, AI monthly quota |
| `mood-logs` | Emotion logs |
| `journal-entries` | Journal |
| `meditation-ratings` | Per-session 1–5 star ratings |
| `user-feedback` | Private product feedback from Me |
| `ai-prayers` | Wisdom turns / prayer history |
| `payment-transactions` | RevenueCat-related |
| `rate-limits` | Distributed burst limits |
| `usage-events` | Product analytics (TTL ~90d) |
| `usage-daily` | Daily rollups |

## Auth flow (summary)

1. App uses Cognito for email + password and **Sign in with Apple** (Hosted UI).
2. Access token sent as `Authorization: Bearer …`.
3. `backend/auth/cognito.py` validates JWT and upserts `users` row.
4. Onboarding draft syncs via `POST /api/auth/onboarding` after session.

## AI / Wisdom flow (summary)

1. Client prefers `POST /api/wisdom/chat/stream` (SSE); falls back to `/wisdom/chat`.
2. Voice: presign → S3 PUT → `/wisdom/voice/transcribe` → chat.
3. Guardrails (`ai/wisdom_guardrails.py`) scope emotional/spiritual topics.
4. RAG loads `ai/corpus/*.md`, retrieves chunks, calls Bedrock Converse.
5. Turn stored in `ai-prayers`; monthly free quota enforced on user record.

## Related docs

- [Deploy plan](deploy-plan.md)
- [Scalability](scalability.md)
- [Analytics](analytics.md)
- [Security / performance review](review.md)
- [Overview (short)](overview.md)
