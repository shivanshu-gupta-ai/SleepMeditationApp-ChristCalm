# API contract

Base URL: `{BACKEND_URL}/api`  
Auth header: `Authorization: Bearer {access_token}`  
All JSON. Prefer ISO-8601 timestamps.  
Response header (optional): `X-Response-Time-Ms`

This contract is **stack-agnostic**. Implement with FastAPI, Express, Vapor, Spring, etc.

---

## Auth

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/auth/config` | No | Public client ids / flags |
| POST | `/auth/signup` | No | Email + password |
| POST | `/auth/signin` | No | Returns token + user |
| GET | `/auth/me` | Yes | Current user |
| POST | `/auth/onboarding` | Yes | Save onboarding draft |
| GET | `/auth/google/start` | No | OAuth start (if used) |
| GET | `/auth/google/callback` | No | OAuth callback |

### POST `/auth/signup`

```json
// request
{ "email": "a@b.com", "password": "…", "name": "Ada" }
// response
{ "token": "…", "user": { /* UserOut */ } }
```

Rate limit guidance: ~30 / 15 min / IP for signup & signin.

### POST `/auth/onboarding`

```json
{
  "name": "Ada",
  "faith_journey": "growing",
  "concerns": ["anxiety", "sleep"],
  "onboarding_data": { /* full draft */ }
}
```

---

## Catalog (public)

| Method | Path | Auth |
|--------|------|------|
| GET | `/emotions` | No |
| GET | `/meditations?emotion=` | No |
| GET | `/meditations/{id}` | No |
| GET | `/prayers?category=` | No |
| GET | `/devotional/today` | No |

Cache-Control recommended for catalog (e.g. 5 minutes).

### GET `/emotions`

```json
[
  { "id": "anxious", "label": "Anxious", "color": "#F4C77B", "emoji": "🌊" }
]
```

### GET `/meditations`

Optional query `emotion`. Returns array of meditation objects (see content-catalog).

### GET `/devotional/today`

```json
{
  "id": "dev-1",
  "verse": "…",
  "reference": "John 14:27",
  "reflection": "…"
}
```

---

## Mood & journal

| Method | Path | Auth |
|--------|------|------|
| POST | `/mood/log` | Yes |
| GET | `/mood/history` | Yes |
| POST | `/journal` | Yes |
| GET | `/journal` | Yes |

### POST `/mood/log`

```json
{ "emotion": "anxious", "note": "optional" }
```

### POST `/journal`

```json
{ "body": "Today I felt…", "moods": ["anxious", "hopeful"] }
```

---

## Meditations complete

| Method | Path | Auth |
|--------|------|------|
| POST | `/meditations/complete` | Yes |

```json
// request
{ "meditation_id": "med-anxious-shanti", "duration_sec": 600 }
// response: updated UserOut or { ok: true, user: … }
```

Server updates streak, minutes, practices_completed.

---

## Wisdom / AI

| Method | Path | Auth | Rate |
|--------|------|------|------|
| GET | `/wisdom/status` | No | Corpus/model diagnostic |
| GET | `/wisdom/quota` | Yes | Remaining monthly turns |
| POST | `/wisdom/chat` | Yes | **~12 / hour / user** (+ IP) |
| GET | `/wisdom/history` | Yes | Past turns |
| POST | `/wisdom/voice/presign` | Yes | Upload URL for audio |
| POST | `/wisdom/voice/transcribe` | Yes | Job → text |
| POST | `/ai/prayer` | Yes | Legacy alias → wisdom-style |
| GET | `/ai/prayers/history` | Yes | Legacy |

### POST `/wisdom/chat`

```json
// request
{ "message": "I feel anxious about tomorrow." }
// response
{
  "reply": "…",
  "allowed": true,
  "quota": { "used": 3, "limit": 100, "remaining": 97 }
}
```

If guardrail blocks:

```json
{
  "reply": "Please share an emotional concern. Wisdom is here to walk with you…",
  "allowed": false
}
```

### GET `/wisdom/quota`

```json
{ "used": 3, "limit": 100, "remaining": 97, "month": "2026-07" }
```

---

## Subscriptions

| Method | Path | Auth |
|--------|------|------|
| POST | `/subscription/sync` | Yes |
| GET | `/subscription/status` | Yes |
| POST | `/revenuecat/webhook` | Webhook secret |

### Entitlement id

`christcalm_premium` (configurable)

### Product ids (example)

- `christcalm_monthly`  
- `christcalm_annual`  

### POST `/subscription/sync`

Client posts active entitlement after purchase/restore; server sets `is_premium`.

### Webhook

Provider posts subscription lifecycle events. Authenticate with shared Bearer secret. Upsert premium flags + payment transactions.

---

## Analytics

| Method | Path | Auth |
|--------|------|------|
| POST | `/analytics/events` | Optional |
| GET | `/analytics/me` | Yes |
| GET | `/analytics/summary?days=7` | Yes |

### POST `/analytics/events`

```json
{
  "device_id": "…",
  "session_id": "…",
  "platform": "ios",
  "events": [
    { "id": "uuid", "name": "meditation_complete", "ts": "…", "props": { "meditation_id": "…" } }
  ]
}
```

---

## Health

| Method | Path | Auth |
|--------|------|------|
| GET | `/` or `/health` | No |

```json
{ "status": "ok" }
```

---

## Errors

| HTTP | Meaning |
|------|---------|
| 400 | Validation |
| 401 | Missing/invalid token |
| 403 | Forbidden / premium gate (if enforced server-side) |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error (no stack traces to client) |

```json
{ "detail": "Human-readable message" }
```

AI failures: friendly message, never raw provider errors.

---

## Security requirements

- Passwords: strong KDF (e.g. PBKDF2 100k+ / bcrypt / Argon2)  
- JWT or opaque tokens; store on device in secure storage  
- CORS allowlist for web clients  
- Secrets only on server (env / secret manager)  
- Webhook auth required in production  

---

## Performance expectations

| Class | p50 target |
|-------|------------|
| Catalog | &lt; 200 ms |
| Auth + DB | 100–400 ms |
| Wisdom LLM | 1–8 s |
| Cold start (serverless) | 1–3 s first hit |
