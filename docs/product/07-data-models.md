# Data models

Storage engine is interchangeable (DynamoDB, Postgres, Mongo, SQLite, Firestore).  
**Fields and relationships** are the contract.

---

## User

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID/Cognito sub) | PK |
| `email` | string | Unique index |
| `name` | string | Display name |
| `is_premium` | bool | Entitlement cache |
| `subscription_tier` | string | Derived `free` / `premium` in API output |
| `plan` | string? | `monthly` / `annual` |
| `premium_until` | datetime? | RevenueCat expiry cache |
| `provider` | string? | Cognito identity provider |
| `faith_journey` | string? | From onboarding |
| `concerns` | string[] | |
| `emotional_state` | string? | From onboarding |
| `desired_support` | string[] | From onboarding |
| `preferred_time` | string? | From onboarding |
| `commitment_accepted` | bool | From onboarding |
| `commitment_date` | string? | From onboarding |
| `first_practices_done` | bool[] | Home first-steps state |
| `streak` | int | Consecutive practice days |
| `minutes_meditated` | int | Lifetime |
| `prayers_completed` | int | Lifetime completed practices (current API field name) |
| `ai_usage_month` | string? | `YYYY-MM` |
| `ai_usage_count` | int | Turns this month |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### Public user DTO (client)

Return identity, premium flags, onboarding profile, and aggregate stats only. Cognito credentials never enter this table or DTO.

---

## Mood log

| Field | Type |
|-------|------|
| `id` | string |
| `user_id` | string |
| `emotion` | string |
| `note` | string? |
| `created_at` | datetime |

---

## Journal entry

| Field | Type |
|-------|------|
| `id` | string |
| `user_id` | string |
| `content` | string |
| `mood` | string? |
| `created_at` | datetime |
| `updated_at` | datetime? |

**Privacy:** never log body text to analytics.

---

## AI prayer / Wisdom turn

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `user_id` | string | |
| `user_message` | string | |
| `assistant_message` | string | |
| `kind` | string | `wisdom` / `prayer` |
| `model_id` | string? | |
| `created_at` | datetime | |

History sorted newest-first or chronological by client preference.

---

## Meditation session completion

Either update user counters only, or also store:

| Field | Type |
|-------|------|
| `id` | string |
| `user_id` | string |
| `meditation_id` | string |
| `minutes` | int |
| `completed` | bool |
| `created_at` | datetime |

On complete:

1. Increment `prayers_completed` (the current practice-count field)
2. Add submitted minutes and set `last_activity`
3. Update the calendar-day streak in client storage (`session-progress.ts`); Journey takes the maximum of local and server streak values

---

## Meditation session rating

Every completed practice may collect a **1–5 star** rating. Persist **per user** in DynamoDB (not device-only) so ratings survive reinstall and can be analyzed.

Table: `{prefix}-meditation-ratings` · keys: `user_id` (hash) + `sk` = `{created_at}#{id}` (range)

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | UUID |
| `user_id` | string | Authenticated user |
| `meditation_id` | string | Catalog track id |
| `stars` | int | 1–5 |
| `minutes` | int? | Optional session length |
| `created_at` | datetime | ISO-8601 UTC |

Each submit is a **new row** (re-listens can be rated again). Client may also cache last stars per `meditation_id` locally for UI.

---

## Product feedback (Me tab)

Intentional free-text feedback. **Durable domain table** — do **not** put message body into `usage-events`.

Table: `{prefix}-user-feedback` · keys: `user_id` + `sk` = `{created_at}#{id}`

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | UUID |
| `user_id` | string | Authenticated user |
| `category` | string | `praise` \| `suggestion` \| `bug` \| `spiritual` \| `other` |
| `message` | string | 3–2000 chars |
| `stars` | int? | Optional overall 1–5 |
| `platform` | string? | ios / android / web |
| `status` | string | e.g. `new` |
| `created_at` | datetime | ISO-8601 UTC |

Analytics companion (optional): event `feedback_submit` with props `{ category, stars }` only.

---

## Subscription / payment transaction

| Field | Type |
|-------|------|
| `id` | string |
| `user_id` | string? |
| `provider` | string | `revenuecat` |
| `event_type` | string |
| `product_id` | string? |
| `entitlement_active` | bool |
| `raw` | object? | Optional redacted payload |
| `created_at` | datetime |

---

## Rate limit bucket

| Field | Type |
|-------|------|
| `key` | string | e.g. `wisdom:{user_id}` |
| `window_start` | datetime / epoch |
| `count` | int |

Or use Redis equivalent.

---

## Analytics

### Raw event

| Field | Type |
|-------|------|
| `user_id` | string | or `anon:{device_id}` |
| `sk` | string | `{iso_ts}#{event_id}` |
| `event_name` | string |
| `day` | string | `YYYY-MM-DD` |
| `platform` | string | ios/android/web |
| `session_id` | string |
| `props` | object | **scalars only** |
| `ttl` | epoch | ~90 days |

### Daily rollup

Counts per `event#{name}`, DAU markers `user#{id}`, totals `meta#totals`.

### Suggested event names

| event_name | When |
|------------|------|
| `app_open` | Foreground |
| `onboarding_step` | Step index |
| `onboarding_complete` | Final CTA |
| `auth_sign_in` | Success |
| `emotion_select` | Home/meditate |
| `meditation_start` | Player open |
| `meditation_complete` | Finish |
| `meditation_rated` | 1–5 stars after session (also stored in DynamoDB) |
| `feedback_open` / `feedback_submit` | Me feedback UI (scalars only; body in user-feedback table) |
| `sos_start` / `sos_complete` | SOS |
| `wisdom_send` | User message |
| `journal_create` | Saved |
| `paywall_view` | Shown |
| `purchase_success` | Entitled |

Never include journal body, prayer full text dumps, or PII beyond opaque ids.

---

## Catalog (may be static)

Emotions, meditations, prayers, devotionals can be **code-seeded** (no DB) or CMS-backed.  
Reference app seeds in-memory from `seed_data`.

---

## Local client storage keys (suggested)

| Key | Content |
|-----|---------|
| session token | Secure storage only |
| `cc_onboarding_draft` | OnboardingDraft JSON |
| theme preference | `dark` / `light` / `system` |
| analytics buffer | pending events |
| catalog cache | emotions/meditations TTL ~5 min |
| soft paywall dismissed | bool / timestamp |

---

## Entity relationships

```
User 1──* MoodLog
User 1──* JournalEntry
User 1──* WisdomTurn
User 1──* MeditationCompletion
User 1──* MeditationRating
User 1──* ProductFeedback
User 1──* PaymentTransaction
Emotion 1──* Meditation (catalog)
PrayerCategory 1──* Prayer (catalog)
```
