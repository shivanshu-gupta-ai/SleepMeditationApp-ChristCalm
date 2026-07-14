# Configuration (single folder)

All **env templates**, **CI build specs**, **API requirements**, and **auth integration samples**.

Do **not** commit real secrets.

## Layout

```
config/
├── env/                      # Environment templates
│   ├── backend.env.example
│   ├── frontend.env.example
│   └── integrations.env.example
├── auth/                     # Google OAuth, Cognito, RevenueCat samples
├── ci/
│   └── buildspec.yml         # AWS CodeBuild Lambda package
└── API_REQUIREMENTS.md       # Full API routes & limits
```

## Quick start

```bash
./scripts/setup-config.sh
```

Creates `backend/.env` and `frontend/.env` from `config/env/*` if missing.

## Production (AWS)

| Concern | Where |
|---------|--------|
| Secrets | SSM `/christcalm-preview/*` (`infrastructure/terraform/ssm.tf`) |
| AI | **Bedrock** via Lambda IAM (`LLM_PROVIDER=bedrock`) |
| API URL | Terraform output `api_url` → `./scripts/sync-env-from-aws.sh` |
| CI package | `config/ci/buildspec.yml` |

## Related

- Deploy plan: [`docs/architecture/deploy-plan.md`](../docs/architecture/deploy-plan.md)
- Current architecture: [`docs/architecture/current-architecture.md`](../docs/architecture/current-architecture.md)
- Preview: `./scripts/preview.sh`
- Tests: `pytest tests/backend -v`
