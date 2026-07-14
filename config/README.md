# Configuration (SSM-first)

**Secrets live only in AWS SSM Parameter Store.**  
Local `.env` files are disposable and must not hold secrets.

## Source of truth

| What | Where |
|------|--------|
| Secrets (JWT, Apple, OpenAI, webhooks, …) | SSM `/christcalm-preview/*` via Terraform `ssm.tf` |
| Infra inputs (once) | `infrastructure/terraform/terraform.tfvars` (**gitignored**) |
| Frontend public config | Auto: `./scripts/sync-env-from-aws.sh` → `frontend/.env` |
| Backend local flags | Auto: same script → `backend/.env` (`SSM_PREFIX`, region, table prefix only) |

```
terraform.tfvars  ──apply──►  SSM  ──►  Lambda (always)
                              │
                              └──►  Local API (SSM_PREFIX + AWS profile/SSO)

sync-env-from-aws.sh  ──►  frontend/.env  (public only)
                      ──►  backend/.env   (non-secret flags only)
```

## Layout

```
config/
├── env/
│   ├── backend.env.example      # non-secret flags only
│   ├── frontend.env.example     # public Expo vars only
│   └── integrations.env.example # docs: put secrets in tfvars → SSM
├── auth/                        # Cognito / Apple / RevenueCat how-to
├── ci/buildspec.yml
└── API_REQUIREMENTS.md
```

## Day-to-day

```bash
# After AWS deploy (or anytime env is missing/deleted)
./scripts/sync-env-from-aws.sh

# Local API — secrets from SSM, not from files
./scripts/run-backend-local.sh

# Mobile/web UI against deployed API
./scripts/preview.sh
```

Delete `frontend/.env` / `backend/.env` whenever you want — re-run `sync-env-from-aws.sh`.

## First-time offline placeholder

```bash
./scripts/setup-config.sh
```

With AWS credentials, this just calls `sync-env-from-aws.sh`.  
Without credentials, it writes empty non-secret placeholders only.

## Production (AWS)

| Concern | Where |
|---------|--------|
| Secrets | SSM SecureString (`infrastructure/terraform/ssm.tf`) |
| Lambda env | `SSM_PREFIX`, table prefix, voice bucket only |
| AI | Bedrock via Lambda IAM (`LLM_PROVIDER=bedrock`) |
| Frontend URL/Cognito | Terraform outputs → sync script |

## Related

- [Deploy plan](../docs/architecture/deploy-plan.md)
- [Current architecture](../docs/architecture/current-architecture.md)
- Auth setup: [`auth/README.md`](auth/README.md)
