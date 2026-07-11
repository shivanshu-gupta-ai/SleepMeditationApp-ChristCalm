# Configuration (single folder)

All **env templates**, **API requirements**, and **auth integration samples** live here.  
Do **not** commit real secrets.

## Quick start

```bash
./scripts/setup-config.sh
```

Creates `backend/.env` and `frontend/.env` from templates if missing.

## Contents

| Path | Purpose |
|------|---------|
| [`API_REQUIREMENTS.md`](./API_REQUIREMENTS.md) | **Full** API routes, env vars, Bedrock/OpenAI, rate limits |
| [`backend.env.example`](./backend.env.example) | Backend / Lambda env template |
| [`frontend.env.example`](./frontend.env.example) | Expo public env |
| [`integrations.env.example`](./integrations.env.example) | RevenueCat + LLM |
| [`auth/`](./auth/) | Google OAuth, JWT, RevenueCat notes |

## Production (AWS)

| Concern | Where |
|---------|--------|
| Secrets | SSM `/christcalm-preview/*` (Terraform `aws/terraform/ssm.tf`) |
| AI | **Bedrock** via Lambda IAM (`LLM_PROVIDER=bedrock`) |
| API URL | Terraform output `api_url` → `./scripts/sync-env-from-aws.sh` |

## Related

- Deploy: `./scripts/deploy-aws.sh code`
- Preview: `./scripts/preview.sh`
- Tests: `pytest tests/ -v`
- Review: [`docs/REVIEW.md`](../docs/REVIEW.md)
