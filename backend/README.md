# Backend

FastAPI API for ChristCalm, packaged to AWS Lambda via Mangum + CodeBuild.

## Layout

```
backend/
├── server.py           # HTTP routes
├── handler.py          # Lambda entry (Mangum)
├── seed_data.py        # Catalog content
├── auth/               # Cognito JWT resolve, Google helpers
├── ai/                 # Wisdom LLM, RAG, guardrails, voice
│   └── corpus/         # Handbook + jesus_voice (RAG source)
├── core/               # Env bootstrap, rate limits
├── data/               # DynamoDB access
├── requirements.txt
└── requirements-lambda.txt
```

## Local run

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# ensure .env from ../../config/env/backend.env.example
uvicorn server:app --reload --port 8000
```

## Deploy

```bash
./scripts/deploy-aws.sh code
```

See [`docs/architecture/deploy-plan.md`](../docs/architecture/deploy-plan.md).
