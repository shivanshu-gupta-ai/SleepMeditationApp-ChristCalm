# 🕊️ ChristCalm

**Peace for anxious hearts. Presence for weary souls.**

A Christian faith-based mental wellness mobile app that blends the immediate calming of **Rootd** (panic-attack SOS) with the sacred, guided experience of **Abide** (Bible + prayer + meditation). Built with Expo (React Native), FastAPI, MongoDB, GPT-5.2 (Emergent Universal LLM Key), Stripe (Emergent-managed test key), and Emergent-managed Google OAuth.

> _“Come to me, all you who are weary and burdened, and I will give you rest.”_ — **Matthew 11:28**

---

## 📖 Table of Contents

1. [Features](#-features)
2. [Screenshots & Flow](#-screenshots--flow)
3. [Tech Stack](#-tech-stack)
4. [Repository Structure](#-repository-structure)
5. [Getting Started (Local Development)](#-getting-started-local-development)
6. [Environment Variables](#-environment-variables)
7. [Running the App](#-running-the-app)
8. [API Reference](#-api-reference)
9. [Database Schema](#-database-schema)
10. [Authentication Flows](#-authentication-flows)
11. [Third-Party Integrations](#-third-party-integrations)
12. [Content & Assets](#-content--assets)
13. [Testing](#-testing)
14. [Deployment](#-deployment)
15. [Design System](#-design-system)
16. [Roadmap](#-roadmap)
17. [Contributing](#-contributing)
18. [License & Attribution](#-license--attribution)

---

## ✨ Features

### Onboarding
- **5-step reverent onboarding** — Welcome (Matthew 11:28) → Name capture → Faith journey stage (seeking / new / growing / deeply rooted) → Concerns picker (anxiety, panic, stress, sleep, grief, loneliness, purpose, gratitude) → Ready state → account creation
- Animated progress bar, back navigation, per-step validation
- Concerns and faith stage are persisted server-side on first sign-in

### Authentication (Three Methods)
- **JWT email + password** (bcrypt hashing, 30-day token)
- **Google Sign-In** (Emergent-managed OAuth via `auth.emergentagent.com`) — auto-links to existing accounts by email
- Session persistence via `expo-secure-store` (encrypted native keychain / iOS Keychain / Android Keystore)

### Home Dashboard
- Contextual greeting ("Good morning / afternoon / evening") + user's name
- **SOS Panic-Relief card** — always visible, one-tap access to breathing exercises
- **"How are you feeling?"** — horizontal-scroll emotion chips (Anxious, Fearful, Sad, Overwhelmed, Lonely, Grateful, Joyful, Hopeful, Peaceful); tapping logs the mood and jumps into filtered meditations
- **Today's Devotional** — rotating scripture card (verse + reference + reflection)
- **AI Personal Prayer CTA** — hand-off into the GPT-5.2 prayer generator
- Premium badge or "Upgrade" pill based on `is_premium`

### Panic / SOS Screen
- **4-7-8 guided breathing** — animated pulsing circle (inhale 4s → hold 7s → exhale 8s)
- Rotating scripture verses (Psalm 46:10, 1 Peter 5:7, Philippians 4:6, Psalm 23:1)
- Cycle counter, pause / resume, gradient background

### Emotion-Based Meditation Library
- 10 scripture-anchored meditations across 9 emotions
- Filterable chip row (sticky, horizontal-scroll, no wrap)
- Each card: cover image, scripture reference, verse, duration, premium tag
- **Player screen**: blurred cover background, pulsing artwork, `expo-audio` playback, progress bar, play / pause, session-complete tracking (increments `minutes_meditated` server-side)

### Prayer Library + AI Prayer Generator
- 8 curated prayers across 5 categories (Morning, Evening, Anxiety, Gratitude, Healing)
- Tap-to-expand full prayer text; premium prayers route to paywall
- **AI Personal Prayer Generator** — user picks/types a feeling + optional context; GPT-5.2 (via Emergent Universal LLM Key) returns a warm, scripture-anchored ~140-word prayer ending in "Amen"
- All generated prayers are saved per-user for history

### Journal
- Mood-tagged (Grateful, Sad, Anxious, Peaceful, Overwhelmed, Hopeful) free-text entries
- Chronological list of past entries, per-user in MongoDB

### Profile
- Avatar (initial), name, email
- **Stats grid** — day streak, minutes meditated, sessions completed
- Menu: SOS shortcut, AI Prayer Generator, Manage Subscription, Sign Out
- Premium members see a gold "Premium Member" badge; free users see "Unlock Premium"

### Stripe Paywall
- **Monthly** $9.99 → 30 days premium
- **Annual** $59.99 → 365 days premium (highlighted with "SAVE 50%" badge, pre-selected for higher conversion)
- Feature list: unlimited meditations, AI prayer generator, full prayer library, guided audio, priority SOS, ad-free
- Hosted Stripe Checkout opened via `expo-web-browser`; on app foreground the paywall polls `/api/stripe/verify/{session_id}` and marks the user premium idempotently
- Uses `emergentintegrations.payments.stripe.checkout` (Emergent-managed test key — no personal Stripe account required)

---

## 📱 Screenshots & Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  ONBOARDING  │ ──► │  AUTH        │ ──► │  HOME TAB    │
│  5 steps     │     │  Email/Pwd   │     │  Greeting    │
│  (Matthew    │     │  OR Google   │     │  SOS card    │
│   11:28)     │     │              │     │  Emotions ►  │
└──────────────┘     └──────────────┘     │  Devotional  │
                                          └──────┬───────┘
                                                 │
              ┌───────────┬────────────┬─────────┼──────────┐
              ▼           ▼            ▼         ▼          ▼
         ┌────────┐  ┌─────────┐  ┌────────┐ ┌──────┐  ┌─────────┐
         │ SOS    │  │ Meditate│  │Prayers │ │Journal│ │ Profile │
         │ 4-7-8  │  │ /Player │  │ /AI    │ │ Entry │ │ /Paywall│
         └────────┘  └─────────┘  └────────┘ └──────┘  └─────────┘
```

---

## 🛠 Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `expo` | ~54 | React Native runtime + tooling |
| `expo-router` | ^6 | File-based navigation |
| `expo-audio` | ^1 | Meditation audio playback |
| `expo-web-browser` | ~15 | Stripe checkout + OAuth session |
| `expo-linking` | 8 | Deep-link handling for OAuth |
| `expo-secure-store` | 15 | Encrypted JWT storage |
| `expo-linear-gradient` | ~15 | Gradient backgrounds |
| `expo-splash-screen` | ~31 | Splash lifecycle |
| `react-native-safe-area-context` | 5 | Notch / home-indicator handling |
| `@expo/vector-icons` | ^15 | Ionicons |
| `@react-native-community/slider` | 5 | (future) audio scrub |

### Backend
| Package | Purpose |
|---|---|
| `fastapi` + `uvicorn` | ASGI web framework |
| `motor` | Async MongoDB driver |
| `pydantic` | Request/response validation |
| `bcrypt` | Password hashing |
| `pyjwt` | JWT issuance + verification |
| `httpx` | Async HTTP (Emergent OAuth verification) |
| `python-dotenv` | Env-file loading |
| `emergentintegrations` | GPT-5.2 chat + Emergent-managed Stripe checkout |

### Third-Party Services
- **OpenAI GPT-5.2** — via **Emergent Universal LLM Key**
- **Stripe** — via **Emergent-managed test key** (`sk_test_emergent`)
- **Emergent-managed Google OAuth** — `https://auth.emergentagent.com`
- **MongoDB** — local dev; MongoDB Atlas for prod (any URI works via `MONGO_URL`)

---

## 📂 Repository Structure

```
app/
├── backend/
│   ├── server.py              # FastAPI app — all /api routes
│   ├── seed_data.py           # Static content: emotions, meditations, prayers, devotionals
│   ├── requirements.txt
│   └── .env                   # MONGO_URL, DB_NAME, JWT_SECRET, EMERGENT_LLM_KEY, STRIPE_API_KEY
│
├── frontend/
│   ├── app/                   # expo-router file-based routes
│   │   ├── _layout.tsx        # Root layout — SafeAreaProvider, AuthProvider, icon prewarm
│   │   ├── index.tsx          # Redirect based on onboarding + auth state
│   │   ├── onboarding.tsx     # 5-step onboarding
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── sign-in.tsx
│   │   │   └── sign-up.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx    # Bottom tab bar
│   │   │   ├── home.tsx
│   │   │   ├── meditate.tsx
│   │   │   ├── prayers.tsx
│   │   │   ├── journal.tsx
│   │   │   └── profile.tsx
│   │   ├── meditation/
│   │   │   └── [id].tsx       # Audio player (dynamic route)
│   │   ├── sos.tsx            # 4-7-8 breathing screen
│   │   ├── ai-prayer.tsx      # GPT-5.2 prayer generator
│   │   └── paywall.tsx        # Stripe subscription paywall
│   │
│   ├── src/
│   │   ├── api/client.ts      # Fetch wrapper + typed api methods
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── components/
│   │   │   └── GoogleSignInButton.tsx
│   │   ├── theme/index.ts     # Colors, spacing, radius, shadows, fonts
│   │   ├── hooks/
│   │   │   └── use-icon-fonts.ts
│   │   └── utils/storage/     # storage abstraction (secure + async)
│   │
│   ├── assets/                # Splash + app icons
│   ├── app.json
│   ├── package.json
│   └── .env                   # EXPO_PACKAGER_PROXY_URL, EXPO_PUBLIC_BACKEND_URL, etc.
│
├── memory/
│   ├── PRD.md                 # Product requirements
│   └── test_credentials.md    # Seeded test accounts
│
├── tests/                     # Backend pytest suite (created by testing agent)
└── README.md                  # (this file)
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js** 20+ (LTS)
- **Yarn** 1.x
- **Python** 3.11+
- **MongoDB** 6+ running locally (or a MongoDB Atlas URI)
- **Expo Go** app on your phone (iOS or Android) for physical device testing

### 1. Clone the repository
```bash
git clone https://github.com/<your-org>/christcalm.git
cd christcalm
```

### 2. Backend setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                 # then fill in the values (see below)
```

### 3. Frontend setup
```bash
cd ../frontend
yarn install
cp .env.example .env                 # fill in the values
```

---

## 🔑 Environment Variables

### `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `christcalm_db` |
| `JWT_SECRET` | Secret for signing JWTs (rotate in prod) | `long-random-string` |
| `EMERGENT_LLM_KEY` | Emergent Universal LLM Key for GPT-5.2 | `sk-emergent-…` |
| `STRIPE_API_KEY` | Stripe key (Emergent test key or your own) | `sk_test_emergent` |

> ⚠️ **Never commit `.env` files.** They're in `.gitignore`. Use secrets management (Vercel, Railway, Doppler, GH Actions secrets, etc.) in production.

### `frontend/.env`

| Variable | Description |
|---|---|
| `EXPO_PACKAGER_PROXY_URL` | (managed by Expo dev tooling — do not edit) |
| `EXPO_PACKAGER_HOSTNAME` | (managed by Expo dev tooling — do not edit) |
| `EXPO_PUBLIC_BACKEND_URL` | Public HTTPS URL of the FastAPI backend (e.g. `https://api.your-app.com` in prod; the tunnel URL in dev) |

> `EXPO_PUBLIC_*` variables are bundled into the client — never put secrets here.

---

## ▶️ Running the App

### Local dev (two terminals)
```bash
# Terminal 1 — backend
cd backend && source .venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 — frontend
cd frontend
yarn start                            # opens Expo dev tools
# Then press: i (iOS), a (Android), or w (web)
```

Scan the QR code with **Expo Go** on your phone. Every save hot-reloads.

### One-command dev (with `supervisord` — as configured in this repo)
```bash
sudo supervisorctl start all          # starts backend, expo, mongodb
sudo supervisorctl status
```
Logs:
```bash
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/expo.err.log
```

---

## 🔌 API Reference

All routes are prefixed with **`/api`**. All authenticated routes expect `Authorization: Bearer <jwt>`.

### Auth
| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | `{name, email, password}` | Create JWT account (min 6-char password) |
| POST | `/api/auth/signin` | ❌ | `{email, password}` | Log in existing user |
| POST | `/api/auth/google` | ❌ | `{session_id}` | Exchange Emergent OAuth session for our JWT |
| GET | `/api/auth/me` | ✅ | — | Current user + premium status |
| POST | `/api/auth/onboarding` | ✅ | `{faith_journey, concerns[]}` | Save onboarding answers |

### Content
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/emotions` | ❌ | 9 emotion chips (id, label, color, emoji) |
| GET | `/api/meditations?emotion=` | ❌ | Meditation list (optionally filtered) |
| GET | `/api/meditations/{id}` | ❌ | Single meditation |
| POST | `/api/meditations/complete` | ✅ | Increment session stats |
| GET | `/api/prayers?category=` | ❌ | Prayer library + categories |
| GET | `/api/devotional/today` | ❌ | Daily devotional (rotates by day-of-year) |

### Mood & Journal
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/mood/log` | ✅ | Log an emotion selection |
| GET | `/api/mood/history` | ✅ | Recent 100 mood entries |
| POST | `/api/journal` | ✅ | Create journal entry (`content`, optional `mood`) |
| GET | `/api/journal` | ✅ | All entries |

### AI Prayer
| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/ai/prayer` | ✅ | `{feeling, context?}` | GPT-5.2 generates a scripture-anchored prayer |
| GET | `/api/ai/prayers/history` | ✅ | — | User's generated prayers |

### Stripe (Emergent-managed)
| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/stripe/checkout` | ✅ | `{plan: 'monthly'\|'annual', origin_url}` | Creates Stripe Checkout Session → returns `{url, session_id}` |
| GET | `/api/stripe/verify/{session_id}` | ✅ | — | Verifies payment status; idempotently grants premium |
| GET | `/api/subscription/status` | ✅ | — | Current subscription state |

Full request/response examples are in `backend/tests/`.

---

## 🗄 Database Schema

Collections in MongoDB. All records use a **custom `id: str(uuid.uuid4())`**; MongoDB's `_id` is always excluded from responses.

### `users`
```jsonc
{
  "id": "uuid",
  "name": "string",
  "email": "string (lowercased, unique)",
  "password_hash": "string | null",     // null for Google-only users
  "provider": "google | null",
  "picture": "string | null",           // from Google
  "is_premium": false,
  "premium_until": "ISO datetime | null",
  "plan": "monthly | annual | null",
  "faith_journey": "seeking | new | growing | deep | null",
  "concerns": ["anxiety", "sleep", ...],
  "streak": 0,
  "minutes_meditated": 0,
  "prayers_completed": 0,
  "created_at": "ISO",
  "last_login_at": "ISO"
}
```

### `mood_logs`
```jsonc
{ "id", "user_id", "emotion", "note", "created_at" }
```

### `journal_entries`
```jsonc
{ "id", "user_id", "mood", "content", "created_at" }
```

### `ai_prayers`
```jsonc
{ "id", "user_id", "feeling", "context", "prayer", "created_at" }
```

### `payment_transactions`
```jsonc
{
  "session_id", "user_id", "email",
  "plan", "amount", "currency", "days",
  "status", "payment_status", "amount_total",
  "premium_until", "created_at", "updated_at"
}
```

---

## 🔐 Authentication Flows

### JWT (Email/Password)
1. `POST /api/auth/signup` or `/signin`
2. Backend returns `{ token, user }`; token is a 30-day HS256 JWT with `sub: user_id`.
3. Frontend stores it in `expo-secure-store` under key `cc_token`.
4. Every authenticated request sends `Authorization: Bearer <token>`.
5. `AuthContext` restores it on cold start and calls `/api/auth/me` to hydrate the user.

### Google OAuth (Emergent-managed)
1. User taps **"Sign in with Google"**.
2. **Web**: `window.location.href = https://auth.emergentagent.com/?redirect=<origin>/`
   **Mobile**: `WebBrowser.openAuthSessionAsync(authUrl, Linking.createURL("auth"))`
3. User completes Google login on Emergent's hosted page.
4. Emergent redirects back with `#session_id=<opaque>` in the URL fragment (or via deep link on mobile).
5. `AuthContext` extracts `session_id`, POSTs to `/api/auth/google`.
6. Backend verifies with `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data` (X-Session-ID header), upserts the user by email, and issues our own JWT.
7. Frontend stores the JWT the same way as email/password auth — from here on everything is identical.

> No Google Cloud Console setup required — Emergent manages the OAuth client.

---

## 🔗 Third-Party Integrations

### OpenAI GPT-5.2 (via Emergent Universal LLM Key)
- Package: `emergentintegrations.llm.chat.LlmChat`
- Configured in `/api/ai/prayer` with a warm, pastoral system prompt (see `server.py`)
- Cost: charged against your Emergent Universal Key balance — top up at Profile → Universal Key in the Emergent dashboard

### Stripe (via Emergent-managed test key)
- Package: `emergentintegrations.payments.stripe.checkout.StripeCheckout`
- **One-time payment mode** — Emergent's test key doesn't support subscription mode. We simulate subscriptions by granting **N days of premium** per successful payment (30 for monthly, 365 for annual).
- To use your own real Stripe account:
  1. Replace `STRIPE_API_KEY` in `backend/.env` with your `sk_live_...` or `sk_test_...`.
  2. Optionally, switch to native subscription mode via the raw `stripe` SDK (see `stripe.checkout.Session.create` docs) if you want auto-renewal.

### Emergent Google OAuth
- Zero-config. Requires only the redirect URL in the query string.
- Production requirement: your app's origin must be resolvable to a real HTTPS URL (Expo tunnel URL works during dev).

---

## 🖼 Content & Assets

- **Meditations, prayers, devotionals, emotions** — all seeded in `backend/seed_data.py`. Edit that file to add/remove content; no DB migration needed.
- **Cover images** — sourced from Unsplash (via `images.unsplash.com`), curated for calming spiritual aesthetics.
- **Meditation audio** — placeholder tracks from Pixabay's free-license library. Swap the `audio_url` on each meditation with your own MP3s in production.
- **App icons & splash** — in `frontend/assets/`. Replace `icon.png` and `splash-icon.png` with your brand assets before publishing.

---

## 🧪 Testing

### Backend (pytest)
```bash
cd backend
pytest tests/ -v
```
Covers auth (signup, signin, me, Google auth), all content endpoints, mood/journal CRUD, meditation completion tracking, AI prayer generation (real GPT-5.2 call), and Stripe checkout + verify.

### Frontend
Manual + Playwright-driven E2E tests via the built-in `testing_agent`. `testID` props are added to every interactive and key informational element in kebab-case (`login-submit-button`, `emotion-chip-anxious`, etc.) for reliable selection.

### Test credentials
See [`memory/test_credentials.md`](./memory/test_credentials.md):
- Email: `test@christcalm.app`
- Password: `password123`

---

## 🚢 Deployment

### Recommended (Emergent platform)
1. Click the **Publish** button (top-right of the Emergent editor).
2. Your backend, frontend, and MongoDB are deployed to a managed URL.
3. Trigger an iOS / Android build from the publish panel — provide App Store Connect / Google Play Console credentials.

### Manual (Vercel + Render + Atlas)
- **Backend** → Render (Docker or native Python service). Set env vars in dashboard.
- **Database** → MongoDB Atlas free tier. Update `MONGO_URL`.
- **Frontend** → build with EAS (`eas build --platform ios/android`) or Expo's `expo publish` for OTA updates.
- **Web preview** → `yarn build:web` produces a static bundle deployable to Vercel/Netlify.

> Update `EXPO_PUBLIC_BACKEND_URL` in `frontend/.env` to point at your deployed backend before building the mobile bundle.

---

## 🎨 Design System

Living tokens are in [`frontend/src/theme/index.ts`](./frontend/src/theme/index.ts):

| Token | Value | Use |
|---|---|---|
| `colors.background` | `#F9F7F1` | Warm parchment background |
| `colors.primary` | `#5B9BA5` | Calming teal for CTAs |
| `colors.accentSOS` | `#D27D78` | Muted coral — used sparingly for panic-relief affordances |
| `colors.premium` | `#D4AF37` | Sacred gold for premium badges |
| `colors.textPrimary` | `#1F2937` | Body text |
| `radius.full` | `999` | Pill buttons |
| `spacing.xs–xxl` | `4 / 8 / 16 / 24 / 32 / 48` | 8-pt grid |

**Typography** falls back to system fonts (`System` / `sans-serif`, `Georgia` / `serif` for scripture) for reliability in Expo Go — swap in `expo-font` with your licensed brand fonts before production.

Detailed guidelines: [`design_guidelines.json`](./design_guidelines.json).

---

## 🗺 Roadmap

- [ ] Phone-number OTP sign-in (Twilio Verify)
- [ ] Streak-freeze + daily-verse push notifications (requires deployed native build + Firebase key)
- [ ] Guided narrated meditations (ElevenLabs voice)
- [ ] Community prayer requests / prayer wall
- [ ] Offline meditation download
- [ ] Apple Watch companion (breathing complications)
- [ ] Native RevenueCat integration (auto-renewing subscriptions on App Store / Play)
- [ ] Multi-language support (Spanish, Portuguese, Korean)
- [ ] Verse-a-day widget

---

## 🤝 Contributing

1. Fork the repo & create a feature branch: `git checkout -b feature/amazing`.
2. Follow the code style — TypeScript strict mode on frontend, `black` + `ruff` on backend.
3. Every interactive UI element **must** have a `testID` (kebab-case, describes function not appearance).
4. Add / update tests for any new endpoint or flow.
5. Run linters before pushing:
   ```bash
   # frontend
   cd frontend && yarn lint
   # backend
   cd backend && ruff check . && black --check .
   ```
6. Open a PR with a clear description and screenshots of any UI changes.

### Commit convention
We use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

---

## 📜 License & Attribution

**License:** MIT (add a `LICENSE` file when publishing).

**Attribution:**
- Scripture translations: NIV (public-domain quotations for meditation use). Verify licensing before commercial distribution.
- Cover imagery: [Unsplash](https://unsplash.com/license) (free for commercial use).
- Placeholder audio: [Pixabay](https://pixabay.com/service/license/) (free for commercial use).
- Icons: [Ionicons](https://ionic.io/ionicons) via `@expo/vector-icons` (MIT).

Inspired by (but not affiliated with):
- [Rootd](https://apps.apple.com/ca/app/rootd-panic-attacks-anxiety/id1289018369)
- [Abide](https://apps.apple.com/us/app/abide-bible-prayer-meditation/id726031617)

---

## 💌 Contact

- Product & partnerships: `hello@christcalm.app`
- Bug reports & feature requests: [GitHub Issues](https://github.com/<your-org>/christcalm/issues)

_“The Lord is close to the brokenhearted and saves those who are crushed in spirit.”_ — **Psalm 34:18**

**Built with 🕊 by the ChristCalm team, powered by [Emergent](https://emergent.sh).**
