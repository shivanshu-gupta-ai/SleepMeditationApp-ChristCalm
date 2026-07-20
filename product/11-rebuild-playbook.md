# Rebuild playbook (any language / stack)

Use this as the **implementation order** for an AI agent or human team rebuilding ChristCalm from the product pack alone.

---

## Choose a stack (examples)

| Layer | Option A | Option B | Option C |
|-------|----------|----------|----------|
| iOS client | SwiftUI | React Native | Flutter |
| Android | Jetpack Compose | React Native | Flutter |
| API | Vapor / Go | Node (Nest/Fastify) | Python FastAPI |
| DB | Postgres | DynamoDB | Firestore |
| Auth | Cognito | Auth0 / Clerk | Firebase Auth |
| AI | OpenAI | Bedrock | Gemini / local |
| Payments | RevenueCat | StoreKit+Play Billing | Stripe (web) |

**Constraint:** Match `product/` contracts — not the reference folder names.

---

## Phase 0 — Foundations (1–2 days)

1. Read `01`–`05` and `README.md` of this pack.  
2. Create design tokens (colors, spacing, type) from [05-design-system.md](./05-design-system.md).  
3. Scaffold app shell: navigation (tabs + FAB + stack).  
4. Scaffold API project with health route.  
5. Copy AI corpus files into server resources.

**Exit:** Empty screens with correct chrome + theme toggle.

---

## Phase 1 — Content & Home path (core loop)

1. Implement static/catalog seed from [06-content-catalog.md](./06-content-catalog.md).  
2. API: `GET /emotions`, `/meditations`, `/meditations/{id}`, `/devotional/today`.  
3. Home UI: greeting, emotion grid, today’s word.  
4. Meditate list + emotion filter.  
5. Player: stream audio, show verse, complete event (local first).  

**Exit:** Anonymous or mock-user can filter emotion and finish a session.

**Acceptance**

- [ ] Every emotion shows only its exclusive tracks  
- [ ] Player shows correct Scripture  
- [ ] Complete increments local practices counter  

---

## Phase 2 — SOS & polish calm paths

1. SOS screen: 4-7-8 timer, pulse, rotating verses.  
2. Start Calm sheet from FAB.  
3. Empty states with Grace.  

**Exit:** Panic path works offline-capable for UI (verses local).

---

## Phase 3 — Auth & user data

1. Implement signup/signin + secure token storage.  
2. User model + `/auth/me`, `/auth/onboarding`.  
3. Journal CRUD.  
4. Mood log.  
5. Meditation complete persists streak/minutes.  
6. Profile stats + sign out.  

**Exit:** Two devices / reinstall keep journal when same account (if online).

---

## Phase 4 — Onboarding

1. Build all steps from [04-onboarding.md](./04-onboarding.md).  
2. Local draft persistence.  
3. Sync on auth.  
4. Gate first-run → onboarding once.  

**Exit:** New install walks Welcome → Home without paywall.

---

## Phase 5 — Wisdom AI

1. Guardrails module (deny/allow patterns).  
2. RAG over handbook.  
3. LLM call + fallback.  
4. Quota + rate limits.  
5. Wisdom UI + history.  
6. Optional voice: upload + STT.  

**Exit:** Emotional message gets pastoral reply; code request is denied.

---

## Phase 6 — Monetization

1. Integrate store SDK / RevenueCat.  
2. Paywall UI (Nest/Cooper dual cards).  
3. Soft paywall after first practice.  
4. Webhook + `/subscription/sync`.  
5. Premium gates.  

**Exit:** Sandbox purchase unlocks premium badge.

---

## Phase 7 — Analytics, hardening, ship

1. Event buffer + `/analytics/events`.  
2. Error states without leaking secrets.  
3. Accessibility pass.  
4. Performance: catalog cache.  
5. Privacy policy links.  
6. Store assets + review copy.  

---

## Screen build checklist

| Screen | Tokens | API | Done |
|--------|--------|-----|------|
| Onboarding | theme | onboarding POST | ☐ |
| Sign in / up | | auth | ☐ |
| Home | | emotions, devotional | ☐ |
| Meditate | | meditations | ☐ |
| Player | | complete | ☐ |
| SOS | local | — | ☐ |
| Wisdom | | chat, quota, history | ☐ |
| Journal | | journal | ☐ |
| Prayers | | prayers | ☐ |
| Profile | | me, subscription | ☐ |
| Paywall | | sync | ☐ |

---

## Automated acceptance tests (language-agnostic)

Write these as unit/integration tests in your stack:

1. **Exclusive tracks:** no meditation appears under two emotions.  
2. **Complete stats:** practices +1, minutes increase, streak logic for consecutive days.  
3. **Guardrail deny:** coding prompt → `allowed=false`, fixed copy.  
4. **Guardrail allow:** anxiety prompt → passes to model (mock LLM).  
5. **Auth:** invalid token → 401.  
6. **Quota:** exceeding monthly limit → 429 or structured error.  
7. **Webhook:** valid secret sets `is_premium`; invalid → 401.  
8. **Onboarding:** covenant requires acceptance before complete flag.  
9. **Analytics:** journal body never appears in event props.  
10. **Themes:** all semantic tokens resolve in light and dark.

---

## Agent prompt template

Paste when starting a greenfield rebuild:

```
You are rebuilding ChristCalm from the product pack in /product.
Stack: {YOUR_STACK}.
Follow product/README.md priority order.
Implement phases 0–6 from product/11-rebuild-playbook.md.
Do not invent fear-based monetization or clinical claims.
Use content IDs and API paths exactly from product/06 and product/08.
Ship dual theme Nest dark + Cooper light from product/05.
```

---

## What “done” looks like (demo script)

1. Fresh install → onboarding → covenant → Home  
2. Tap **Anxious** → open **Cast Your Cares** → play 30s → complete  
3. Soft paywall appears → dismiss  
4. Open SOS → one breathing cycle  
5. Wisdom: “I feel lonely tonight.” → pastoral reply with verse  
6. Journal a line with mood  
7. Profile shows practices ≥ 1  
8. Toggle light/dark — screens remain legible  

If all eight work, the rebuild matches the product.
