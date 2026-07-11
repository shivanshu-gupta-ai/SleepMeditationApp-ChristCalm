# Engineering

| Doc | Description |
|-----|-------------|
| [testing.md](testing.md) | Test protocol & commands |
| Config templates | [`../../config/README.md`](../../config/README.md) |

## Commands

```bash
# Backend tests
pytest tests/backend/ -v

# Frontend typecheck
cd frontend && npx tsc --noEmit

# Local UI (API on AWS)
./scripts/preview.sh

# Deploy API code
./scripts/deploy-aws.sh code
```
