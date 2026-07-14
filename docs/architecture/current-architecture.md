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
│  · auth/  · ai/          │     │  ai-prayers, usage  │
│  · core/  · data/        │     └─────────────────────┘
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
│   │   ├── (tabs)/           # Home, meditate, wisdom, journal, …
│   │   └── …                 # onboarding, paywall, sos, ai-prayer
│   ├── src/
│   │   ├── features/         # Domain modules
│   │   │   ├── auth/         # AuthContext, Cognito, social buttons
│   │   │   ├── ai/           # Wisdom / AI prayer feature surface
│   │   │   ├── subscriptions/# RevenueCat + premium hooks
│   │   │   └── onboarding/   # Onboarding UI + constants
│   │   ├── components/ui/    # Shared design-system primitives
│   │   ├── context/          # Theme, Viewport
│   │   ├── api/              # HTTP client
│   │   ├── theme/            # Nest/Cooper tokens
│   │   └── utils/
│   └── assets/               # Bundled images / mascot / covers
│
├── backend/                  # FastAPI on AWS Lambda
│   ├── server.py             # Routes
│   ├── handler.py            # Mangum entrypoint
│   ├── seed_data.py          # Catalog seed
│   ├── auth/                 # Cognito + Google OAuth helpers
│   ├── ai/                   # LLM, RAG, guardrails, voice
│   │   └── corpus/           # Wisdom handbook + voice guide
│   ├── core/                 # Config bootstrap, rate limits
│   ├── data/                 # DynamoDB access layer
│   │
├── infrastructure/terraform/ # API GW, Lambda, DynamoDB, Cognito, CodeBuild
├── config/                   # Env templates, auth samples, CI buildspec
├── assets/                   # Editable content media + app-design refs
├── docs/                     # Product, design, architecture, engineering
├── skills/                   # Agent skills (ui-ux-pro-max, rules)
├── tests/                    # Pytest + reports/
├── scripts/                  # deploy, preview, env sync
└── pytest.ini
```

## Domain map

| Concern | Location |
|---------|----------|
| Auth (client) | `frontend/src/features/auth/` + routes `frontend/app/(auth)/` |
| Auth (server) | `backend/auth/` + routes `/api/auth/*` |
| Auth config | `config/auth/`, Cognito in `infrastructure/terraform/cognito*.tf` |
| AI / Wisdom (client) | `frontend/src/features/ai/`, screens `wisdom.tsx`, `ai-prayer.tsx` |
| AI / Wisdom (server) | `backend/ai/` + corpus `backend/ai/corpus/` |
| Subscriptions | `frontend/src/features/subscriptions/` + RevenueCat webhook in API |
| Content media | `assets/` (source) → `frontend/assets/` (bundled) |
| Secrets / env | `config/env/*` → local `.env`; prod SSM via Terraform |
| Agent skills | `skills/` (symlinked under `.claude/skills/`) |
| Tests & reports | `tests/backend/`, `tests/reports/` |

## Runtime stack

| Layer | Choice |
|-------|--------|
| Client | Expo Router, React Native, TypeScript |
| API | FastAPI + Mangum on Lambda |
| Data | DynamoDB (on-demand) |
| Auth | AWS Cognito (email + Google + Apple federation) |
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
| `ai-prayers` | Wisdom turns / prayer history |
| `payment-transactions` | RevenueCat-related |
| `rate-limits` | Distributed burst limits |
| `usage-events` | Product analytics (TTL ~90d) |
| `usage-daily` | Daily rollups |

## Auth flow (summary)

1. App uses Cognito (hosted UI / SDK) for email, Google, Apple.
2. Access token sent as `Authorization: Bearer …`.
3. `backend/auth/cognito.py` validates JWT and upserts `users` row.
4. Legacy email JWT remains only when Cognito is disabled (local/dev).

## AI / Wisdom flow (summary)

1. Client calls `POST /api/wisdom/chat` (or voice presign → transcribe → chat).
2. Guardrails (`ai/wisdom_guardrails.py`) scope emotional/spiritual topics.
3. RAG loads `ai/corpus/*.md`, retrieves chunks, calls Bedrock Converse.
4. Multi-model fallback chain (cheaper → stronger; no Claude).
5. Turn stored in `ai-prayers`; monthly free quota enforced on user record.

## Related docs

- [Deploy plan](deploy-plan.md)
- [Scalability](scalability.md)
- [Analytics](analytics.md)
- [Security / performance review](review.md)
- [Overview (short)](overview.md)
