# Backend

FastAPI API for ChristCalm, packaged to AWS Lambda via Mangum + CodeBuild.

## Layout

```
backend/
├── server.py              # App + /api router includes + local /media
├── handler.py             # Lambda entry (Mangum)
├── seed_data.py           # Catalog content (emotions, meditations, …)
├── api/
│   ├── models.py          # Pydantic models
│   ├── deps.py            # Auth dependencies
│   ├── middleware.py
│   └── routes/            # health, auth, catalog, user_content, wisdom, billing, analytics
├── auth/                  # Cognito JWT + Apple federation helpers
├── ai/                    # Wisdom LLM, RAG, guardrails, voice
│   └── corpus/            # Handbook + jesus_voice (RAG source)
├── core/                  # Env bootstrap, rate limits
├── data/                  # DynamoDB access
├── requirements.txt
└── requirements-lambda.txt
```

## HTTP surface (prefix `/api`)

| Area | Routes |
|------|--------|
| Health | `GET /`, `GET /health` |
| Auth | `GET /auth/config`, `GET /auth/me`, `POST /auth/onboarding` |
| Catalog | emotions, meditations (+ rate/complete), prayers, devotional |
| User content | mood, journal, feedback |
| Wisdom | status, quota, chat, **chat/stream**, history, voice presign/transcribe |
| Billing | subscription sync/status, RevenueCat webhook |
| Analytics | events, me, summary |

## Local run (secrets from SSM)

```bash
# From repo root — uses AWS credentials + SSM_PREFIX (no secrets in .env)
./scripts/run-backend-local.sh
```

Or manually:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export SSM_PREFIX=/christcalm-preview AWS_REGION=us-east-1
uvicorn server:app --reload --port 8000
```

Delete `backend/.env` anytime; re-run `./scripts/sync-env-from-aws.sh`.

## Deploy

```bash
./scripts/deploy-aws.sh code
```

See [`docs/architecture/deploy-plan.md`](../docs/architecture/deploy-plan.md) and product [15-backend-architecture.md](../docs/product/15-backend-architecture.md).
