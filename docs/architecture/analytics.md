# Product usage analytics

Events flow: app `track()` → local buffer → `POST /api/analytics/events` → DynamoDB.

## Tables

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

## Client

`frontend/src/utils/analytics.ts` — `track`, `flushAnalytics`, `startAnalytics` (root layout).

## API

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/analytics/events` | Optional |
| GET | `/api/analytics/me` | Required |
| GET | `/api/analytics/summary?days=7` | Required |

## Analyze

- Console: DynamoDB → `…-usage-daily` → query `day = YYYY-MM-DD`  
- API: `GET /api/analytics/summary` with JWT  

## Privacy

- No journal body text in props  
- Scalar props only  
- 90-day TTL on raw events  
