# Code, security, performance, and testing review

**Reviewed:** 2026-08-08
**Scope:** Expo frontend, FastAPI Lambda backend, DynamoDB, Cognito, Bedrock, RevenueCat

This is a living review of the implemented reference app. Product behavior is defined in [`../product/`](../product/README.md); the production checklist is [`../../tests/test_list.md`](../../tests/test_list.md).

## Current posture

| Area | Status | Evidence / residual risk |
|------|--------|--------------------------|
| Architecture | Good | Serverless components and domain routers are clearly separated |
| Authentication | Good | Cognito email/password + optional Apple; protected routes use Cognito access tokens |
| Authorization | Good with follow-up | User data is keyed from the authenticated identity; keep premium rules enforced server-side where paid APIs require them |
| Secrets | Good | Private values live in SSM; Expo receives public configuration only |
| Abuse controls | Good | DynamoDB rate-limit buckets, API Gateway throttle, Wisdom monthly quota |
| AI safety | Good | Topic guardrails, bounded inputs, client-safe errors, non-Claude fallback chain |
| Payments | Good with device verification | RevenueCat entitlement + client sync + authenticated webhook; physical-device sandbox path remains mandatory before release |
| Privacy | Good with policy follow-up | Journal, Wisdom, and feedback bodies stay out of analytics; public privacy/account-deletion UX must match store policy |
| Test coverage | Good | Backend auth, security, quota, subscription, performance, and E2E tests; native purchase and accessibility remain manual |

## Security model

- Cognito owns password storage, confirmation, refresh tokens, and password policy. FastAPI exposes no signup/signin or local-JWT endpoints.
- The client stores Cognito tokens in platform secure storage and sends the access token as `Authorization: Bearer …`.
- Backend identity comes from token validation, never a client-supplied `user_id`.
- RevenueCat webhooks require the SSM-backed Authorization secret. Client sync improves immediacy but does not replace store entitlement events.
- DynamoDB is used for user-scoped content and shared rate counters. Analytics properties are scalar-only and exclude private text.
- CORS must remain an explicit production allowlist; localhost origins are included for development previews.

## Performance and resilience

| Operation | Expected behavior | Main constraint |
|-----------|-------------------|-----------------|
| Catalog | Fast, cacheable seed data | Lambda cold start |
| Auth/user data | Low hundreds of milliseconds warm | Cognito + DynamoDB round trips |
| Wisdom stream | Tokens arrive over SSE; non-stream request is the fallback | Bedrock model latency |
| Voice | Presign → S3 upload → Transcribe | Upload size and transcription time |
| Audio | Streams from configured media host; covers have bundled client assets | User network |

The Bedrock chain begins with `openai.gpt-oss-20b-1:0` and falls through Nova, Meta, Mistral, and DeepSeek models. Claude is intentionally excluded. Validate account access with `./scripts/check-bedrock-models.sh us-east-1`.

## Production checklist

- [ ] RevenueCat webhook Authorization is set and rotated when needed
- [ ] `EXPO_PUBLIC_UNLOCK_ALL=0` and an `appl_`/Android public key are baked into store builds
- [ ] All four active products resolve from offering `default`; no trial copy appears
- [ ] Fresh user completes onboarding → auth → hard premium gate
- [ ] Purchase, restore, expiry, and account switching pass on a physical sandbox device
- [ ] Apple Hosted UI callbacks pass for Sign in with Apple when enabled
- [ ] Wisdom text, SSE fallback, voice transcription, quota, and guardrail paths pass
- [ ] Journal, feedback, ratings, analytics, and subscription rows remain user-scoped
- [ ] CloudWatch alarms/log retention, DynamoDB recovery, privacy policy, and account deletion are release-ready

## Verification commands

```bash
pytest tests/backend/ -v
cd frontend && npx tsc --noEmit
python3 scripts/e2e/revenuecat_config_check.py
```

RevenueCat configuration checks are laptop-safe. A native build and physical device are still required for the real StoreKit purchase sheet; ask the repository owner before creating any Expo/EAS build.
