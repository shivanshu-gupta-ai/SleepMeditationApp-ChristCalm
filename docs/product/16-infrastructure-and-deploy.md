# Infrastructure & deploy (AWS reference)

IaC root: `infrastructure/terraform/`  
Orchestration: `scripts/deploy-aws.sh`, `scripts/bootstrap-new-account.sh`

---

## What Terraform creates

| Resource | Purpose |
|----------|---------|
| **API Gateway HTTP API** | Public HTTPS entry → Lambda |
| **Lambda function** | FastAPI via Mangum |
| **IAM role** | DynamoDB, SSM read, Bedrock invoke, S3 voice, Transcribe, logs |
| **DynamoDB tables** | users (+ email GSI), mood-logs, journal-entries, meditation-ratings, user-feedback, ai-prayers, payment-transactions, rate-limits, usage-events, usage-daily |
| **Cognito User Pool** | Email users + federation |
| **Cognito App Client** | Mobile/public client |
| **Cognito Domain** | Hosted UI (`christcalm-dev`) |
| **Google / Apple IdP** | When flags + secrets set |
| **S3 build bucket** | CodeBuild source / artifacts |
| **S3 voice bucket** | Temporary audio uploads |
| **S3 media bucket** (if used) | Meditation audio/covers public or CF |
| **CodeBuild project** | `pip install` + zip + `update-function-code` |
| **SSM parameters** | All secrets SecureString |

### Naming / isolation

```
name_suffix = <aws_account_id>   # recommended for multi-account
resources: christcalm-dev-…
SSM path:  /christcalm-dev/*
Cognito domain: christcalm-dev
Media:     christcalm-preview-media-<account> (shared)
```

Without suffix, default preview names apply (single shared account).

---

## Prerequisites

- AWS CLI credentials (IAM admin-ish for first bootstrap)  
- Terraform ≥ 1.5  
- Node 20+ (Expo)  
- Python 3.11+ (tests / local API)  
- Bedrock **model access** enabled in region (default `us-east-1`)  

Confirm identity:

```bash
aws sts get-caller-identity
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
export AWS_REGION="$(aws configure get region 2>/dev/null || echo us-east-1)"
```

---

## One-shot bootstrap (new account)

```bash
./scripts/bootstrap-new-account.sh
# optional:
./scripts/bootstrap-new-account.sh --region us-east-1
./scripts/bootstrap-new-account.sh --force   # overwrite terraform.tfvars
```

Steps performed:

1. Detect account id + region  
2. Write `infrastructure/terraform/terraform.tfvars` (`name_suffix`, generated `jwt_secret`)  
3. `terraform apply` → stack + SSM parameters  
4. Deploy Lambda code via CodeBuild  
5. `sync-env-from-aws.sh` → local public env  
6. Seed test user `test@christcalm.dev` / `Test1234`  

---

## Manual first-time

```bash
./scripts/setup-config.sh

cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# edit: region, project, Google/Apple/RevenueCat secrets as needed

cd ../..
./scripts/deploy-aws.sh apply
./scripts/deploy-aws.sh code
./scripts/sync-env-from-aws.sh
```

### `deploy-aws.sh` commands

| Command | Action |
|---------|--------|
| `apply` | Terraform apply |
| `code` | Stage backend tarball → S3 → CodeBuild → Lambda update |
| `deploy` | apply + code |

### What `code` packaging does

1. Stages `backend/` (includes `ai/corpus/`) — excludes `.venv`  
2. Uploads to S3 build bucket  
3. CodeBuild runs `config/ci/buildspec.yml`:  
   - `pip install -r requirements-lambda.txt -t package`  
   - Copy modules + entrypoints  
   - Zip → `aws lambda update-function-code`  
4. Prints `api_url`  

**No local Docker required.**

---

## Day-to-day

```bash
# Backend Python changes
./scripts/deploy-aws.sh code

# Infra changes (tables, Cognito, IAM, throttle)
./scripts/deploy-aws.sh apply

# Full
./scripts/deploy-aws.sh deploy

# UI against deployed API
./scripts/sync-env-from-aws.sh
./scripts/preview.sh
```

### Local API (optional)

```bash
./scripts/run-backend-local.sh
# or: cd backend && uvicorn server:app --reload --port 8000
# frontend/.env → EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

Secrets still load from SSM (AWS credentials required).

---

## CodeBuild buildspec (summary)

File: `config/ci/buildspec.yml`

Typical phases:

1. Install Python deps into build directory  
2. Assemble Lambda package tree  
3. Zip artifact  
4. Update function code  
5. Optional smoke  

---

## Terraform variables (conceptual)

| Variable | Meaning |
|----------|---------|
| `aws_region` | Default `us-east-1` |
| `project_name` / `environment` | Naming |
| `name_suffix` | Account isolation |
| `jwt_secret` | Into SSM |
| `api_throttle_rate` / `burst` | API GW stage |
| `ai_monthly_limit` | User quota default |
| `lambda_provisioned_concurrency` | 0 by default |
| `enable_apple_sign_in` / Google | IdP toggles |
| Apple/Google/RevenueCat secrets | → SSM |

`terraform.tfvars` is **gitignored**.

### Important outputs

- `api_url`  
- Cognito user pool id, client id, domain  
- Table prefix / SSM prefix  
- Media bucket URL (if any)  

---

## Cognito + Apple (ops summary)

Full checklist: `config/auth/README.md`

| Piece | Role |
|-------|------|
| User pool | Users |
| App client | Mobile (no secret) |
| Domain | Hosted UI |
| Apple Services ID | Federated client_id |
| Return URL | `https://{domain}.auth.{region}.amazoncognito.com/oauth2/idpresponse` |
| Team ID / Key ID / private key | SSM only — never in app |

App never holds Apple private keys.

Email seed:

```bash
./scripts/seed-test-user.sh
# test@christcalm.dev / Test1234
```

---

## Verification after deploy

```bash
# Health
curl -sS "$API_URL/api/health"

# Catalog
curl -sS "$API_URL/api/emotions" | head

# Types
cd frontend && npx tsc --noEmit

# Tests
pytest tests/backend/ -v

# Bedrock
./scripts/check-bedrock-models.sh us-east-1
```

Smoke UX:

1. Health OK  
2. Sign-up / sign-in  
3. Meditation list  
4. One Wisdom turn  
5. Journal write  

---

## Rollback

| Layer | Action |
|-------|--------|
| Code | Re-run `deploy-aws.sh code` from known-good commit |
| Infra | `terraform plan` / targeted apply; avoid destroy on shared preview |
| Instant traffic shift | Optional Lambda versions + aliases (not required today) |

---

## Cost posture

| Component | Idle | Scale driver |
|-----------|------|--------------|
| Lambda | ~$0 | Invocations + duration |
| DynamoDB on-demand | ~$0 | RRU/WRU |
| API Gateway | low | Requests |
| Cognito | free tier then MAU | Users |
| **Bedrock** | 0 | **Wisdom tokens** |
| Transcribe | 0 | Voice minutes |
| S3 | storage | Media + voice |

Primary growth cost: **Bedrock**. Guard with monthly AI quota.

---

## Production checklist

- [ ] Strong unique `jwt_secret` / Cognito config  
- [ ] `REVENUECAT_WEBHOOK_AUTHORIZATION` set  
- [ ] CORS origins locked to real apps  
- [ ] Cognito email verification on  
- [ ] Bedrock access for chosen model IDs  
- [ ] Apple return URL exact match  
- [ ] No `UNLOCK_ALL` in store builds  
- [ ] CloudWatch alarms on Lambda errors (recommended)  
- [ ] Privacy policy + support contact  
