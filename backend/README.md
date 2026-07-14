# Backend

FastAPI API for ChristCalm, packaged to AWS Lambda via Mangum + CodeBuild.

## Layout

```
backend/
├── server.py           # HTTP routes
├── handler.py          # Lambda entry (Mangum)
├── seed_data.py        # Catalog content
├── auth/               # Cognito JWT + Apple federation helpers
├── ai/                 # Wisdom LLM, RAG, guardrails, voice
│   └── corpus/         # Handbook + jesus_voice (RAG source)
├── core/               # Env bootstrap, rate limits
├── data/               # DynamoDB access
├── requirements.txt
└── requirements-lambda.txt
```

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
# optional: ./scripts/sync-env-from-aws.sh  # writes non-secret backend/.env only
uvicorn server:app --reload --port 8000
```

Delete `backend/.env` anytime; re-run `./scripts/sync-env-from-aws.sh`.

## Deploy

```bash
./scripts/deploy-aws.sh code
```

See [`docs/architecture/deploy-plan.md`](../docs/architecture/deploy-plan.md).
