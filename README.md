# ChristCalm

Christian faith-based meditation & mental wellness app.

**Stack:** Expo (React Native) · FastAPI on AWS Lambda · DynamoDB · Bedrock Wisdom

---

## Where things live

```
ChristCalmApp/
├── README.md                 ← you are here
├── frontend/                 # Expo app (UI, theme, screens)
│   └── assets/
│       ├── images/           # App icon, splash, mascot
│       └── meditations/covers/  # Bundled cover images (synced from assets/)
├── backend/                  # FastAPI + Dynamo + LLM + voice
├── aws/terraform/            # API Gateway, Lambda, DynamoDB, CodeBuild
├── assets/                   # Content media you can replace by hand
│   ├── meditations/covers/   # ★ Meditation pictures (edit here)
│   ├── meditations/audio/    # Optional source audio
│   ├── audio/                # General audio uploads
│   └── design-reference/     # Research frames (not shipped)
├── docs/                     # ★ All product / design / architecture docs
│   ├── product/              # PRD
│   ├── design/               # Nest/Cooper system, colors, principles
│   ├── architecture/         # Stack, scale, analytics, review
│   └── engineering/          # Testing notes
├── config/                   # Env templates & auth placeholders
├── wisdom/                   # RAG corpus (handbook + voice)
├── scripts/                  # deploy, preview, sync-env
└── tests/                    # Backend pytest
```

### Docs map

| Need | Open |
|------|------|
| Product / PRD | [`docs/product/PRD.md`](docs/product/PRD.md) |
| Current UI design | [`docs/design/system.md`](docs/design/system.md) |
| Colors | [`docs/design/colors.md`](docs/design/colors.md) |
| Architecture | [`docs/architecture/overview.md`](docs/architecture/overview.md) |
| Scale & idle cost | [`docs/architecture/scalability.md`](docs/architecture/scalability.md) |
| Usage analytics | [`docs/architecture/analytics.md`](docs/architecture/analytics.md) |
| Testing | [`docs/engineering/testing.md`](docs/engineering/testing.md) |
| Config / secrets | [`config/README.md`](config/README.md) |
| **Docs index** | [`docs/README.md`](docs/README.md) |

### Change meditation pictures

1. Replace files in **`assets/meditations/covers/`** (`med-1.jpg` … `med-10.jpg`).  
2. Copy into the app bundle:

```bash
cp assets/meditations/covers/*.jpg frontend/assets/meditations/covers/
```

3. Restart Expo: `cd frontend && npx expo start --clear`  

Details: [`assets/meditations/covers/README.md`](assets/meditations/covers/README.md)

---

## Quick start

### 1. Configure

```bash
./scripts/setup-config.sh
./scripts/deploy-aws.sh apply      # first-time AWS infra
./scripts/sync-env-from-aws.sh     # API URL → frontend/.env
```

### 2. Deploy API changes

```bash
./scripts/deploy-aws.sh code       # CodeBuild → Lambda (no local Docker)
```

### 3. Preview app (API stays on AWS)

```bash
./scripts/preview.sh
# or: cd frontend && npx expo start --web --clear
```

## Test login

| Email | Password |
|-------|----------|
| `test@christcalm.dev` | `test1234` |

## Tests

```bash
pytest tests/backend/ -v
cd frontend && npx tsc --noEmit
```

## Design snapshot

- **Dark (default):** Nest — pure black, charcoal cards, violet + gold, gold FAB  
- **Light:** Cooper — cream-lavender, white cards, soft lavender + gold  
- **Type:** Inter  
- **Tokens:** `frontend/src/theme/`  

## Infrastructure notes

- Serverless (no Fargate required for normal growth)  
- Analytics → DynamoDB `usage-events` / `usage-daily`  
- Idle cost is near-zero; main future cost is Bedrock (Wisdom)  

See [`docs/architecture/`](docs/architecture/).
