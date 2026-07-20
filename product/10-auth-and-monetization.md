# Auth & monetization

## Authentication

### Goals

- Secure sessions for personal data (journal, wisdom, stats)  
- Low-friction entry (email + social)  
- Tokens never logged; stored in **secure device storage**  

### Supported methods (MVP)

| Method | Notes |
|--------|-------|
| Email + password | Server hashes password; returns access token |
| Apple Sign In | Required for many iOS apps with third-party login |
| Google Sign In | Optional but recommended |

Hosted UI / native SDK / custom forms are all fine if the **API contract** is met.

### Session

- Client sends `Authorization: Bearer …` on protected routes  
- On 401: clear session → sign-in  
- Optional refresh flow if provider supports it  

### Cognito / Auth0 / Firebase / custom

Any IdP is valid. Map provider `sub` → `User.id`. Upsert user row on first valid token.

### Local / preview

- Optional `UNLOCK_ALL=1` public flag to skip paywall gates for demos  
- Never ship production builds with unlock-all forced on  

---

## Authorization matrix

| Resource | Anonymous | Signed-in free | Premium |
|----------|-----------|----------------|---------|
| Emotions / meditations list | Yes | Yes | Yes |
| Play free meditation | Yes* | Yes | Yes |
| Premium meditation | Soft paywall | Soft paywall | Yes |
| SOS | Yes | Yes | Yes |
| Devotional | Yes | Yes | Yes |
| Journal R/W | No | Yes | Yes |
| Wisdom chat | No | Quota | Higher/unlimited |
| Profile stats | No | Yes | Yes |
| Complete meditation (stats) | No | Yes | Yes |

\*Anonymous play is product-optional; reference app often requires account for progress.

---

## Freemium model

### Free tier

- Core meditations and basic prayers (configurable)  
- SOS always available (safety)  
- Limited Wisdom monthly quota  
- Journal  

### Premium unlocks

- Unlimited / premium library  
- AI Wisdom / AI Prayer priority  
- Offline downloads (post-MVP)  
- Future priority features  

### Entitlement

- ID: `christcalm_premium`  
- Source of truth: App Store / Play via **RevenueCat** (or native StoreKit/Play Billing)  
- Server mirrors `is_premium` via webhook + client sync  

### Products

| Plan | Example product id | UX |
|------|--------------------|-----|
| Monthly | `christcalm_monthly` | ~$9.99/mo |
| Annual | `christcalm_annual` | ~$59.99/yr, highlighted |

Prices are store-configured; app shows localized price strings from the SDK.

---

## Paywall UX

### When to show

1. **Primary:** After user completes **first practice** (value-first)  
2. When tapping a premium-gated item  
3. From Profile → Manage subscription  

### When NOT to show

- During onboarding  
- Blocking SOS  
- On first app open before any calm  

### Tone

- Warm, invitational, transparent  
- Feature checklist, dual plan cards  
- Restore purchases + Not now  
- **No** fake countdown, fake “only 3 spots”, dark patterns  

### Soft vs hard

- Soft: dismissible sheet after first practice  
- Hard: gate on premium content only  

---

## Client purchase flow

```
Paywall → select plan → native purchase sheet
  → success → SDK entitlement active
  → POST /subscription/sync
  → refresh /auth/me
  → unlock UI
```

Restore:

```
Restore → SDK refresh → sync → unlock
```

---

## Server webhook flow

```
Store event → RevenueCat (or store) webhook
  → validate Authorization secret
  → map app_user_id → user
  → set is_premium / expires_at / plan
  → record payment transaction
```

Handle: initial purchase, renewal, cancellation, expiration, billing issues (grace as policy).

---

## Compliance notes

- Follow Apple/Google subscription guidelines (clear manage links, no misleading claims)  
- Religious content: no medical cure claims  
- Privacy policy should cover journal, AI messages, analytics  
- Account deletion path (post-MVP minimum: support email)  

---

## Config checklist

| Item | Where |
|------|-------|
| API base URL | Client public config |
| Cognito/IdP pool + client ids | Public + server |
| RevenueCat public SDK keys | Client public |
| Webhook shared secret | Server only |
| Entitlement + product ids | Client + server align |
| AI monthly limit | Server config |
