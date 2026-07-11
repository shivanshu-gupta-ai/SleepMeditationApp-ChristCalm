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
           usage analytics,           (optional OpenAI)
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

## Related

- [analytics.md](analytics.md) — usage event pipeline  
- [review.md](review.md) — security / performance checklist  
- [scalability.md](scalability.md) — DIY scale path & cost  
