# Auth & monetization

## Authentication

### Goals

- Secure sessions for personal data (journal, wisdom, stats)  
- Low-friction entry (email + social)  
- Tokens never logged; stored in **secure device storage**  

### Supported methods (current product)

| Method | Notes |
|--------|-------|
| Email + password | Cognito user pool; confirm email when required |
| **Sign in with Apple** | Cognito Hosted UI IdP + PKCE (`christcalm://oauth`); required when offering social on iOS |
| Google Sign In | **Not implemented** in the reference client (optional IdP only if you add it later) |

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
| Journey / practice stats | No | Yes | Yes |
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

| Plan | Canonical product id | Aliases | Display (fallback) |
|------|----------------------|---------|---------------------|
| Monthly | `cc_999_1m` | `christcalm_monthly`, `monthly` | ~$9.99/mo |
| Annual | `cc_1999_1y_1w0` | `christcalm_annual`, `annual`, `yearly` | ~$39.99/yr (highlighted) |

Entitlement: **`christcalm_premium`**. Offering: **`default`**.  
Prices are store-configured; app shows localized price strings from RevenueCat when packages load.

---

## Paywall UX

### When to show

1. **Primary conversion — onboarding ladder** (screens `paywallFull` → `paywall50` → `paywall80`) with persisted scarcity timers (12m / 5m / 3m)  
2. **Secondary:** Soft sheet after **first practice** (value-first, dismissible)  
3. Premium-gated item tap  
4. Me → Unlock Premium / Manage subscription  

### When NOT to show

- Blocking **SOS**  
- Replacing calm content with a hard wall on first open before any practice (outside onboarding)  

### Tone

- Warm, invitational, transparent on in-app modal  
- Onboarding uses time-limited offers (documented timers) — still clear pricing, Restore, and skip paths  
- Feature checklist, dual plan cards  
- Avoid fake “only 3 seats left” social-pressure copy  

### Soft vs hard

- Soft: dismissible after first practice  
- Hard: gate premium catalog items only  
- Onboarding ladder: primary monetization moment before auth

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
