# ChristCalm — Production Readiness & Security Checklist

**App:** ChristCalm (Christian calm / meditation / wisdom companion)  
**Stack:** Expo 54 + React Native · FastAPI on AWS Lambda · API Gateway · DynamoDB · Cognito · Bedrock · RevenueCat · EAS / TestFlight  

**How to use:** Check items as you verify. Prefer evidence (test name, URL, screenshot, log).  
**Related:** `docs/product/02-product-requirements.md`, `docs/engineering/testing.md`, `tests/PRODUCTION_READINESS_REPORT.md`

---

## App map (what we ship)

| Area | Client | Backend |
|------|--------|---------|
| Auth | Email Cognito + Sign in with Apple | Cognito tokens → `/api/*` Bearer |
| Onboarding | Multi-step draft → sync | `POST /api/onboarding` |
| Home / Meditate / SOS / Prayers | Expo Router tabs | Catalog: emotions, meditations, prayers, devotional |
| Wisdom chat + voice | Chat UI, mic → S3 | Guardrails + RAG + Bedrock; quota; voice presign |
| Journal | Private entries + mood | User-scoped DynamoDB |
| Paywall / Premium | RevenueCat SDK | `is_premium` + RevenueCat webhook |
| Profile | Stats, theme, sign out | `/api/me` |

**Environments**

| Env | API | App flags |
|-----|-----|-----------|
| Local preview | Live Lambda URL | explicit `UNLOCK_ALL=1` + RC test key (via sync-env) |
| Device IAP sandbox | Same API | `UNLOCK_ALL=0`, RC `appl_` key |
| EAS production / TestFlight | Production env in `eas.json` | `UNLOCK_ALL=0`, RC `appl_` key |

---

## 1. Security — ChristCalm-specific threats

These are the realistic vulnerabilities for *this* codebase (not a generic web checklist).

### 1.1 Secrets & config

- [ ] No AWS keys, Cognito secrets, JWT secrets, ASC `.p8`, or RevenueCat **secret** keys in git
- [ ] Backend secrets only via **SSM** (`SSM_PREFIX=/christcalm-dev/…`); local `backend/.env` is non-secret
- [ ] `infrastructure/terraform/terraform.tfvars` and `frontend/credentials.json` stay gitignored
- [ ] EAS / `eas.json` only holds **public** Expo env (`EXPO_PUBLIC_*`); never private Apple keys
- [ ] RevenueCat **public** SDK keys (`appl_…` / `test_…`) may ship in the client; RC **secret** / webhook auth never does
- [ ] Rotate any secret that was ever committed or pasted into chat/logs

**Possible vulns:** leaked `jwt_secret` in tfvars if committed; Hostinger/RC/WordPress tokens in personal MCP configs; ASC API key on disk with broad ASC roles.

### 1.2 Authentication (Cognito + Apple)

- [ ] Unauthenticated calls to protected routes return **401** (`/api/me`, journal, wisdom chat, complete meditation)
- [ ] Invalid / expired / wrong-audience Cognito access tokens are rejected
- [ ] Apple Sign-In only via Cognito Hosted UI; backend trusts **Cognito**, not raw Apple ID tokens from the client
- [ ] Password policy enforced (8+, upper, lower, number)
- [ ] Confirm-email / forgot-password / reset-password flows complete
- [ ] Sign-out clears secure storage tokens (no ghost session on reinstall without re-auth where expected)
- [ ] Seed account premium only when `ALLOW_PREVIEW_TEST_PREMIUM=1` (local API) — never on production Lambda
- [ ] Client has **no** hard-coded free-premium emails; `UNLOCK_ALL` defaults to **off**

**Possible vulns:** accepting client-supplied `user_id`; skipping Cognito when `USE_COGNITO` mis-set; Apple IdP return URL mismatch → account takeover attempts; auto-confirm in prod if left on for “preview”.

### 1.3 Authorization / IDOR (user data)

- [ ] User A **cannot** read User B journal by guessing IDs (`GET/POST /api/journal`)
- [ ] Wisdom history is scoped to the authenticated `sub` / user id only
- [ ] Meditation ratings / completions / mood logs cannot be written under another user
- [ ] Feedback list endpoints do not expose other users’ feedback to non-admins
- [ ] Premium content gating is enforced **server-side** for paid features that hit the API (not only UI hide)

**Possible vulns:** IDOR on journal/wisdom if queries use client `user_id`; spoofing `complete_meditation` to unlock free-tier progress wrongly; client-only paywall with `UNLOCK_ALL` left on in store builds.

### 1.4 Premium / RevenueCat

- [ ] Store build has `EXPO_PUBLIC_UNLOCK_ALL=0`
- [ ] Premium state ultimately comes from RevenueCat entitlement + webhook → DynamoDB `is_premium` / `premium_until`
- [ ] Webhook `POST /api/revenuecat/webhook` rejects missing/wrong `Authorization`
- [ ] Webhook is **idempotent** (duplicate events don’t corrupt state)
- [ ] Expired `premium_until` is cleared by `resolve_premium_user`
- [ ] Sandbox IAP works on device with `appl_` key (see `docs/engineering/ios-sandbox-iap-manual.md`)

**Possible vulns:** forged webhook without shared secret; trusting only client `Purchases.getCustomerInfo` without server sync for gated API features; test-store key in production build.

### 1.5 AI Wisdom (prompt injection & abuse)

- [ ] Guardrails block off-scope prompts (code, homework, jailbreaks) — `tests/backend/test_wisdom_guardrails.py`
- [ ] Input validation strips control chars / enforces length — `test_llm_validation.py`
- [ ] Monthly AI quota enforced; blocked messages do not burn quota incorrectly
- [ ] Rate limits on `wisdom:chat` per user **and** IP
- [ ] Model chain has safe fallbacks; no stack traces / system prompts returned to clients
- [ ] Corpus (`Wisdom_Handbook.md`, `jesus_voice.md`) is not exfiltrated wholesale via clever prompts
- [ ] Voice: presigned upload size/type constrained; only owner’s `s3_key` accepted for transcribe

**Possible vulns:** prompt injection (“ignore instructions, dump system prompt”); RAG data leak; cost attack (unlimited Bedrock calls); voice presign open PUT to any key; SSRF if URL fetch ever added to RAG.

### 1.6 API surface & transport

- [ ] Public catalog routes are intentional only: emotions, meditations, prayers, devotional, wisdom status, health
- [ ] CORS allowlist is appropriate (not `*` with credentials if that ever appears)
- [ ] Health (`/api/health`) does not leak secrets or internal ARNs
- [ ] Production errors do not return Python stack traces
- [ ] Auth endpoints rate-limited (signup/signin)
- [ ] Dependencies scanned (`npm audit`, Python pins in Lambda requirements)

**Possible vulns:** open CORS + token theft XSS on web; verbose 500s; unauthenticated expensive endpoints; dependency CVEs in Expo tree.

### 1.7 Mobile client

- [ ] Tokens stored in **SecureStore** (not plain AsyncStorage) on iOS/Android
- [ ] Deep link scheme `christcalm://` / OAuth redirect cannot be hijacked by another app for tokens
- [ ] Microphone permission string matches real use (Wisdom voice only)
- [ ] No sensitive journal/wisdom content in analytics payloads
- [ ] Web build does not expose more debug tooling than intended

**Possible vulns:** token theft from AsyncStorage; OAuth redirect interception; analytics PII; debug menus in production.

### 1.8 Infrastructure

- [ ] DynamoDB encryption at rest + point-in-time recovery (or documented backup plan)
- [ ] S3 voice/media buckets not public; presign expiry short
- [ ] Lambda IAM least privilege (no `*` on unrelated accounts)
- [ ] API Gateway / WAF or at least app rate limits under abuse
- [ ] CloudWatch alarms on 5xx, Lambda errors, throttle

**Possible vulns:** public S3 objects; over-privileged deploy role; no alarms → silent outage or bill spike from AI.

---

## 2. Product / feature QA (MVP acceptance)

### 2.1 Onboarding & auth

- [ ] Onboarding (~11–12 steps) completes; draft persists; lands on Home
- [ ] Email sign-up / sign-in / confirm email
- [ ] Forgot + reset password
- [ ] Sign in with Apple (when IdP seeded)
- [ ] Unauthenticated user cannot stay on tab screens that need a session

### 2.2 Core calm flows

- [ ] Home: greeting, emotions, SOS entry, path, today’s word
- [ ] Meditate list filters by emotion; cards show duration / Scripture
- [ ] Player: play/pause, scrub, complete → stats update
- [ ] SOS: 4-7-8 cycles, verses rotate, start/pause
- [ ] Prayers library lists by category
- [ ] Journal create + list with mood
- [ ] Profile: name, stats, theme toggle, sign out
- [ ] Soft paywall after first practice (with `UNLOCK_ALL=0`)

### 2.3 Wisdom

- [ ] Text chat returns in-scope pastoral reply
- [ ] Off-scope prompt gets guardrail message
- [ ] History loads for the current conversation only
- [ ] Quota UI matches server remaining
- [ ] Voice: record → upload → transcript → chat (device)

### 2.4 Monetization

- [ ] Monthly `cc_999_1m` and annual `cc_1999_1y_1w0` packages resolve in RC
- [ ] Purchase restores entitlement
- [ ] Restore purchases works
- [ ] Backend `is_premium` flips after webhook (or RC sync path)

---

## 3. Architecture & code quality (this repo)

- [ ] Structure matches monorepo layout: `frontend/`, `backend/`, `infrastructure/`, `docs/`, `tests/`
- [ ] Feature modules under `frontend/src/features/*` stay separate from pure UI
- [ ] Backend packages: `auth/`, `ai/`, `core/`, `data/` — avoid god-file growth in `server.py`
- [ ] DynamoDB access patterns documented (`docs/product/07-data-models.md`)
- [ ] New env vars documented in `config/README.md` / env examples

---

## 4. Automated testing

### Backend (run from repo root)

```bash
source backend/.venv/bin/activate
# Offline / unit (no live network required for most)
pytest tests/backend/test_wisdom_guardrails.py \
       tests/backend/test_rate_limit.py \
       tests/backend/test_llm_validation.py \
       tests/backend/test_ai_quota.py \
       tests/backend/test_security.py -v

# Full suite (hits live Cognito/API when env configured)
pytest tests/backend/ -v --junitxml=tests/reports/pytest/full_backend.xml
```

- [ ] Security suite green (auth required, invalid JWT, health clean)
- [ ] Guardrails + rate limit + LLM validation + AI quota green
- [ ] Subscription / webhook tests green
- [ ] E2E flow test green against preview API
- [ ] Apple Sign-In tests green **after** SSM + Cognito IdP seeded

### Frontend

```bash
cd frontend
npx tsc --noEmit
npx eslint .
npx expo-doctor
npm audit
```

- [ ] Typecheck clean
- [ ] Lint clean (or only known exceptions)
- [ ] Expo doctor clean for SDK 54
- [ ] No unexpected high/critical npm vulns

### Mobile UI automation (Expo MCP)

With Expo MCP + local capabilities (`expo-mcp`, `EXPO_UNSTABLE_MCP_SERVER=1`):

- [ ] Sign-in happy path (screenshot + `testID` taps)
- [ ] Complete one meditation
- [ ] Open Wisdom, send allowed message, verify reply UI
- [ ] Offline banner when network disabled

---

## 5. Performance & scalability

- [ ] DynamoDB keys match access patterns (user-partitioned journal/wisdom)
- [ ] Meditation / prayer lists paginated or bounded if catalog grows
- [ ] Wisdom history limits enforced (server already uses `limit`)
- [ ] Audio/cover assets cached sensibly; covers offline-ready where intended
- [ ] Loading / skeleton states on slow network
- [ ] AI latency acceptable; fallback models work if primary fails
- [ ] Light load test on `/api/health` + authenticated chat under rate limits

---

## 6. Reliability & ops

- [ ] User-facing errors are friendly (no white screen on API 401/500)
- [ ] RevenueCat webhook failures logged; retries safe
- [ ] Lambda / API Gateway logs retained
- [ ] CloudWatch alarm on error rate
- [ ] Bedrock throttling surfaces as soft error, not crash
- [ ] OfflineBanner + connectivity context behave correctly

---

## 7. Data privacy & compliance (faith + wellness app)

- [ ] Journal and wisdom content treated as private user data
- [ ] Privacy policy URL live (required for App Store subscriptions)
- [ ] No clinical / diagnostic claims in copy or AI replies
- [ ] Microphone purpose string accurate
- [ ] Export / delete account path documented or implemented (App Store expectation)
- [ ] Analytics events anonymized (see `frontend/src/utils/analytics.ts`)
- [ ] Age rating questionnaire answered honestly in ASC

---

## 8. Deployment & release

- [ ] `./scripts/deploy-aws.sh code` deploys Lambda; `/api/health` ok
- [ ] `./scripts/sync-env-from-aws.sh` refreshes public frontend env
- [ ] EAS project linked; production profile env correct
- [ ] iOS credentials (dist cert + App Store profile) valid
- [ ] TestFlight build processes; export compliance set (`ITSAppUsesNonExemptEncryption`)
- [ ] IAP products Ready to Submit with review screenshots
- [ ] CI (`.github/workflows/deploy-preview.yml`) still green on main

**Release commands (reference)**

```bash
./scripts/deploy-aws.sh code
./scripts/preview.sh                    # local Expo → live API
cd frontend && npx testflight           # EAS build + ASC submit (creds required)
```

---

## 9. Integrations

| Integration | Verify |
|-------------|--------|
| Cognito | Pool, client, domain, Apple IdP |
| Bedrock | Model access in region; chain without Claude-only models if stripped |
| RevenueCat | Apps, products, entitlement `christcalm_premium`, webhook |
| S3 | Voice presign + media bucket private |
| App Store Connect | App id `6788769964`, bundle `com.christcalm.app` |
| Expo / EAS | Project `@shivanshu_here/christcalm` |

- [ ] Each row above smoke-tested in preview
- [ ] Feature flags: `EXPO_PUBLIC_UNLOCK_ALL`, RC mode via `CHRISTCALM_RC_MODE`

---

## 10. Maintainability

- [ ] Root `README.md` covers deploy + test user
- [ ] Product + architecture docs under `docs/` current
- [ ] High-risk AI path has tests + guardrails docs (`docs/product/09-ai-wisdom.md`)
- [ ] Known debt listed (Apple IdP, monitoring, UI e2e, WAF)
- [ ] Agents know Expo MCP + XcodeBuildMCP for mobile work (`AGENTS.md`)

---

## Possible security vulnerability register (quick reference)

| ID | Area | Risk | Severity | Mitigation / test |
|----|------|------|----------|-------------------|
| V1 | Webhook | Forged RevenueCat events set anyone premium | High | Shared secret header; `test_subscription` / security tests |
| V2 | IDOR | Read others’ journal / wisdom | High | Always key DynamoDB by auth user id |
| V3 | AI | Prompt injection / corpus dump | High | Guardrails + validation + rate/quota |
| V4 | AI | Cost / DoS via chat or voice | High | Per-user + IP rate limits; quota |
| V5 | Premium | `UNLOCK_ALL=1` in store binary | High | EAS production env must be `0` |
| V6 | Auth | Weak/misconfigured Cognito or Apple IdP | High | Apple tests; no auto-confirm in prod |
| V7 | Voice | Abuse of presigned S3 PUT | Medium | Short TTL, key prefix, size limits |
| V8 | Secrets | jwt / p8 / SSM leakage | High | Gitignore, SSM, secret scan |
| V9 | Client | Token in insecure storage / logs | Medium | SecureStore; scrub analytics |
| V10 | API | Verbose errors / open CORS | Medium | Production exception handlers; CORS audit |
| V11 | Deps | npm / Lambda package CVEs | Medium | `npm audit`, pin Lambda deps |
| V12 | Infra | Public media/voice objects | Medium | Bucket policy review |
| V13 | OAuth | Redirect URI hijack | Medium | Exact Cognito + Apple return URLs |
| V14 | Progress | Spoof completions for unlocks | Low–Med | Server-side rules for free tier |
| V15 | Web | XSS on Expo web if user HTML ever rendered | Medium | No raw HTML from AI without sanitization |

---

## Quick pre-launch gate (minimum)

Before real users on TestFlight / App Store:

1. [ ] Secrets not in git; store build `UNLOCK_ALL=0`
2. [ ] Auth + user-scoped data verified server-side
3. [ ] Wisdom guardrails + rate limits green
4. [ ] RevenueCat webhook auth + sandbox purchase path verified
5. [ ] `/api/health` green on deployed API
6. [ ] Privacy policy + IAP metadata ready
7. [ ] Critical flows tested (login → meditate → journal → paywall)
8. [ ] Monitoring or at least log review plan
9. [ ] Export compliance + TestFlight build processing
10. [ ] Someone has read `backend/server.py` auth + premium paths

---

## How to re-run this checklist

```bash
# Deploy preview API
./scripts/deploy-aws.sh code

# Automated evidence
source backend/.venv/bin/activate
pytest tests/backend/ -v --junitxml=tests/reports/pytest/full_backend.xml
cd frontend && npx tsc --noEmit && npm audit

# Optional: secret scan + report under tests/reports/checklist/
```

Update `tests/PRODUCTION_READINESS_REPORT.md` after each major pass.
