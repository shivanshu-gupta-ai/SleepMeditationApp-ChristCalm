# Testing, operations & scalability

---

## Testing (reference repo)

### Layout

```
tests/backend/
  test_wisdom_guardrails.py   # pure unit
  test_rate_limit.py
  test_llm_validation.py
  test_security.py
  test_ai_quota.py
  test_subscription.py
  test_cognito_auth.py
  test_apple_sign_in.py
  test_e2e_flow.py            # needs live API
  test_performance.py
  backend_test.py
  cognito_helpers.py
```

### Commands

```bash
# Prefer unit/no-network first
pytest tests/backend/test_wisdom_guardrails.py \
       tests/backend/test_rate_limit.py \
       tests/backend/test_llm_validation.py -v

# Full backend suite (may need API_URL + AWS)
pytest tests/backend/ -v

# Frontend types
cd frontend && npx tsc --noEmit

# Lint
cd frontend && npm run lint
```

### What to assert (product-level)

See also [11-rebuild-playbook.md](./11-rebuild-playbook.md) acceptance list.

| Area | Assert |
|------|--------|
| Catalog | Exclusive emotion→track mapping |
| Guardrails | Code prompts denied; anxiety allowed |
| Auth | Bad token → 401; signup/signin limits |
| Quota | Over monthly limit blocked |
| Webhook | Bad secret rejected; good secret sets premium |
| Complete | Stats increment; streak rules |
| Analytics | No journal body in props |
| Perf | Catalog p50 under ~200ms warm |

### Manual QA script

1. Onboarding complete → auth → Home  
2. Emotion → player → complete → soft paywall  
3. SOS one cycle  
4. Wisdom emotional + denied coding prompt  
5. Journal create + list  
6. Theme toggle light/dark  
7. Sign out / sign in  
8. Premium sandbox purchase (if configured)  

---

## Analytics operations

Events: app `track()` → buffer → `POST /api/analytics/events` → DynamoDB.

| Table | Role |
|-------|------|
| `{prefix}-usage-events` | Raw (TTL ~90 days) |
| `{prefix}-usage-daily` | Rollups: counts, DAU |

### Suggested event names

`app_open`, `onboarding_step`, `onboarding_complete`, `auth_sign_in`, `emotion_select`, `meditation_start`, `meditation_complete`, `sos_start`, `sos_complete`, `wisdom_send`, `journal_create`, `paywall_view`, `purchase_success`

### Query

- DynamoDB console: `usage-daily` for `day = YYYY-MM-DD`  
- API: `GET /api/analytics/summary?days=7` with JWT  

### Privacy

- Scalar props only  
- No journal body, no full prayer dumps  
- Anon id form: `anon:{device_id}` when logged out  

---

## Scalability runbook

### Already in codebase / Terraform

| Item | Notes |
|------|-------|
| API GW throttle vars | Raise via `terraform apply -var=…` |
| Dynamo rate-limits table | Shared across Lambdas |
| AI monthly cap | User record + env |
| Catalog Cache-Control | Middleware |
| Client catalog cache | 5 min |
| Provisioned concurrency var | Default 0 (no warm cost) |

### Scale steps (order)

1. Raise API Gateway stage throttle if 429s  
2. Confirm Dynamo on-demand (no partition hot-key issues)  
3. Ensure rate-limit table used (not only in-process)  
4. Watch Bedrock spend; lower `AI_MONTHLY_LIMIT` if needed  
5. Optional: Lambda provisioned concurrency = 2 on alias if cold starts hurt  
6. Optional: CloudFront for media bucket  
7. Service Quotas increase only if still throttled after config  

### What we do not need yet

- Fargate / always-on containers  
- Redis (unless chat fan-out grows huge)  
- Multi-region active-active  
- WAF (add when public marketing traffic)  

### Verify

```bash
curl -I "$API_URL/api/emotions" | grep -i cache
# Open Home twice — second catalog load should be cached client-side
```

---

## Security / performance review snapshot

| Area | Status | Notes |
|------|--------|-------|
| Architecture | Good | Serverless FE/BE split |
| Security | Medium→Good | Set webhook secret; distributed limits |
| AI errors | Good | Client-safe messages |
| Rate limiting | Good | Auth + AI + GW |
| Performance | Acceptable | Catalog fast; AI 1–8s; cold start 1–3s |
| Config hygiene | Good | SSM-first |
| Tests | Improved | Unit + security + e2e API |

### Residual debt

| Item | Severity | Mitigation |
|------|----------|------------|
| Premium not always enforced server-side on AI | Med | Gate if product requires |
| JWT long-lived without rotation | Low | Access + refresh |
| CORS misconfig | Low | Explicit origins |
| Webhook open if secret empty | Med | Require in prod |
| Hardcoded colors in stray screens | Low | useTheme only |

---

## Operational dashboards (recommended)

| Watch | Tool |
|-------|------|
| Lambda errors / duration | CloudWatch |
| API 4xx/5xx | API Gateway metrics |
| Dynamo throttles | CloudWatch |
| Bedrock cost | Cost Explorer |
| DAU / meditation_complete | usage-daily or product BI |

---

## Incident playbooks (short)

### Wisdom failing for everyone

1. `GET /api/wisdom/status`  
2. `./scripts/check-bedrock-models.sh`  
3. CloudWatch Lambda logs for Bedrock AccessDenied  
4. Confirm model IDs still available in region  

### Auth broken

1. Cognito domain / client id match frontend env  
2. Apple return URL exact  
3. `seed-test-user.sh` still works for email path  

### High bill

1. Cost Explorer → Bedrock  
2. Lower monthly quota / hourly rate  
3. Check abuse on unauthenticated paths  

### Bad deploy

1. Redeploy previous commit: `./scripts/deploy-aws.sh code`  
2. Confirm health endpoint  

---

## Capacity planning (rough)

| Users concurrent | Notes |
|------------------|-------|
| Tens–hundreds | Default serverless fine |
| Thousands spike | Raise GW throttle; watch Lambda concurrency account limit |
| AI-heavy | Bedrock TPM/RPM quotas dominate — request increases if needed |

---

## Rebuild ops checklist (any cloud)

- [ ] Secret manager (not files)  
- [ ] One-command deploy for API  
- [ ] Public client config generation  
- [ ] Health endpoint + smoke script  
- [ ] Unit tests for guardrails without network  
- [ ] Cost caps on LLM  
- [ ] Rollback path documented  
