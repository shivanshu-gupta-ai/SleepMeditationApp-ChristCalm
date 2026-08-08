# Deploy plan

How ChristCalm ships to AWS (API) and how you run / preview the mobile client.

## Environments

| Env | API | App | Notes |
|-----|-----|-----|-------|
| **Local** | Optional local uvicorn *or* remote preview API | Expo web/iOS/Android | `frontend/.env` → `EXPO_PUBLIC_BACKEND_URL` |
| **Dev** | Lambda + API Gateway (`christcalm-dev`) | Expo against that URL | Cognito auto-confirm may be on |
| **Production** | Same pattern, prod Terraform workspace/vars | Store builds | Email verification required |

Today the primary path is **preview stack on AWS + local Expo**.

## Prerequisites

- AWS CLI credentials with rights for Lambda, API GW, DynamoDB, Cognito, S3, CodeBuild, SSM, IAM
- Terraform ≥ 1.5
- Node 20+ (Expo), Python 3.11+ (tests / local API)
- Optional: Expo account for device previews

## New AWS account (one-shot)

Assumes AWS credentials, laptop tools (terraform/aws/node), and Bedrock model access.

```bash
./scripts/bootstrap-new-account.sh
```

This will:

1. Detect **account id** and region  
2. Write `terraform.tfvars` with `name_suffix = "<account_id>"` and a generated `jwt_secret`  
3. Create stack + **auto-fill SSM** under `/christcalm-dev/`  
4. Deploy Lambda code  
5. Sync local public env + seed `test@christcalm.dev` / `Test1234`  

Re-run with `--force` only if you intentionally want to regenerate `tfvars`.

## First-time infrastructure (manual)


```bash
./scripts/setup-config.sh
# Edit backend/.env / frontend/.env if developing offline

cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Fill region, project, Apple/RevenueCat secrets as needed

cd ../..
./scripts/deploy-aws.sh apply
./scripts/deploy-aws.sh code          # package backend → CodeBuild → Lambda
./scripts/sync-env-from-aws.sh        # writes EXPO_PUBLIC_BACKEND_URL to frontend/.env
```

### What `apply` creates

- HTTP API Gateway → Lambda (FastAPI/Mangum)
- Ten DynamoDB tables (users, content, billing, rate limits, analytics)
- Cognito user pool + app client (+ Apple IdP when configured)
- S3 buckets (build artifacts, voice uploads)
- CodeBuild project for Lambda packaging
- SSM parameters for secrets referenced by Lambda

### What `code` does

1. Stages `backend/` (includes `ai/corpus/`) into a tarball (no `.venv`)
2. Uploads to S3 build bucket
3. Starts CodeBuild → runs `config/ci/buildspec.yml`:
   - `pip install -r requirements-lambda.txt`
   - Copies `auth/`, `ai/`, `core/`, `data/`, entrypoints
   - Zips → `lambda update-function-code`
4. Prints `api_url`

No local Docker required for Lambda builds.

## Day-to-day API deploy

```bash
# After backend Python changes
./scripts/deploy-aws.sh code

# After Terraform changes (tables, Cognito, IAM, throttle)
./scripts/deploy-aws.sh apply
# or: ./scripts/deploy-aws.sh deploy   # apply + code
```

## App preview (UI)

```bash
./scripts/sync-env-from-aws.sh   # if API URL changed
./scripts/preview.sh
# or: cd frontend && npx expo start --web --clear
```

The app talks to the **deployed** API unless you point `EXPO_PUBLIC_BACKEND_URL` at a local server.

### Local API (optional)

```bash
cd backend
source .venv/bin/activate   # or create venv + pip install -r requirements.txt
uvicorn server:app --reload --port 8000
# frontend/.env → EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Configuration sources of truth

| Secret / setting | Local | AWS |
|------------------|-------|-----|
| **All secrets** | — (never in `.env`) | SSM SecureString via Terraform |
| Disposable public frontend env | `./scripts/sync-env-from-aws.sh` | Terraform outputs |
| Disposable backend flags | same script (`SSM_PREFIX` only) | Lambda `SSM_PREFIX` env |
| Infra inputs (once) | `terraform.tfvars` (gitignored) | apply → SSM |
| Auth notes | `config/auth/` | Cognito + SSM |
| Local API | `./scripts/run-backend-local.sh` | loads secrets from SSM |

## CI / packaging

| File | Role |
|------|------|
| `config/ci/buildspec.yml` | CodeBuild steps for Lambda zip |
| `scripts/deploy-aws.sh` | Terraform + package + CodeBuild orchestration |
| `scripts/build-lambda.sh` | Alias → `deploy-aws.sh code` |
| `.github/workflows/deploy-preview.yml` | Optional GitHub Actions preview hooks |

## Verification checklist

```bash
# Unit / integration (needs API URL for HTTP tests)
pytest tests/backend/ -v

# Guardrails / pure unit (no network)
pytest tests/backend/test_wisdom_guardrails.py tests/backend/test_rate_limit.py tests/backend/test_llm_validation.py -v

# Frontend types
cd frontend && npx tsc --noEmit

# Bedrock model access in account
./scripts/check-bedrock-models.sh us-east-1
```

Smoke after deploy:

1. `GET {api_url}/api/health` (or status route)
2. Sign-up / sign-in via app
3. Wisdom chat one turn
4. Meditation list loads

## Rollback

- **Code only:** re-run `deploy-aws.sh code` from a known-good commit
- **Infra:** `cd infrastructure/terraform && terraform plan` / targeted apply; avoid destroy on shared preview without confirmation
- Lambda versions: enable aliases/versions in Terraform if you need instant traffic shift (not required today)

## Cost posture

- Idle cost near zero (on-demand DynamoDB, Lambda)
- Primary growth cost: **Bedrock** (Wisdom) + Transcribe minutes
- See [scalability.md](scalability.md) for throttle and DIY scale steps

## Related

- [Current architecture](current-architecture.md)
- [Config README](../../config/README.md)
- [Testing](../engineering/testing.md)
