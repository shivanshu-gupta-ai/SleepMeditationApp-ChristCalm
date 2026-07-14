# ChristCalm

Christian faith-based meditation & mental wellness app.

**Stack:** Expo (React Native) · FastAPI on AWS Lambda · DynamoDB · Cognito · Bedrock Wisdom

---

## Current architecture (map)

```
ChristCalmApp/
├── frontend/                 # Expo app
│   ├── app/                  # Routes (Expo Router)
│   └── src/features/         # auth · ai · subscriptions · onboarding
├── backend/                  # FastAPI + Lambda
│   ├── auth/                 # Cognito / OAuth
│   ├── ai/                   # LLM, RAG, guardrails, voice + corpus/
│   ├── core/                 # config, rate limits
│   └── data/                 # DynamoDB
├── infrastructure/terraform/ # AWS infra as code
├── config/                   # Env templates, auth samples, CI buildspec
│   ├── env/
│   ├── auth/
│   └── ci/buildspec.yml
├── assets/                   # Content media + app-design references
├── docs/                     # Product · design · architecture · engineering
├── skills/                   # Agent skills (ui-ux-pro-max, rules)
├── tests/                    # Pytest + reports/
└── scripts/                  # deploy · preview · env sync
```

| Need | Open |
|------|------|
| **Full architecture** | [`docs/architecture/current-architecture.md`](docs/architecture/current-architecture.md) |
| **Deploy plan** | [`docs/architecture/deploy-plan.md`](docs/architecture/deploy-plan.md) |
| Product / PRD | [`docs/product/PRD.md`](docs/product/PRD.md) |
| UI design system | [`docs/design/system.md`](docs/design/system.md) |
| Config / secrets | [`config/README.md`](config/README.md) |
| Testing | [`docs/engineering/testing.md`](docs/engineering/testing.md) |
| Docs index | [`docs/README.md`](docs/README.md) |

---

## Quick start

### 1. Configure (SSM-first — no secrets in local files)

```bash
./scripts/deploy-aws.sh apply      # first-time AWS infra (writes secrets to SSM)
./scripts/deploy-aws.sh code       # Lambda package via CodeBuild
./scripts/sync-env-from-aws.sh     # disposable public frontend + non-secret backend flags
```

Secrets stay in **SSM** (`/christcalm-preview/*`). Local `.env` files are safe to delete and re-sync.

### 2. Deploy API changes

```bash
./scripts/deploy-aws.sh code
```

### 3. Preview app (API stays on AWS)

```bash
./scripts/preview.sh
# or: cd frontend && npx expo start --web --clear
```

### Optional: local API (secrets still from SSM)

```bash
./scripts/run-backend-local.sh
```

## Test login (Cognito preview)

| Email | Password |
|-------|----------|
| `test@christcalm.dev` | `Test1234` |

Password policy: **8+ characters, uppercase, lowercase, and a number** (AWS Cognito).

Recreate / reset the user anytime:

```bash
./scripts/seed-test-user.sh
```

## Tests

```bash
pytest tests/backend/ -v
cd frontend && npx tsc --noEmit
```

Reports land under [`tests/reports/`](tests/reports/).

## Domain quick links

| Domain | Frontend | Backend | Config |
|--------|----------|---------|--------|
| Auth | `frontend/src/features/auth/` | `backend/auth/` | `config/auth/` |
| AI / Wisdom | `frontend/src/features/ai/` + `app/(tabs)/wisdom.tsx` | `backend/ai/` | Bedrock via Terraform IAM |
| Subscriptions | `frontend/src/features/subscriptions/` | webhook in `server.py` | RevenueCat env |
| Content media | `frontend/assets/` (bundle) | seed URLs | `assets/` (source) |

## Meditation pictures

1. Edit **`assets/meditations/covers/`** (`med-1.jpg` … `med-10.jpg`).
2. Copy into the app bundle:

```bash
cp assets/meditations/covers/*.jpg frontend/assets/meditations/covers/
```

3. Restart Expo: `cd frontend && npx expo start --clear`

## Design snapshot

- **Dark (default):** Nest — pure black, charcoal cards, violet + gold, gold FAB  
- **Light:** Cooper — cream-lavender, white cards, soft lavender + gold  
- **Type:** Inter  
- **Tokens:** `frontend/src/theme/`

## Infrastructure notes

- Serverless (no Fargate required for normal growth)
- Analytics → DynamoDB `usage-events` / `usage-daily`
- Idle cost near-zero; main future cost is Bedrock (Wisdom)

Details: [`docs/architecture/`](docs/architecture/).

## Agent notes

Lean coding rules: [`AGENTS.md`](AGENTS.md) · skills: [`skills/`](skills/)
