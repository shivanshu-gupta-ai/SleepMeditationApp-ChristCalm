# Tests & reports

```
tests/
├── backend/          # Pytest (unit + API integration)
├── reports/          # Archived run artifacts (JSON, JUnit XML)
│   └── pytest/
├── conftest.py       # Shared fixtures (loads env, BASE_URL)
└── README.md
```

## Run backend tests

```bash
# From repo root
./scripts/sync-env-from-aws.sh   # public API URL only (no secrets in files)
pip install -r backend/requirements.txt
pytest tests/backend/ -v
```

Secrets for any process that boots the API come from **SSM** (`SSM_PREFIX`), not from `.env`.

### Offline / unit only (no live API)

```bash
pytest tests/backend/test_wisdom_guardrails.py \
       tests/backend/test_rate_limit.py \
       tests/backend/test_llm_validation.py \
       tests/backend/test_ai_quota.py -v
```

## Frontend

```bash
cd frontend && npx tsc --noEmit
# ESLint: cd frontend && npx eslint .
```

## Reports

Save CI or local artifacts under `tests/reports/`:

```bash
mkdir -p tests/reports/pytest
pytest tests/backend/ -v --junitxml=tests/reports/pytest/pytest_results.xml
```

HTTP integration tests require `frontend/.env` with `EXPO_PUBLIC_BACKEND_URL` pointing at a deployed API.
