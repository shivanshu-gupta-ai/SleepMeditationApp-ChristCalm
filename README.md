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

## Deploy to a new AWS account

Use this when **you** (or a teammate) deploy ChristCalm into **your own** AWS account.  
Resources and SSM paths are isolated with **your account id** automatically.

### Prerequisites

- AWS credentials for the **target** account (IAM admin recommended, not root)
- Laptop tools: `aws`, `terraform` (≥ 1.5), Node/npm, Python 3, `openssl`
- Bedrock model access enabled in the region (default `us-east-1`)

### 1. Confirm AWS identity (auto-fetch account id)

```bash
# Who am I? This prints Account, UserId, Arn for the credentials in use.
aws sts get-caller-identity

# Capture the 12-digit account id (bootstrap uses this the same way)
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
export AWS_REGION="$(aws configure get region 2>/dev/null || echo us-east-1)"

echo "Deploying ChristCalm into account: ${AWS_ACCOUNT_ID}  region: ${AWS_REGION}"
```

Example output of `aws sts get-caller-identity`:

```json
{
  "UserId": "AIDA...",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/you"
}
```

That **`Account`** value becomes `name_suffix` so stacks look like:

| Kind | Pattern |
|------|---------|
| Resource names | `christcalm-preview-<account_id>-…` |
| Cognito domain | `christcalm-preview-<account_id>` |
| SSM secrets | `/christcalm-preview-<account_id>/*` |

### 2. One-shot bootstrap (recommended)

From the repo root:

```bash
./scripts/bootstrap-new-account.sh
```

Optional:

```bash
./scripts/bootstrap-new-account.sh --region us-east-1
./scripts/bootstrap-new-account.sh --force   # only if you intentionally overwrite terraform.tfvars
```

**What bootstrap does (using the account id from STS):**

1. Runs `aws sts get-caller-identity` → account id + region  
2. Writes `infrastructure/terraform/terraform.tfvars` (gitignored) with  
   `name_suffix = "<account_id>"` and a generated `jwt_secret`  
3. `terraform apply` → API Gateway, Lambda, DynamoDB, Cognito, S3, CodeBuild  
4. **Populates SSM automatically** under `/christcalm-preview-<account_id>/`  
5. Builds & deploys Lambda code (CodeBuild)  
6. Syncs disposable `frontend/.env` + `backend/.env` (public / non-secret only)  
7. Seeds Cognito test user  

You do **not** hand-create SSM parameters or paste secrets into local env files.

### 3. Preview the app

```bash
./scripts/preview.sh
# Expo → http://localhost:8081  (API is your new Lambda URL)
```

### 4. Sign in

| Email | Password |
|-------|----------|
| `test@christcalm.dev` | `Test1234` |

Reset anytime: `./scripts/seed-test-user.sh`

### Day-to-day after first deploy

```bash
./scripts/deploy-aws.sh code       # API / backend code only
./scripts/deploy-aws.sh apply      # infra / SSM / Cognito changes
./scripts/sync-env-from-aws.sh     # refresh local public env if API URL changed
./scripts/run-backend-local.sh     # optional local API (secrets still from SSM)
```

Secrets stay in **SSM** for that account. Local `.env` files are safe to delete and re-sync.

### Notes

- Each AWS account gets its **own** data and Cognito users (not shared with other deployers).  
- Apple Sign-In / RevenueCat need extra credentials later (`config/auth/README.md`).  
- Full plan: [`docs/architecture/deploy-plan.md`](docs/architecture/deploy-plan.md)

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
