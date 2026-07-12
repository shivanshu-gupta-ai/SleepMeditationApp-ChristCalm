# Architecture overview

ChristCalm is a **serverless** mobile backend: Expo app → HTTP API → Lambda → DynamoDB (+ Bedrock, S3, Transcribe).

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  Expo app       │ ─────────────► │ API Gateway HTTP │
│  (frontend/)    │                └────────┬─────────┘
└─────────────────┘                         │
                                            ▼
                                   ┌─────────────────┐
                                   │ Lambda + FastAPI│
                                   │ (backend/)      │
                                   └────────┬────────┘
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
              DynamoDB                 Bedrock LLM              S3 + Transcribe
           users, journal,            Wisdom chat               voice notes
           usage analytics,           (Converse only)
           rate limits
```

## Key paths

| Path | Role |
|------|------|
| `frontend/` | Expo Router app, design tokens, UI |
| `backend/` | FastAPI routes, Dynamo, LLM, voice |
| `aws/terraform/` | API Gateway, Lambda, DynamoDB, IAM, CodeBuild, S3 |
| `wisdom/` | RAG corpus (handbook + voice guide) |
| `config/` | Env templates (secrets never committed) |
| `scripts/` | deploy, preview, sync env |
| `tests/` | Backend pytest |

## Data stores (DynamoDB)

| Table suffix | Purpose |
|--------------|---------|
| `users` | Accounts, premium, AI monthly quota |
| `mood-logs` | Emotion logs |
| `journal-entries` | Journal |
| `ai-prayers` | Wisdom turns / prayers history |
| `payment-transactions` | RevenueCat-related |
| `rate-limits` | Distributed burst limits |
| `usage-events` | Product analytics (TTL ~90d) |
| `usage-daily` | Daily rollups for analysis |

## Deploy

```bash
./scripts/deploy-aws.sh apply   # infra
./scripts/deploy-aws.sh code    # Lambda package via CodeBuild
./scripts/sync-env-from-aws.sh  # EXPO_PUBLIC_BACKEND_URL
```

No Fargate/Docker required for normal scale. See [scalability.md](scalability.md).

## Wisdom LLM (Bedrock)

**Goal:** user should almost never see a Wisdom error. On any model failure, try the next.

Chain is **Converse-probed** and ordered **cheaper → stronger** (no Claude; Legacy-denied models omitted).

| # | Model ID | Role |
|---|----------|------|
| 1 | `openai.gpt-oss-20b-1:0` | **Primary** |
| 2 | `us.amazon.nova-micro-v1:0` | Cheapest fallback |
| 3 | `us.amazon.nova-lite-v1:0` | Cheap / fast |
| 4 | `us.amazon.nova-2-lite-v1:0` | Cheap / better |
| 5 | `us.meta.llama3-1-8b-instruct-v1:0` | Cost/performance |
| 6 | `mistral.mistral-large-2402-v1:0` | Strong writing |
| 7 | `us.meta.llama3-1-70b-instruct-v1:0` | Deeper reasoning |
| 8 | `us.meta.llama3-3-70b-instruct-v1:0` | Newer 70B |
| 9 | `us.amazon.nova-pro-v1:0` | Higher quality |
| 10 | `us.deepseek.r1-v1:0` | Heavy reasoning |
| 11 | `us.mistral.pixtral-large-2502-v1:0` | Last resort |

Validate: `./scripts/check-bedrock-models.sh us-east-1`

Agent lean rules (no runtime impact): [AGENTS.md](../../AGENTS.md) (ponytail).

## Related

- [analytics.md](analytics.md) — usage event pipeline  
- [review.md](review.md) — security / performance checklist  
- [scalability.md](scalability.md) — DIY scale path & cost  
