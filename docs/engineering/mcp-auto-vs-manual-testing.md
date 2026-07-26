# MCP automation vs manual steps (ChristCalm)

**Purpose:** What we can automate with RevenueCat MCP, App Store Connect MCP, Expo MCP, and XcodeBuildMCP — vs what you must do by hand — to test in a local simulator and an App Store–like environment.

**Related**

- [prod-sandbox-release.md](./prod-sandbox-release.md) — preview vs sandbox vs store env flags  
- [ios-sandbox-iap-manual.md](./ios-sandbox-iap-manual.md) — device StoreKit sandbox  
- [ios-app-store-submit-manual.md](./ios-app-store-submit-manual.md) — public App Store submit  
- [tests/test_list.md](../../tests/test_list.md) — production readiness checklist  

**Fixed IDs**

| Item | Value |
|------|--------|
| ASC App | Christ Calm · `6788769964` |
| Bundle ID | `com.christcalm.app` |
| RC project | `proj43f1dce8` |
| RC iOS app | `app7793b2074c` |
| Entitlement | `christcalm_premium` |
| Offering | `default` |
| Products | `cc_999_1m` (monthly), `cc_1999_1y_1w0` (annual) |
| API | `https://u2r7gwyg3j.execute-api.us-east-1.amazonaws.com` |
| Expo project | `@shivanshu_here/christcalm` |

---

## Environments (“App Store–like”)

| Environment | Feels like store? | Real IAP? | Device needed? |
|-------------|-------------------|-----------|----------------|
| Expo web / Metro | UI + API only | No | No |
| iOS Simulator + Expo Go | Near-native UI | **No** real StoreKit | No (sim) |
| iOS Simulator + prebuild/dev client | Closer to app binary | Still **no** real IAP | No (sim) |
| Physical device + sandbox Apple ID | Yes | **Yes** (sandbox) | **Yes** |
| TestFlight | Production binary | Sandbox purchases | Yes |
| Public App Store | Real users | Real money | Yes |

**Rule:** Simulator is for UI + auth + API. Real paywall money path needs a **physical device** (or TestFlight on device).

---

## What each MCP can do

### RevenueCat MCP

| Can do | Cannot do |
|--------|-----------|
| List projects, products, entitlements, offerings, packages | Run StoreKit purchase UI |
| List public API keys (`appl_` / `test_`) | Create Apple sandbox testers |
| `get-product-store-state` (pricing, localizations, warnings) | Build/sign the Expo binary |
| Fix pricing (`set-product-store-state`, `equalize-subscription-prices`) | Force Apple receipt processing |
| Attach products to entitlement | Guarantee webhook delivery |
| Upload/reserve IAP review screenshots (with file bytes) | |
| Submit products to store when ASC allows | |
| Grant promo entitlement (not real StoreKit) | |
| List customer subscriptions after a buy | |

### App Store Connect MCP

| Can do | Cannot do |
|--------|-----------|
| List apps, get app info | Create distribution certs / profiles |
| Create app store version | Upload binary (use EAS) |
| Update version localization fields | Create sandbox Apple IDs |
| Beta groups / add testers | Full App Privacy / age rating UI |
| Beta feedback screenshots | Full “submit for review” package in one click |
| Sales / finance / analytics reports | |

### Expo MCP (`https://mcp.expo.dev/mcp`)

| Can do (after OAuth) | Local capabilities (need `expo-mcp` + sim) |
|----------------------|--------------------------------------------|
| Expo docs search/read | Screenshots of running app |
| `npx expo install` guidance | Tap / find by `testID` |
| EAS build list/status/logs | Open DevTools |
| EAS submit status | Expo Router sitemap |
| TestFlight crashes / feedback | |
| Workflow create/list/run | |

**Setup**

```bash
# Remote MCP is in ~/.grok/config.toml and .grok/config.toml
# Authenticate Expo account when Grok prompts OAuth.

cd frontend
npx expo install expo-mcp --dev   # already in project
npm run start:mcp                 # EXPO_UNSTABLE_MCP_SERVER=1 expo start
```

Reconnect MCP after starting/stopping Metro so local tools refresh.

### XcodeBuildMCP

| Can do | Cannot do |
|--------|-----------|
| List/boot simulators | Work without iOS runtime installed |
| Build/run native `ios/` project | Real StoreKit IAP |
| Screenshots, logs, launch | Expo managed flow without prebuild |

ChristCalm is **Expo managed** by default (no committed `ios/` until `expo prebuild`). Prefer `npx expo start --ios` / `expo run:ios` for day-to-day; use XcodeBuildMCP after prebuild if you want native schemes.

---

## What was already automated (session baseline)

Use this as a “green list” from prior automated runs; re-run MCP tools to refresh.

### Backend / app

| Check | Expected |
|-------|----------|
| `GET /api/health` | 200, DynamoDB + Bedrock |
| Emotions / meditations / prayers | 200 |
| Wisdom status | 200 |
| Devotional | May 404 if route unused |
| Preview env | `./scripts/sync-env-from-aws.sh` → `test_` + `UNLOCK_ALL=1` |
| Expo web | `http://localhost:8081` when Metro running |

### RevenueCat (MCP)

| Check | Expected |
|-------|----------|
| Entitlement `christcalm_premium` | Active; monthly + annual attached |
| Offering `default` | Current; packages map to `cc_999_1m` / `cc_1999_1y_1w0` |
| ASC app on RC | Bundle `com.christcalm.app`; API key + subscription key configured |
| Public key | `appl_…` for store/sandbox builds |
| Product pricing | US monthly ~$9.99, annual ~$39.99; multi-territory prices present |
| Product status | Often `READY_TO_SUBMIT` / `needs_action` until submitted with app |
| Privacy policy on products | Often **null** — add manually or via RC MCP |
| Annual trial | 1 week when configured |

### App Store Connect (MCP)

| Check | Expected |
|-------|----------|
| App | Christ Calm `6788769964` |
| Version | e.g. `1.0` · `PREPARE_FOR_SUBMISSION` |
| Build | e.g. build **2** · `VALID` · `APP_STORE_ELIGIBLE` |
| Encryption | `usesNonExemptEncryption: false` |
| Beta groups | May be empty until you create one |

### Local simulator blockers found before

| Issue | Action |
|-------|--------|
| **0 iOS Simulator runtimes** | Xcode → Settings → Platforms → install iOS Simulator |
| Expo MCP tools missing in agent | Complete Expo OAuth; restart Grok; run `npm run start:mcp` |
| No `ios/` folder | Managed Expo; use Expo Go or `npx expo prebuild --platform ios` |

---

## Split: automate vs manual

| Task | Automated (MCP / scripts) | Manual |
|------|---------------------------|--------|
| Sync public env | `./scripts/sync-env-from-aws.sh` | — |
| Deploy API | `./scripts/deploy-aws.sh code` | AWS credentials |
| Health + catalog smoke | curl / agent | — |
| RC products / offerings / entitlement | RC MCP | — |
| Fix IAP pricing / territories | RC MCP | — |
| IAP review screenshots | RC MCP (partial) | Provide PNG assets |
| ASC app / version / build status | ASC MCP | — |
| TestFlight add tester | ASC MCP | Accept invite on device |
| Install iOS Simulator runtime | — | **Xcode Platforms** |
| Boot sim + `expo start --ios` | After runtime | First-time Xcode license/components |
| Expo MCP OAuth | — | Browser login once |
| Expo web UI | `npx expo start --web` | Browser |
| Real StoreKit purchase | — | **Device + sandbox Apple ID** |
| Create sandbox Apple ID | — | ASC → Users and Access → Sandbox |
| EAS production build | CLI / Expo MCP status | Expo + Apple credentials |
| Upload binary | EAS submit | — |
| Attach build + IAPs to version | Limited | **ASC UI** (first IAP often with version) |
| Privacy Policy URL | RC can set on product | Host the page |
| App listing screenshots | — | Capture + upload |
| App Privacy / age rating | — | ASC questionnaires |
| Submit for App Review | — | ASC button |

---

## Recommended flows

### A. Local UI (no IAP) — mostly automatic

```bash
./scripts/sync-env-from-aws.sh          # preview: test_ key, UNLOCK_ALL=1
cd frontend && npm run start:mcp        # or: npx expo start --web
# Open http://localhost:8081
# Or after Simulator runtime: npx expo start --ios
```

Agent can: health checks, RC/ASC audit, start Metro, (after sim + Expo MCP) screenshots.

### B. Device sandbox IAP (true store-like)

```bash
CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh
# Confirm: appl_ key + UNLOCK_ALL=0
cd frontend && npx expo run:ios --device
# Or install TestFlight build
```

**You:** sandbox Apple ID, sign in, purchase monthly/annual.  
**Agent (MCP):** confirm product store state; after purchase, list customer subscriptions.

### C. TestFlight / App Store binary

```bash
cd frontend
npm run build:ios:production
npm run submit:ios
```

**You:** TestFlight install, smoke test, ASC listing + Submit for Review.  
**Agent:** Expo MCP build status; ASC/RC metadata; optional tester invites.

---

## Commands cheat sheet

```bash
# Preview (web/sim content)
./scripts/sync-env-from-aws.sh
cd frontend && npx expo start --web
cd frontend && npx expo start --ios    # needs Simulator runtime

# App Store–like env on device
CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh
cd frontend && npx expo run:ios --device

# Production binary
cd frontend && npm run build:ios:production
cd frontend && npm run submit:ios

# Backend
./scripts/deploy-aws.sh code
curl -sS "$EXPO_PUBLIC_BACKEND_URL/api/health"
```

---

## Hard rules (do not break)

1. Never ship `EXPO_PUBLIC_UNLOCK_ALL=1` in TestFlight / App Store builds.  
2. Never put RevenueCat **secret** (`sk_`) or Apple `.p8` in the app or git.  
3. Production premium = RevenueCat entitlement + webhook → DynamoDB `is_premium`.  
4. `ALLOW_PREVIEW_TEST_PREMIUM=1` is for **local API only**, not production Lambda.  
5. Public `appl_` / `test_` keys may ship in the client; keep them out of unnecessary docs when possible.

---

## Your next manual steps (priority)

1. **Xcode → Settings → Platforms** — download **iOS Simulator** runtime.  
2. **Grok** — reconnect **Expo MCP** and complete OAuth.  
3. **ASC** — create sandbox tester; optionally create TestFlight internal group and add yourself.  
4. **Device** — `CHRISTCALM_RC_MODE=appstore` + install → one sandbox purchase.  
5. **ASC listing** — privacy policy URL, screenshots, attach build #N + both IAPs → Submit for Review.

---

## Agent re-run prompt (copy/paste)

> Re-run automated preflight for ChristCalm: API health, RC products/entitlements/store state for monthly and annual, ASC app/version/builds/beta groups, expo-doctor, list simulators. Start Expo web if needed. Report green/red and what still requires my manual action.

---

*Last documented for agent/session workflow; re-verify store status with MCP before each release.*
