# Tests

| Path | Type |
|------|------|
| `backend/` | API integration tests (pytest, hit live AWS URL) |
| `reports/` | Archived test run artifacts |

## Run backend API tests

```bash
./scripts/sync-env-from-aws.sh   # sets EXPO_PUBLIC_BACKEND_URL
pip install -r backend/requirements.txt
pytest tests/backend/ -v
```

Requires `frontend/.env` with `EXPO_PUBLIC_BACKEND_URL` pointing at your deployed API.