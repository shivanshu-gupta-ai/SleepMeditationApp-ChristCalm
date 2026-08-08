# Testing the current app

This guide covers the implemented Expo + FastAPI reference app. The release-wide checklist is [`../../tests/test_list.md`](../../tests/test_list.md); test file layout and report commands are in [`../../tests/README.md`](../../tests/README.md).

## Fast local checks

```bash
# Backend unit/integration suite
pytest tests/backend/ -v

# Frontend type safety
cd frontend
npx tsc --noEmit
npx eslint .
```

Tests that call a deployed API read `EXPO_PUBLIC_BACKEND_URL` from `frontend/.env`. Refresh public configuration with `./scripts/sync-env-from-aws.sh` (owner) or `./scripts/sync-env-from-github.sh` (contributors). Backend secrets remain in SSM.

## Backend coverage

| Area | Main coverage |
|------|---------------|
| Cognito auth | Missing/invalid token rejection, user upsert, Apple-linked identity |
| Catalog/content | Emotions, meditations, completion, ratings, mood, journal, feedback |
| Wisdom | Guardrails, input validation, monthly quota, fallback behavior |
| Subscription | Client sync, webhook authentication, grant/revoke events |
| Security | User scoping, safe errors, rate limiting, health response |
| Performance | Warm catalog/API latency assertions |
| End to end | Authenticated user journey against the configured API |

For a fast offline subset:

```bash
pytest \
  tests/backend/test_wisdom_guardrails.py \
  tests/backend/test_rate_limit.py \
  tests/backend/test_llm_validation.py \
  tests/backend/test_ai_quota.py -v
```

## Manual product smoke

Use preview mode for content/layout QA, then repeat the paywall path in a native sandbox build with `EXPO_PUBLIC_UNLOCK_ALL=0`.

1. Fresh install: complete all 27 onboarding steps; verify Grace starts directly as a GIF with no PNG flash and remains proportionate at compact/tablet widths.
2. Verify each onboarding question keeps the heading and options visible without Grace crowding the screen.
3. Sign up/sign in with email; verify confirmation, forgot-password, reset, sign-out, and session restore. Test Apple separately when enabled.
4. As a non-premium native user, verify the post-auth hard gate blocks all main tabs; purchase or restore must lead to Home.
5. Test Home emotion selection → Meditate filter → player → complete → 1–5 star rating → Journey update.
6. Run SOS through at least one complete 4-7-8 cycle.
7. In Wisdom, test SSE text, a denied coding prompt, quota display, microphone upload/transcription, and non-stream fallback.
8. Create a typed and voice-transcribed Journal entry; share it to Wisdom; confirm another account cannot read it.
9. Submit Me feedback and verify no message body appears in analytics events.
10. Toggle light/dark themes and check compact phone, standard phone, tablet, reduced-motion, offline, and poor-network states.

## Subscription verification

The active catalog is:

| Package | Product |
|---------|---------|
| `$rc_monthly` | `cc_999_1m` |
| `$rc_annual` | `cc_5999_1y` |
| `$rc_custom_annual_mid` | `cc_3999_1y` |
| `$rc_custom_annual_low` | `cc_1999_1y` |

All grant `christcalm_premium`; no active product has a free trial. Run the laptop configuration smoke with:

```bash
python3 scripts/e2e/revenuecat_config_check.py
```

A physical iOS/Android device or store-distributed build is required for the real purchase sheet. Follow [`ios-sandbox-iap-manual.md`](ios-sandbox-iap-manual.md) for iOS. Repository policy requires asking the owner before creating any Expo/EAS build.

## Evidence and reports

Store generated results under `tests/reports/`:

```bash
mkdir -p tests/reports/pytest
pytest tests/backend/ -v --junitxml=tests/reports/pytest/pytest_results.xml
```

Do not commit credentials, local `.env` files, sandbox account passwords, or private user content in screenshots/logs.
