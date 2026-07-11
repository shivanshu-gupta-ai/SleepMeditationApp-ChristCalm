# ChristCalm

Christian faith-based mental wellness mobile app — **Expo** frontend + **FastAPI** on AWS Lambda.

## Repository layout

```
ChristCalmApp/
├── frontend/          # Expo React Native app (expo-router)
├── backend/           # FastAPI API (Lambda handler + services)
├── config/            # Env templates & API key placeholders (auth, integrations)
├── docs/              # Design, product, onboarding, colors
├── assets/audio/      # Meditation audio uploads (wire to CDN in seed_data.py)
├── tests/             # Integration tests & archived reports
├── aws/terraform/     # Infrastructure (Lambda, DynamoDB, SSM, CodeBuild)
└── scripts/           # Deploy, preview, config setup
```

## Quick start

### 1. Configure

```bash
./scripts/setup-config.sh          # creates backend/.env + frontend/.env from templates
./scripts/deploy-aws.sh apply      # first-time AWS infrastructure
./scripts/sync-env-from-aws.sh     # writes API URL to frontend/.env
```

API keys (Google OAuth, RevenueCat, OpenAI): see [`config/auth/`](config/auth/).

### 2. Deploy backend (AWS CodeBuild — no local Docker)

```bash
./scripts/deploy-aws.sh code
```

### 3. Preview mobile UI locally

```bash
./scripts/preview.sh
```

Backend stays on AWS; only the Expo dev server runs locally.

## Test login

| Email | Password |
|-------|----------|
| `test@christcalm.dev` | `test1234` |

Use **Sign In** (not Google). Complete onboarding or tap “Already have an account?” on step 0.

## Tests

```bash
pytest tests/backend/ -v
```

## Stack

- **Mobile:** Expo SDK 54, expo-router, expo-audio
- **API:** FastAPI + Mangum on Lambda, API Gateway HTTP API
- **Data:** DynamoDB, secrets in SSM Parameter Store
- **Deploy:** Terraform + AWS CodeBuild

## Docs

- Design & colors: [`docs/design/`](docs/design/)
- Product PRD: [`docs/product/PRD.md`](docs/product/PRD.md)
- Config guide: [`config/README.md`](config/README.md)