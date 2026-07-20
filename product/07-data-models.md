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
| `password_hash` | string? | Only if local email auth |
| `is_premium` | bool | Entitlement cache |
| `premium_plan` | string? | `monthly` / `annual` |
| `premium_expires_at` | datetime? | |
| `faith_journey` | string? | From onboarding |
| `concerns` | string[] | |
| `onboarding_data` | object | Full draft JSON |
| `onboarding_complete` | bool | |
| `streak` | int | Consecutive practice days |
| `minutes_meditated` | int | Lifetime |
| `practices_completed` | int | Lifetime |
| `ai_usage_month` | string? | `YYYY-MM` |
| `ai_usage_count` | int | Turns this month |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### Public user DTO (client)

Never return password hashes. Include premium flags + stats + name/email.

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
| `body` | string |
| `moods` | string[] |
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
| `duration_sec` | int? |
| `completed` | bool |
| `created_at` | datetime |

On complete:

1. Increment `practices_completed`  
2. Add minutes (from body or catalog duration)  
3. Update streak (if last practice was yesterday or today, extend; else reset to 1)  

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
User 1──* PaymentTransaction
Emotion 1──* Meditation (catalog)
PrayerCategory 1──* Prayer (catalog)
```
