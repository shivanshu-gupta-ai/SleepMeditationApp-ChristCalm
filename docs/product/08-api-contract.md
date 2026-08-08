# API contract

Base URL: `{BACKEND_URL}/api`  
Auth header: `Authorization: Bearer {access_token}`  
All JSON. Prefer ISO-8601 timestamps.  
Response header (optional): `X-Response-Time-Ms`

This contract is **stack-agnostic**. Implement with FastAPI, Express, Vapor, Spring, etc.

---

## Auth

**Reference app:** Cognito handles email sign-up/sign-in and Apple Hosted UI on the **client**. The API validates Bearer JWTs and exposes user/config endpoints (no password endpoints on the API).

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/auth/config` | No | Public client ids / Apple-ready flags |
| GET | `/auth/me` | Yes | Current user |
| POST | `/auth/onboarding` | Yes | Save onboarding draft after sign-in |

Optional alternate stacks may implement password `signup`/`signin` on the API; this monorepo does **not**.

### POST `/auth/onboarding`

```json
{
  "display_name": "Ada",
  "faith_journey": "growing",
  "concerns": ["anxiety", "sleep"],
  "emotional_state": "anxious",
  "desired_support": ["peace", "sleep"],
  "preferred_time": "evening",
  "commitment_accepted": true,
  "commitment_date": "2026-08-08",
  "first_practices_done": [false, false, false]
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
{
  "emotions": [
    { "id": "anxious", "label": "Anxious", "color": "#F4C77B", "emoji": "🌊" }
  ]
}
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
{ "content": "Today I felt…", "mood": "anxious" }
```

---

## Meditations complete

| Method | Path | Auth |
|--------|------|------|
| POST | `/meditations/complete` | Yes |

```json
// request
{ "meditation_id": "med-anxious-shanti", "minutes": 10 }
// response
{ "ok": true, "minutes_meditated": 42 }
```

Server updates lifetime minutes, `prayers_completed`, and `last_activity`. The current client maintains its calendar-day streak locally and Journey uses the greater of local and server streak values.

---

## Meditation session rating

| Method | Path | Auth |
|--------|------|------|
| POST | `/meditations/rate` | Yes |
| GET | `/meditations/ratings` | Yes |

```json
// POST request
{ "meditation_id": "med-anxious-shanti", "stars": 5, "minutes": 10 }

// POST response
{
  "ok": true,
  "rating": {
    "id": "uuid",
    "user_id": "…",
    "meditation_id": "med-anxious-shanti",
    "stars": 5,
    "minutes": 10,
    "created_at": "2026-07-23T12:00:00+00:00"
  }
}

// GET response
{ "ratings": [ /* same rating objects, newest first */ ] }
```

`stars` must be an integer **1–5**. Server writes one DynamoDB row per submit for the authenticated user (`{prefix}-meditation-ratings`).

---

## Product feedback (Me tab)

| Method | Path | Auth |
|--------|------|------|
| POST | `/feedback` | Yes |
| GET | `/feedback` | Yes |

```json
// POST request
{
  "category": "suggestion",
  "message": "I would love evening reminders…",
  "stars": 5,
  "platform": "ios"
}

// POST response
{
  "ok": true,
  "feedback": {
    "id": "uuid",
    "category": "suggestion",
    "stars": 5,
    "created_at": "…",
    "status": "new"
  }
}

// GET response
{ "items": [ /* feedback rows for this user, newest first */ ] }
```

`category` ∈ `praise` | `suggestion` | `bug` | `spiritual` | `other`.  
Rate-limited per user (~12/hour). Message stored only in `{prefix}-user-feedback`.

---

## Wisdom / AI

| Method | Path | Auth | Rate |
|--------|------|------|------|
| GET | `/wisdom/status` | No | Corpus/model diagnostic |
| GET | `/wisdom/quota` | Yes | Remaining monthly turns |
| POST | `/wisdom/chat` | Yes | Full reply; **~12 / hour / user** burst |
| POST | `/wisdom/chat/stream` | Yes | **SSE** token stream (primary client path) |
| GET | `/wisdom/history` | Yes | Past turns |
| POST | `/wisdom/voice/presign` | Yes | Upload URL for audio |
| POST | `/wisdom/voice/transcribe` | Yes | Speech → text (counts toward AI quota) |

### POST `/wisdom/chat/stream`

Same body as `/wisdom/chat`. Response: `text/event-stream` with incremental content events (reference client accumulates deltas into the assistant bubble). Falls back to non-stream chat when unavailable.

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

### Active products and packages

| Package | Store product | Current US price |
|---------|---------------|------------------|
| `$rc_monthly` | `cc_999_1m` | $9.99/month |
| `$rc_annual` | `cc_5999_1y` | $59.99/year |
| `$rc_custom_annual_mid` | `cc_3999_1y` | $39.99/year |
| `$rc_custom_annual_low` | `cc_1999_1y` | $19.99/year |

Offering: `default`. Entitlement: `christcalm_premium`. There is currently **no free trial**.

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

- Cognito owns password storage and policy; the API has no password endpoints
- Store Cognito access/refresh tokens in platform secure storage
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
