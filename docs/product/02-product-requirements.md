# Product requirements (MVP)

## Problem

People of faith often face anxiety, grief, loneliness, and sleepless nights, but many wellness apps are secular-only, and many Christian apps feel dated, guilt-heavy, or course-rigid. Users need **immediate calm** and **Scripture-rooted care** without shame.

## Solution

ChristCalm provides:

1. Emotion-filtered Scripture meditations with audio  
2. One-tap SOS breathing with verses  
3. Conversational Wisdom (RAG + LLM, streaming, guardrailed; optional voice)  
4. Private journal with mood (+ voice-to-text; optional Share with Wisdom)  
5. **Journey** progress (streak, minutes, sessions, charts — recognition, not shame)  
6. Conversion-first onboarding (27 steps + escalating paywalls) and a hard post-auth premium gate
7. Prayer **catalog** (API); dedicated Prayers UI is deferred in the reference app  

## Personas

| Persona | Need |
|---------|------|
| **Anxious professional** | 5–15 min reset midday; SOS for panic |
| **Night worrier** | Can’t sleep; needs long rest audio + Psalm 4:8 |
| **Grieving believer** | Gentle presence; not “be strong” platitudes |
| **Seeker** | Exploring faith; needs non-judgmental entry |
| **Deeply rooted** | Depth of Word + journal + wisdom chat |

## MVP feature list

### Must ship

| # | Feature | Acceptance |
|---|---------|------------|
| 1 | Onboarding (27 screens, design v3.1) | Completes; draft persisted; **escalating paywalls**; lands on auth, then the premium gate |
| 2 | Auth (email + Apple) | Session secure; `GET /auth/me` works |
| 3 | Home | Stage-aware greeting, emotions, SOS, path, today’s word, first-steps / JourneyStats |
| 4 | Meditate list + filter | Filter by emotion; cards show duration, Scripture |
| 5 | Meditation player | Play/pause, scrub, verse, complete → progress/rating; secondary soft paywall trigger remains |
| 6 | SOS | 4-7-8 cycles; start/pause; rotating verses |
| 7 | Wisdom chat | Text + **stream**; history; quota; guardrails |
| 8 | Journal | Create + list; mood tags; voice optional |
| 9 | **Journey** tab | Ranges, hero, chart, recent sessions |
| 10 | Me (Profile) | Name/plan, theme, subscription, links; **not** primary stats home |
| 11 | Monetization | Onboarding ladder + hard in-app gate; monthly + three annual SKUs via RevenueCat |
| 12 | Dual theme | **Light default**; dark opt-in |

### Should ship / shipped in reference

| Feature | Notes |
|---------|--------|
| Wisdom voice | Mic → S3 presign → Transcribe → chat/journal |
| Analytics events | Local buffer + `POST /analytics/events` (no journal/wisdom bodies) |
| Offline-ready covers | Bundle cover images client-side |
| First-steps checklist on Home | New-user stage |
| Prayers library UI | Catalog API yes; **tab deferred** |

### Won’t ship in MVP

- Community prayer walls  
- Live coaches  
- Full offline audio library downloads  
- Push notification campaigns  
- Clinical mental-health claims  
- Multiplayer / social feed  

## Functional requirements

### FR-Onboarding

- Full flow per [Onboarding-Design-Spec.md](./Onboarding-Design-Spec.md) / [04-onboarding.md](./04-onboarding.md): welcome → questions → insight → loss/hope → commitment → escalating paywalls → how the app works  
- Collect: name (optional), emotional states, faith stage, concerns, preferred time, desired support, age, intensity, commitment  
- Persist draft locally until authenticated, then sync to backend  
- In-flow escalating paywalls (full → 50% → 80%) with scarcity timers; soft paywall after first practice remains secondary  

### FR-Content

- Emotions are fixed catalog (see content-catalog)  
- Each meditation belongs to **exactly one** emotion  
- Each meditation has: id, title, subtitle, duration, scripture ref + verse, audio URL, cover, premium flag  
- Devotional: rotate or select daily item with verse + reflection  

### FR-Player

- Full-screen immersive (no tab bar)  
- On complete: update minutes + practices; celebration/soft feedback; may trigger soft paywall  

### FR-SOS

- Pattern: inhale 4s → hold 7s → exhale 8s  
- Smooth pulsing visual  
- Rotating Scripture  
- Cycle counter  

### FR-Wisdom

- Scope: emotional / spiritual concerns only  
- Deny coding, homework, generic utility, jailbreaks  
- RAG over handbook + Jesus-voice guide  
- Monthly free quota (default 100 turns; configurable)  
- Crisis language → urge professional/emergency help  

### FR-Journal

- Body text + optional mood tags  
- Per-user private  
- Never send journal body to analytics  

### FR-Auth & premium

- Bearer token on protected routes  
- Premium via store entitlements + webhook/sync  
- Client may support `UNLOCK_ALL` preview flag for demos  

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | Catalog endpoints &lt; 200ms typical; AI 1–8s |
| Security | Secrets not in client; Cognito owns password storage and policy |
| Privacy | Journal private; analytics scalar props only |
| Accessibility | Min touch 44pt; readable contrast both themes |
| i18n | English MVP; structure strings for later localization |
| Reliability | Wisdom has model fallback chain so users rarely see hard failure |

## Monetization summary

- **Model:** Freemium  
- **Free:** Core meditations/prayers (policy-configurable), SOS, limited Wisdom  
- **Premium:** Unlimited content, AI features, premium library, offline (future)  
- **Primary triggers:** onboarding ladder and post-auth hard gate
- **Secondary trigger:** post-practice resurfacing in preview/limited-access configurations
- **Plans:** $9.99 monthly; annual ladder at $59.99 / $39.99 / $19.99; no trial

## Roadmap (post-MVP)

1. Push: daily verse / streak reminders  
2. Offline audio downloads  
3. Deeper insights / progress charts  
4. Community prayer requests (moderated)  
5. Native polish (widgets, Live Activities, etc.)  
