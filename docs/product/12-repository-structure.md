# Repository structure (reference implementation)

This is the **current ChristCalm monorepo** layout.  
When rebuilding in another language, mirror the **domains** (auth, AI, content, payments) — folder names can change.

Root path: `ChristCalmApp/` (also published as SleepMeditationApp-ChristCalm).

---

## Top-level tree

```
ChristCalmApp/
├── docs/                         # ★ Documentation hub
│   ├── product/                  # Canonical product + architecture pack (this folder)
│   ├── design/                   # Design redirects → product/03–05
│   ├── architecture/             # Stack notes → product/12–18
│   └── engineering/              # Testing, RevenueCat, ops
├── README.md                     # Quick start + links into docs/product/
│
├── frontend/                     # Mobile/web client (Expo Router + React Native)
│   ├── app/                      # File-based routes only
│   ├── src/                      # Features, UI kit, theme, API client
│   ├── assets/                   # Bundled images, Grace, meditation covers
│   ├── scripts/                  # cmd-guard, sync-shims
│   ├── package.json
│   ├── app.json                  # Expo config
│   ├── metro.config.js
│   ├── babel.config.js
│   └── tsconfig.json
│
├── backend/                      # FastAPI API (local uvicorn OR Lambda via Mangum)
│   ├── server.py                 # Routes, middleware, models
│   ├── handler.py                # Lambda entry (Mangum)
│   ├── seed_data.py              # Emotions, meditations, prayers, devotionals
│   ├── requirements.txt          # Local / full deps
│   ├── requirements-lambda.txt   # Slim Lambda package deps
│   ├── auth/                     # Cognito JWT validation, user upsert
│   ├── ai/                       # LLM, RAG, guardrails, voice, corpus/
│   │   └── corpus/
│   │       ├── Wisdom_Handbook.md
│   │       ├── jesus_voice.md
│   │       └── README.md
│   ├── core/                     # Config bootstrap, rate limits
│   └── data/                     # DynamoDB access layer
│
├── infrastructure/terraform/     # AWS IaC
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── dynamodb.tf
│   ├── lambda.tf
│   ├── cognito.tf
│   ├── cognito_triggers.tf
│   ├── codebuild.tf
│   ├── ssm.tf
│   ├── voice.tf
│   ├── terraform.tfvars.example
│   └── lambda_stub/              # Placeholder until first code deploy
│
├── config/                       # Env templates, auth how-to, CI
│   ├── env/
│   │   ├── backend.env.example
│   │   ├── frontend.env.example
│   │   └── integrations.env.example
│   ├── auth/
│   │   ├── README.md
│   │   ├── env.example
│   │   └── revenuecat.example.json
│   ├── ci/buildspec.yml          # CodeBuild → Lambda zip
│   ├── API_REQUIREMENTS.md
│   └── README.md
│
├── assets/meditations/           # Source media (not always bundled)
│   ├── covers/                   # One unique .jpg per track
│   └── audio/                    # Source audio → S3 in production
│
├── scripts/                      # Operator tooling
│   ├── bootstrap-new-account.sh
│   ├── deploy-aws.sh
│   ├── preview.sh
│   ├── run-backend-local.sh
│   ├── sync-env-from-aws.sh
│   ├── setup-config.sh
│   ├── seed-test-user.sh
│   ├── seed-apple-ssm-once.sh
│   ├── check-bedrock-models.sh
│   ├── sync-meditation-covers.sh
│   ├── build-lambda.sh
│   └── lib/aws-auth.sh
│
├── tests/                        # Pytest (backend)
│   ├── backend/
│   ├── conftest.py
│   └── README.md
│
├── skills/                       # Agent skills (ui-ux-pro-max)
├── .github/workflows/            # Optional CI hooks
└── pytest.ini
```

---

## Domain map (where concerns live)

| Concern | Path |
|---------|------|
| Product truth (any stack) | `docs/product/` |
| Client routes / screens | `frontend/app/` |
| Auth (client) | `frontend/src/features/auth/` |
| Subscriptions (client) | `frontend/src/features/subscriptions/` |
| Onboarding (navigator + screens) | `frontend/src/features/onboarding/` · [04-onboarding.md](./04-onboarding.md) |
| Design tokens | `frontend/src/theme/` |
| UI kit | `frontend/src/components/ui/` |
| HTTP client | `frontend/src/api/client.ts` |
| Analytics client | `frontend/src/utils/analytics.ts` |
| API routes | `backend/server.py` |
| Auth (server) | `backend/auth/cognito.py` |
| Wisdom AI | `backend/ai/*` + `backend/ai/corpus/` |
| Catalog seed | `backend/seed_data.py` |
| DynamoDB | `backend/data/dynamodb.py` |
| Rate limits | `backend/core/rate_limit.py` |
| Config load / SSM | `backend/core/config.py` |
| Infra | `infrastructure/terraform/` |
| Secrets layout | `config/` + SSM |
| Deploy / preview | `scripts/` |
| Tests | `tests/backend/` |

---

## Frontend detail

### Routes (`frontend/app/`)

| File | Screen |
|------|--------|
| `index.tsx` | Boot / redirect (auth, onboarding, home) |
| `_layout.tsx` | Root providers (theme, auth, revenuecat, fonts) |
| `onboarding.tsx` | Multi-step onboarding |
| `paywall.tsx` | Subscription paywall |
| `sos.tsx` | 4-7-8 panic relief |
| `wisdom.tsx` | Wisdom chat (AI companion) |
| `oauth.tsx` | OAuth return |
| `meditation/[id].tsx` | Full-screen player |
| `(tabs)/_layout.tsx` | Floating tab bar + FAB |
| `(tabs)/home.tsx` | Home dashboard |
| `(tabs)/meditate.tsx` | Meditation library |
| `(tabs)/wisdom.tsx` | Wisdom chat |
| `(tabs)/journal.tsx` | Journal |
| `(tabs)/prayers.tsx` | Prayer library |
| `(tabs)/profile.tsx` | Profile / Me |
| `(auth)/sign-in.tsx` | Sign in |
| `(auth)/sign-up.tsx` | Sign up |
| `(auth)/confirm-email.tsx` | Email confirm |
| `(auth)/forgot-password.tsx` | Forgot password |
| `(auth)/reset-password.tsx` | Reset password |

### Source modules (`frontend/src/`)

```
src/
├── api/client.ts                 # Typed fetch wrappers → BACKEND_URL/api/*
├── components/
│   ├── BackButton.tsx
│   └── ui/                       # Design-system primitives (see list below)
├── constants/
│   ├── emotion-icons.ts
│   └── meditation-covers.ts      # Local cover map by track
├── context/
│   ├── ThemeContext.tsx          # light / dark / system
│   └── ViewportContext.tsx
├── features/
│   ├── auth/
│   │   ├── AuthContext.tsx
│   │   ├── cognito.ts            # Email + hosted UI / Apple / Google
│   │   └── components/
│   ├── onboarding/
│   │   ├── OnboardingNavigator.tsx  # Step machine (0–26)
│   │   ├── sequence.ts              # Design sequence + paywall rules
│   │   ├── types.ts
│   │   ├── constants.ts             # Option catalogs
│   │   ├── screens/                 # One component per design screen
│   │   └── components/              # ProgressBar, layout, Grace placeholders
│   └── subscriptions/
│       ├── RevenueCatContext.tsx
│       ├── use-premium.ts
│       └── constants.ts          # entitlement + product ids
├── hooks/
│   ├── use-app-fonts.ts
│   ├── use-icon-fonts.ts
│   ├── use-responsive.ts
│   └── use-safe-back.ts
├── theme/
│   ├── tokens.ts                 # Nest + Cooper color tokens
│   ├── layout.ts                 # Spacing rhythm
│   ├── fonts.ts
│   ├── primitives.ts
│   └── index.ts
└── utils/
    ├── analytics.ts
    ├── api-cache.ts              # Catalog cache ~5 min
    ├── meditation-audio.ts
    ├── onboarding-draft.ts
    ├── soft-paywall.ts
    ├── session-progress.ts
    ├── session-rating.ts
    ├── storage/                  # Secure + async storage (native/web)
    └── …
```

### UI kit files (`frontend/src/components/ui/`)

`BottomSheet`, `Button`, `Chip`, `EmotionFilter`, `EmptyState`, `ErrorState`, `FadeIn`, `FirstStepsChecklist`, `FloatingTabBar`, `JourneyStats`, `ListeningWave`, `LoadingState`, `PageHeader`, `PremiumBadge`, `PressableScale`, `ProgressRing`, `Screen`, `SectionHeader`, `StartCalmSheet`, `Surface`, `TextField`, `TodaysPath`

### Key client dependencies (reference)

| Package | Role |
|---------|------|
| `expo` ~54 | Runtime |
| `expo-router` | File routes |
| `expo-audio` | Meditation playback |
| `expo-secure-store` | Token storage |
| `expo-auth-session` / `expo-web-browser` | OAuth |
| `amazon-cognito-identity-js` | Email auth against Cognito |
| `@react-native-async-storage/async-storage` | Drafts, cache |
| `@expo-google-fonts/inter` | Typography |
| `@expo/vector-icons` | Ionicons |
| RevenueCat SDK (if linked) | IAP entitlements |

---

## Backend detail

```
backend/
├── server.py           # FastAPI app, all /api routes, Pydantic models
├── handler.py          # Mangum(app) for Lambda
├── seed_data.py        # In-memory catalog
├── auth/cognito.py     # Validate Cognito access token → user
├── ai/
│   ├── llm.py          # Bedrock Converse + model fallback chain
│   ├── wisdom_rag.py   # Chunk + retrieve handbook
│   ├── wisdom_guardrails.py
│   ├── voice_transcribe.py
│   └── corpus/*.md
├── core/
│   ├── config.py       # Load SSM secrets + env
│   └── rate_limit.py
└── data/dynamodb.py    # Table helpers, user CRUD, journal, etc.
```

### Module responsibilities

| Module | Responsibility |
|--------|----------------|
| `server.py` | HTTP surface, middleware (CORS, timing, catalog cache), orchestration |
| `auth/cognito.py` | JWT/Cognito GetUser, Dynamo upsert |
| `ai/llm.py` | Model invocation, fallbacks, system prompts |
| `ai/wisdom_rag.py` | Load corpus, retrieve passages |
| `ai/wisdom_guardrails.py` | Pre-LLM allow/deny |
| `ai/voice_transcribe.py` | S3 + Transcribe job helpers |
| `core/config.py` | `SSM_PREFIX` → secrets at cold start |
| `core/rate_limit.py` | Distributed / table-backed limits |
| `data/dynamodb.py` | All persistence |
| `seed_data.py` | Static catalog (no DB required) |

---

## Infrastructure files

| File | Creates / configures |
|------|----------------------|
| `main.tf` | Provider, naming, shared bits |
| `variables.tf` | Region, name_suffix, throttle, flags |
| `outputs.tf` | `api_url`, Cognito ids, prefixes |
| `dynamodb.tf` | users, journal, meditation-ratings, user-feedback, ai-prayers, mood, payments, rate-limits, usage-* |
| `lambda.tf` | Function, IAM (DynamoDB, SSM, Bedrock, S3, Transcribe), API GW |
| `cognito.tf` | User pool, app client, domain, Google/Apple IdP |
| `cognito_triggers.tf` | Optional triggers |
| `codebuild.tf` | Package pipeline for Lambda zip |
| `ssm.tf` | SecureString parameters |
| `voice.tf` | Voice upload bucket + policies |

Naming pattern with account isolation:

```
christcalm-dev-…
SSM: /christcalm-dev/*
Cognito domain: christcalm-dev
Media: christcalm-preview-media-<account_id>
```

---

## Scripts reference

| Script | Purpose |
|--------|---------|
| `bootstrap-new-account.sh` | One-shot new AWS account deploy |
| `deploy-aws.sh apply` | Terraform apply |
| `deploy-aws.sh code` | Package backend → CodeBuild → Lambda |
| `deploy-aws.sh deploy` | apply + code |
| `sync-env-from-aws.sh` | Write disposable public `frontend/.env` + backend flags |
| `preview.sh` | Sync env + `expo start --clear` |
| `run-backend-local.sh` | Local API loading secrets from SSM |
| `setup-config.sh` | Placeholder env if offline |
| `seed-test-user.sh` | Create `test@christcalm.dev` |
| `check-bedrock-models.sh` | Probe model access |
| `sync-meditation-covers.sh` | Copy covers → frontend assets |
| `seed-apple-ssm-once.sh` | Seed Apple secrets into SSM |

---

## Tests layout

```
tests/
├── conftest.py
├── README.md
└── backend/
    ├── backend_path.py
    ├── backend_test.py
    ├── cognito_helpers.py
    ├── test_ai_quota.py
    ├── test_apple_sign_in.py
    ├── test_cognito_auth.py
    ├── test_e2e_flow.py
    ├── test_llm_validation.py
    ├── test_performance.py
    ├── test_rate_limit.py
    ├── test_security.py
    ├── test_subscription.py
    └── test_wisdom_guardrails.py
```

---

## What is gitignored (typical)

- `frontend/node_modules/`, `frontend/.expo/`
- `backend/.venv/`, `__pycache__/`
- `infrastructure/terraform/.terraform/`, `*.tfstate*`, `terraform.tfvars`
- Local `.env` files (disposable; never commit secrets)
- OS / editor noise

---

## Rebuild mapping (other stacks)

| This repo | Generic equivalent |
|-----------|-------------------|
| `frontend/app/*` | App routes / screens |
| `frontend/src/features/*` | Domain modules |
| `frontend/src/theme` | Design tokens |
| `backend/server.py` | API router |
| `backend/ai` | AI service package |
| `backend/seed_data.py` | Content CMS or seed JSON |
| `infrastructure/terraform` | IaC of choice |
| `docs/product/` | Keep as-is — product truth |
