# Analytics, behavior, and durable user data

ChristCalm separates **high-volume behavioral analytics** from **durable domain facts**. Mixing free-text feedback or journal content into usage events is avoided on purpose.

## Storage model (best practice for this stack)

| Layer | Tables | What goes here | Retention |
|-------|--------|----------------|-----------|
| **Behavioral analytics** | `usage-events`, `usage-daily` | Funnels, feature usage, session scalars | Raw ~90 days (TTL); daily rollups longer |
| **Domain facts** | `mood-logs`, `journal-entries`, `meditation-ratings`, `user-feedback` | Intentional user content & scores | Durable (no short TTL) |
| **User counters** | `users` item fields | `minutes_meditated`, streak, premium flags | Lifetime on user row |
| **Client buffer** | AsyncStorage | Pending analytics batch before flush | Device-only |

### Why not one big “events” table?

1. **Volume & cost** — every tab tap should TTL; feedback text should not.
2. **Privacy** — journal/feedback free-text must not land in analytics props.
3. **Query patterns** — product funnels use daily rollups; support reads feedback by user.
4. **Schema clarity** — ratings have `stars` + `meditation_id`; events are sparse name+props.

### What to put where

| Signal | Store as |
|--------|----------|
| `meditation_complete`, `tab_change`, `paywall_shown` | `usage-events` (+ daily rollup) |
| Session stars (1–5) after a practice | `meditation-ratings` **and** optional `meditation_rated` event (scalars only) |
| Me-tab product feedback (message body) | `user-feedback` **only** |
| Feedback submit count / category | `feedback_submit` analytics event with `{ category, stars }` — **no message** |
| Mood pick, journal save | Domain tables + optional analytics name only |
| DAU / event counts | `usage-daily` (`meta#totals`, `event#…`, `user#…`) |

```
App track() ──► local buffer ──► POST /analytics/events
                                      │
                                      ▼
                              usage-events (TTL 90d)
                                      │
                                      ▼
                              usage-daily (rollups)

Me FeedbackCard ──► POST /feedback ──► user-feedback (durable)
                 └─► track("feedback_submit", {category, stars})
```

## Behavioral analytics (existing)

Events flow: app `track()` → local buffer → `POST /api/analytics/events` → DynamoDB.

### Tables

| Table | Purpose |
|-------|---------|
| `{prefix}-usage-events` | Raw events (TTL ~90 days) |
| `{prefix}-usage-daily` | Daily rollups: per-event counts, DAU, totals |

### Raw item
- `user_id` — signed-in id or `anon:{device_id}`
- `sk` — `{iso_ts}#{event_id}`
- `event_name`, `day`, `platform`, `session_id`, `props`
- GSI: `day-index`, `event-day-index`

### Daily rollup
- `event#{name}` → count  
- `user#{user_id}` → DAU marker  
- `meta#totals` → `dau`, `events`

### Client

`frontend/src/utils/analytics.ts` — `track`, `flushAnalytics`, `startAnalytics` (root layout).

### API

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/analytics/events` | Optional |
| GET | `/api/analytics/me` | Required |
| GET | `/api/analytics/summary?days=7` | Required |

### Analyze

- Console: DynamoDB → `…-usage-daily` → query `day = YYYY-MM-DD`  
- API: `GET /api/analytics/summary` with JWT  

### Privacy (analytics)

- No journal body, feedback message, or prayer full text in props  
- Scalar props only  
- 90-day TTL on raw events  

---

## Domain: product feedback (Me tab)

| | |
|--|--|
| Table | `{prefix}-user-feedback` |
| Keys | `user_id` (hash) + `sk` = `{created_at}#{id}` |
| Fields | `id`, `category`, `message`, `stars?`, `platform`, `status`, `created_at` |
| API | `POST /api/feedback` (auth, rate-limited) · `GET /api/feedback` (own items) |
| UI | Profile → Support → **Share feedback** (`FeedbackCard`) |

Categories: `praise` · `suggestion` · `bug` · `spiritual` · `other`.

### Domain: meditation ratings

See product data model — `{prefix}-meditation-ratings` via `POST /api/meditations/rate`.

---

## Operating checklist

1. Ship new tables: `./scripts/deploy-aws.sh apply`  
2. Ship API: `./scripts/deploy-aws.sh code`  
3. Prefer **domain tables** for anything you will read in support or product research with free text.  
4. Prefer **usage-events** for “did the user do X?” counts and funnels.  
