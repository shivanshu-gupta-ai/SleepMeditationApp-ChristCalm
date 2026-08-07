# ChristCalm — Complete product & engineering pack

**Last synced to code:** 2026-08-07 (Journey tab, light theme default, 27-step onboarding, streaming Wisdom, Apple auth).

**Single folder that explains everything** about ChristCalm: product, UX, design, content, API, AI, architecture, repo structure, deploy, config, and how to rebuild in **any language** (Swift, Kotlin, React Native, Flutter, web, …).

Implementation of the current Expo + FastAPI + AWS stack is documented in full. Treat **product behavior + contracts** as mandatory; treat **AWS/Expo paths** as the reference blueprint you may reimplement.

---

## How an AI agent should use this pack

1. Read this file.  
2. Follow docs **01 → 18** (or jump by need using the map below).  
3. When rebuilding: implement **behavior and contracts**, not framework names.  
4. Conflict priority:
   1. Vision & principles (01)  
   2. API + data contracts (07–08)  
   3. Screens, onboarding, design (03–05)  
   4. Content catalog (06)  
   5. Architecture / repo of *this* monorepo (12–18)  
   6. Live code last  

### Definition of done (MVP)

User can: complete **27-step onboarding** (including escalating paywalls) → **auth** (email or Apple) → Home emotion → meditation complete → SOS → Wisdom (streaming + optional voice) → journal → **Journey** stats → soft paywall after first practice.

---

## Full document map

### Product & experience

| # | File | Contents |
|---|------|----------|
| 01 | [01-vision-and-principles.md](./01-vision-and-principles.md) | Vision, Grace, tone, non-negotiables |
| 02 | [02-product-requirements.md](./02-product-requirements.md) | MVP, personas, FR/NFR, roadmap |
| 03 | [03-user-flows-and-screens.md](./03-user-flows-and-screens.md) | IA, flows, wire layouts, empty states |
| 04 | [04-onboarding.md](./04-onboarding.md) | Every step, copy, options, draft model |
| 05 | [05-design-system.md](./05-design-system.md) | Nest/Cooper tokens, type, layout, UI kit |
| 06 | [06-content-catalog.md](./06-content-catalog.md) | Emotions, tracks, Scripture, prayers, devotionals |

### Data, API, AI, monetization

| # | File | Contents |
|---|------|----------|
| 07 | [07-data-models.md](./07-data-models.md) | Entities, fields, analytics, local keys |
| 08 | [08-api-contract.md](./08-api-contract.md) | Full HTTP API surface + errors |
| 09 | [09-ai-wisdom.md](./09-ai-wisdom.md) | RAG, guardrails, voice, quotas, prompt |
| 10 | [10-auth-and-monetization.md](./10-auth-and-monetization.md) | Cognito/auth methods, freemium, paywall |
| 11 | [11-rebuild-playbook.md](./11-rebuild-playbook.md) | Phase order, acceptance tests, agent prompt |

### Architecture, repo, ops (full engineering detail)

| # | File | Contents |
|---|------|----------|
| 12 | [12-repository-structure.md](./12-repository-structure.md) | Full monorepo tree, domain map, FE/BE file lists |
| 13 | [13-system-architecture.md](./13-system-architecture.md) | Logical + AWS diagrams, request flows, tables, ADRs |
| 14 | [14-frontend-architecture.md](./14-frontend-architecture.md) | Expo navigation, modules, theme, API client, media |
| 15 | [15-backend-architecture.md](./15-backend-architecture.md) | FastAPI modules, routes, AI pipeline, config load |
| 16 | [16-infrastructure-and-deploy.md](./16-infrastructure-and-deploy.md) | Terraform resources, bootstrap, deploy, rollback |
| 17 | [17-config-secrets-and-scripts.md](./17-config-secrets-and-scripts.md) | SSM, env templates, every script, auth ops |
| 18 | [18-testing-ops-and-scalability.md](./18-testing-ops-and-scalability.md) | Tests, analytics, scale runbook, incidents |

### Supporting corpus (ship with backend)

| Path | Role |
|------|------|
| [`../../backend/ai/corpus/jesus_voice.md`](../../backend/ai/corpus/jesus_voice.md) | Pastoral voice rules |
| [`../../backend/ai/corpus/Wisdom_Handbook.md`](../../backend/ai/corpus/Wisdom_Handbook.md) | RAG handbook |

---

## Product one-liner

**ChristCalm** — Christian faith-based mental wellness: emotion-first calm + Scripture-anchored meditation, prayer, SOS, and conversational Wisdom. Safe, reverent, premium. Value-first monetization.

## Core loop

```
Open → “How do you feel?” → Meditation (or SOS / Wisdom)
     → Complete practice → progress + soft paywall
```

## Feature modules (current product)

| Module | Job | Nav |
|--------|-----|-----|
| Onboarding | 27 steps: personalize → insight → loss/hope → commitment → escalating paywalls → how it works | `/onboarding` |
| Auth | Email + password; **Sign in with Apple** (Cognito Hosted UI) | `/(auth)/*` |
| Home | Stage-aware greeting, Today’s Path, emotions, today’s word, quick paths | Tab |
| Meditate | Emotion filter + session cards → full-screen player | Tab |
| Wisdom | Guardrailed RAG chat (**SSE stream** + optional voice) | Tab |
| Journey | Practice recognition: ranges, chart, breakdown, recent sessions | Tab (`stats`) |
| Me | Account, plan, theme, links to Journey / Journal / SOS | Tab (`profile`) |
| Journal | Mood + text + voice-to-text; open from Me / Home | Hidden tab |
| SOS | 4-7-8 breathing + rotating verses | Modal `/sos` |
| Paywall | Onboarding ladder + in-app modal + soft after first practice | Modal `/paywall` |
| Prayers | Catalog API still ships; **UI deferred** (hidden tab) | Deferred |

**Visible tabs:** Home · Meditate · Wisdom · Journey · Me (+ center **Start Calm** FAB).

---

## Reference stack (this repo)

| Layer | Choice |
|-------|--------|
| Client | Expo 54 · React Native · TypeScript · Expo Router |
| API | FastAPI + Mangum on AWS Lambda (`backend/api/routes/*`) |
| Edge | API Gateway HTTP API |
| Data | DynamoDB (on-demand) |
| Auth | Amazon Cognito (email + **Apple**; Google IdP optional in infra only) |
| AI | Amazon Bedrock Converse + multi-model fallback |
| Voice | S3 + Amazon Transcribe |
| Payments | RevenueCat (`christcalm_premium`) |
| Secrets | SSM Parameter Store |
| IaC | Terraform |
| CI package | CodeBuild (`config/ci/buildspec.yml`) |

Any equivalent stack is valid if **01–11** are satisfied.

---

## Repo map (one glance)

```
ChristCalmApp/
├── docs/              ★ Documentation hub
│   ├── product/       ★ You are here — complete product pack (01–18)
│   ├── architecture/  Stack notes + links to product 12–18
│   ├── engineering/   Testing, RevenueCat, ops for this repo
│   └── screenshots/   Generated screen catalog PDF
├── frontend/          Expo app (features: auth · onboarding · stats · subscriptions)
├── backend/           FastAPI + api/routes + AI corpus
├── infrastructure/    Terraform AWS
├── config/            Env templates, auth, buildspec
├── assets/            Meditation media sources (audio gitignored)
├── scripts/           deploy, preview, sync, bootstrap
└── tests/             Pytest (reports local-only)
```

Detail: [12-repository-structure.md](./12-repository-structure.md) · Docs hub: [../README.md](../README.md)

---

## Operator quick links

| Task | Command / doc |
|------|----------------|
| New AWS account | `./scripts/bootstrap-new-account.sh` → [16](./16-infrastructure-and-deploy.md) |
| Deploy API code | `./scripts/deploy-aws.sh code` |
| Local UI preview | `./scripts/preview.sh` → http://localhost:8081 |
| Local API | `./scripts/run-backend-local.sh` |
| Secrets model | [17](./17-config-secrets-and-scripts.md) |
| Rebuild greenfield | [11](./11-rebuild-playbook.md) |

---

## Agent prompt (full rebuild)

```
You are rebuilding ChristCalm using only the docs in docs/product (01–18).
Stack: {YOUR_STACK}.

1. Follow product principles in 01 and MVP in 02.
2. Implement screens from 03–04 and design tokens from 05.
3. Use content IDs from 06 and data shapes from 07.
4. Implement API from 08; Wisdom rules from 09; auth/paywall from 10.
5. Use 11 for phased delivery and acceptance tests.
6. If mirroring this monorepo, use 12–18 for structure, AWS architecture, and ops.
7. Never invent fear-based monetization or clinical claims.
```

---

## What lives outside this pack

| Path | Why separate |
|------|----------------|
| Live source code | Implementation; prefer product contracts if docs and code diverge temporarily |
| `docs/architecture/`, `docs/engineering/` | Stack notes + redirects into this pack |
| `terraform.tfstate` / secrets | Never document real secrets here |
| `node_modules` / `.venv` | Generated |
