# ChristCalm — Code, Security, Performance & Testing Review

**Date:** 2026-07-09  
**Scope:** Full stack (Expo frontend, FastAPI Lambda backend, DynamoDB, Bedrock AI)

---

## 1. Executive summary

| Area | Rating | Notes |
|------|--------|--------|
| Architecture | Good | Serverless, clear split FE/BE |
| Security | Medium→Good | Rate limits + safer AI errors added; see residual risks |
| Error handling | Good | Client-safe messages on AI; HTTP status codes used |
| Rate limiting | Good (app) | Auth + AI limits; API GW throttle |
| Performance | Acceptable | Static content fast; AI 1–8s; Lambda cold starts |
| Config hygiene | Good | Consolidated under `config/` |
| Test coverage | Improved | Unit + security + perf + E2E API |

---

## 2. Code review highlights

### Strengths
- FastAPI + Mangum on Lambda is appropriate for mobile BFF.
- JWT auth + DynamoDB GSI on email.
- Seed content in-memory (low latency for catalog).
- Frontend uses shared UI, theme tokens, SecureStore for JWT.

### Issues addressed in this pass
1. **AI default OpenAI → Bedrock** with IAM `InvokeModel`.
2. **Rate limiting** on signup/signin and AI prayer.
3. **AI errors** no longer leak stack/provider messages to clients.
4. **Input validation** for AI (length + control chars) and password max length.
5. **Config** documented under `config/API_REQUIREMENTS.md`.
6. **`X-Response-Time-Ms`** for observability.
7. **API Gateway** stage throttle (100 rps / burst 50).

### Residual code debt
| Item | Severity | Recommendation |
|------|----------|----------------|
| In-process rate limit (not shared across Lambda instances) | Med | Add DynamoDB counters or API GW usage plans for AI |
| Premium not enforced on `/ai/prayer` server-side | Med | Gate with `is_premium` if product requires it |
| JWT 30-day no refresh rotation | Low | Shorter access + refresh tokens |
| CORS may be wide if misconfigured | Low | Keep explicit origins in SSM |
| Frontend static `colors` on some screens | Low | Prefer `useTheme()` everywhere |
| Webhook auth optional if secret empty | Med | Always require webhook secret in prod |

---

## 3. Security review

### AuthN / AuthZ
- ✅ Password hashed (PBKDF2 100k).
- ✅ Bearer JWT required for user data routes.
- ✅ Sign-in does not distinguish unknown email vs bad password.
- ⚠️ Google OAuth state JWT short-lived — good.
- ⚠️ RevenueCat webhook: if secret unset, accepts all events — **set secret in prod**.

### Injection / XSS
- Backend: Pydantic models + DynamoDB parameterized APIs — low SQLi risk.
- AI: user text sanitized and length-capped before Bedrock.
- Frontend: React Native text escaping default.

### Secrets
- Templates only under `config/`; real secrets SSM SecureString.
- `EXPO_PUBLIC_*` must never hold private keys (RevenueCat public keys OK).

### Rate limiting / abuse
| Endpoint | Limit |
|----------|--------|
| Signup / signin | 30 / 15 min / IP |
| AI prayer | 12 / hour / user (+ IP 2×) |
| API Gateway | 100 rps, burst 50 |

### Checklist for production
- [ ] Bedrock model access enabled in account/region  
- [ ] `JWT_SECRET` strong random in SSM  
- [ ] RevenueCat webhook Authorization set  
- [ ] Google OAuth redirect locked to API URL  
- [ ] Review API Gateway access logs / CloudWatch alarms  

---

## 4. Performance review

| Operation | Expected latency | Bottleneck |
|-----------|------------------|------------|
| GET emotions / meditations | &lt; 300 ms warm | Lambda cold start only |
| Auth signup/me | 100–800 ms warm | DynamoDB + cold start |
| AI prayer (Bedrock) | **1–8 s** | Model inference |
| Meditation audio | Network CDN | Client bandwidth |

**App feel:** Catalog + auth should feel snappy after first cold start. AI prayer should show loading (“Praying with you…”) — already present on client.

**Optimizations if needed:**
- Provisioned concurrency for Lambda (cost vs cold start).
- Cache emotions/meditations on client (already re-fetched each visit).
- Bedrock latency: consider Haiku model for faster/cheaper prayers.

---

## 5. Testing strategy

| Layer | Location | Command |
|-------|----------|---------|
| Unit (rate limit, LLM validate) | `tests/backend/test_rate_limit.py`, `test_llm_validation.py` | `pytest tests/backend/test_rate_limit.py tests/backend/test_llm_validation.py -v` |
| Integration (live API) | `tests/backend/backend_test.py` | `pytest tests/backend/backend_test.py -v` |
| Security | `tests/backend/test_security.py` | `pytest tests/backend/test_security.py -v` |
| Performance | `tests/backend/test_performance.py` | `pytest tests/backend/test_performance.py -v` |
| E2E API journey | `tests/backend/test_e2e_flow.py` | `pytest tests/backend/test_e2e_flow.py -v -s` |
| Google / subscription | existing | `pytest tests/backend/ -v` |

**Requires:** `EXPO_PUBLIC_BACKEND_URL` in `frontend/.env` (from `sync-env-from-aws.sh`).

**Not automated yet (manual / future):**
- Expo UI e2e (Detox / Maestro)
- RevenueCat purchase sandbox
- Real Google OAuth browser flow
- Offline / poor network on device

---

## 6. Bedrock cutover

1. Terraform apply (IAM Bedrock + SSM `LLM_PROVIDER=bedrock`).  
2. Deploy code: `./scripts/deploy-aws.sh code`.  
3. In AWS console: Bedrock → Model access → enable Claude 3.5 Sonnet (or set `BEDROCK_MODEL_ID`).  
4. Call `POST /api/ai/prayer` with user JWT; expect 200 or 503 with safe message if model not enabled.

---

## 7. Verdict

Ship-ready for **preview** with Bedrock-first AI, documented config, and stronger abuse controls. Before **production**, complete the security checklist (webhook secret, model access, stronger JWT, consider premium gate + shared rate store).
