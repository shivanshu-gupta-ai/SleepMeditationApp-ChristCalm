# ChristCalm — RevenueCat + App Store paywall guide

End-to-end guide to wire **iOS in-app subscriptions** for ChristCalm using **RevenueCat** and **App Store Connect**, including how to **create** and **find** every ID, key, and setting.

**Scope:** iOS only (no Android).  
**Project (RevenueCat):** `proj43f1dce8` — **ChristCalm**  
**App code entitlement:** `christcalm_premium`  
**Offering:** `default`  
**Products:** `cc_999_1m`, `cc_5999_1y`, `cc_3999_1y`, `cc_1999_1y`

Related files in this repo:

| Path | Role |
|------|------|
| `frontend/src/features/subscriptions/` | SDK wiring (`RevenueCatContext`, constants, `usePremium`) |
| `frontend/app/paywall.tsx` | Branded premium shell + RevenueCat Paywalls checkout |
| `config/auth/revenuecat.example.json` | Current RC IDs snapshot |
| `config/auth/README.md` | Short RC notes |
| `backend/server.py` | `/api/revenuecat/webhook` + `/api/subscription/sync` |
| `scripts/sync-env-from-aws.sh` | Writes public Expo + RC env vars |

---

## 1. Mental model (how the pieces fit)

```
┌──────────────────┐     purchase      ┌─────────────────┐
│  iOS App (Expo)  │ ───────────────►  │  App Store      │
│  RevenueCat SDK  │                   │  (StoreKit)     │
└────────┬─────────┘                   └────────┬────────┘
         │ validates / entitlements             │
         ▼                                      │
┌──────────────────┐                            │
│   RevenueCat     │ ◄── receipts / S2S ────────┘
│  dashboard + API │
└────────┬─────────┘
         │ webhook (optional) + client sync
         ▼
┌──────────────────┐
│  ChristCalm API  │  DynamoDB user.is_premium
│  (Lambda)        │
└──────────────────┘
```

**Who owns what**

| Layer | Owns |
|-------|------|
| **App Store Connect** | Real products, prices, tax, review, sandbox testers |
| **RevenueCat** | Entitlements, offerings/packages, product mapping, analytics, SDK abstraction |
| **Your app** | Paywall UI, `Purchases.configure`, purchase/restore, check `entitlements.active.christcalm_premium` |
| **Your backend** | Optional mirror of premium via webhook + client sync for API gates |

**Rule:** The store product **identifier** in App Store Connect must exactly match the RevenueCat store identifier. The app loads localized prices from RevenueCat/StoreKit.

---

## 2. What is already configured (ChristCalm)

As of the current setup:

| Item | Value |
|------|--------|
| RevenueCat project | `proj43f1dce8` (name: ChristCalm) |
| Entitlement lookup key | `christcalm_premium` (RC id `entl6f7711a266`) |
| Offering | `default` (current; RC id `ofrngd353e9c397`) |
| Packages | `$rc_monthly` → `cc_999_1m`; full/mid/low annual packages → their corresponding `cc_*_1y` SKUs |
| Test Store app | `app1d119d1b47` (sandbox without real App Store products) |
| Test Store public key | `test_iOFZidqNcAXQabRbTcHHYiAEKug` |
| App env (local) | `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=test_…` |

**Test Store** lets you exercise SDK + offerings **before** App Store Connect products exist.  
**Production / real money** requires an **App Store** app in RevenueCat + matching subscriptions in App Store Connect.

---

## 3. Identifier map (copy/paste checklist)

Use the **same strings** everywhere.

| Concept | Canonical value for ChristCalm | Where it lives |
|---------|--------------------------------|----------------|
| Bundle ID | `com.christcalm.app` | Xcode / Expo `app.json` → `ios.bundleIdentifier` · ASC · RC App Store app |
| Entitlement | `christcalm_premium` | RC Product catalog → Entitlements · app `ENTITLEMENT_ID` · backend `REVENUECAT_ENTITLEMENT_ID` |
| Offering | `default` | RC Offerings · app `OFFERING_ID` |
| Monthly product ID | `cc_999_1m` | ASC subscription product · RC product store identifier · app `PRODUCT_IDS.monthly` |
| Annual full product ID | `cc_5999_1y` | `$rc_annual` · $59.99/year |
| Annual mid product ID | `cc_3999_1y` | `$rc_custom_annual_mid` · $39.99/year |
| Annual low product ID | `cc_1999_1y` | `$rc_custom_annual_low` · $19.99/year |
| Package types | `$rc_monthly`, `$rc_annual`, `$rc_custom_annual_mid`, `$rc_custom_annual_low` | RC packages inside offering `default` |
| iOS public SDK key | `appl_…` (prod) or `test_…` (Test Store) | RC App → API keys · `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` |
| Secret API key (server/MCP) | `sk_…` (v2) | RC Project settings → API keys · **never** in the app |
| Webhook auth | random secret you invent | RC Integrations → Webhooks · SSM `REVENUECAT_WEBHOOK_AUTHORIZATION` |

---

## 4. Apple Developer & App Store Connect

### 4.1 Prerequisites

1. [Apple Developer Program](https://developer.apple.com/programs/) membership (paid).
2. Access to [App Store Connect](https://appstoreconnect.apple.com/).
3. An **App** record for ChristCalm (or create one).
4. Bundle ID **`com.christcalm.app`** registered under Certificates, Identifiers & Profiles → Identifiers.

**Find / create Bundle ID**

1. [developer.apple.com](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles** → **Identifiers**.
2. **+** → **App IDs** → App.
3. Description: `ChristCalm`.
4. Bundle ID: **Explicit** → `com.christcalm.app`.
5. Capabilities: enable **In-App Purchase** (and Sign In with Apple if you use it).
6. Register.

**Find in this repo**

```json
// frontend/app.json
"ios": { "bundleIdentifier": "com.christcalm.app" }
```

---

### 4.2 Create the app in App Store Connect (if missing)

1. [App Store Connect](https://appstoreconnect.apple.com/) → **Apps** → **+**.
2. Platform: iOS.
3. Name: `ChristCalm` (or your marketing name).
4. Primary language, Bundle ID: `com.christcalm.app`.
5. SKU: e.g. `christcalm-ios-001` (internal only).
6. Create.

---

### 4.3 Paid Applications agreement

Subscriptions **will not work** until contracts are active.

1. App Store Connect → **Business** (or **Agreements, Tax, and Banking**).
2. Accept **Paid Applications**.
3. Complete **Banking**, **Tax**, and **Contact** info.
4. Status must be **Active**.

---

### 4.4 Create subscription products

#### A. Subscription Group

1. Open your app → **Monetization** → **Subscriptions** (or **Features** → **In-App Purchases** depending on ASC UI).
2. Create a **Subscription Group**, e.g. `ChristCalm Premium`.
   - One group holds monthly + all annual tiers so users upgrade/downgrade cleanly.

#### B. Monthly subscription

1. **+** inside the group → **Auto-Renewable Subscription**.
2. **Reference Name** (internal): `ChristCalm Monthly`.
3. **Product ID** (immutable): **`cc_999_1m`**
   - Must match RevenueCat + app constants.  
   - Use only letters, numbers, underscores; no spaces.
4. Subscription duration: **1 Month**.
5. **Subscription Prices**: set base price (e.g. $9.99 USD) and territories.
6. **Localizations**: Display Name + Description users see (e.g. “ChristCalm Premium”, “Unlimited meditations & Wisdom”).
7. **Review screenshot** (required for submission): paywall or subscription UI.
8. Save → status progresses toward **Ready to Submit** / **Approved** with a binary.

#### C. Annual subscriptions

Create three one-year products in the same subscription group:

| Product ID | US price | Package |
|------------|----------|---------|
| `cc_5999_1y` | $59.99 | `$rc_annual` |
| `cc_3999_1y` | $39.99 | `$rc_custom_annual_mid` |
| `cc_1999_1y` | $19.99 | `$rc_custom_annual_low` |

The current product design has **no introductory offer or free trial**.

---

### 4.5 Sandbox testers (for real StoreKit testing)

1. App Store Connect → **Users and Access** → **Sandbox** → **Testers**.
2. **+** create a sandbox Apple ID (not your real Apple ID).
3. On device: **Settings → App Store → Sandbox Account** (iOS 18+) or sign out of Media & Purchases and use sandbox when prompted.
4. Run a **development / TestFlight** build — **not** Expo Go for real IAP (use a dev client or store build).

**Note:** Expo Go has limited IAP support. Prefer:

```bash
# Example: development build
npx expo prebuild
npx expo run:ios
# or EAS: eas build --profile development --platform ios
```

---

### 4.6 Shared secret & In-App Purchase keys (for RevenueCat)

RevenueCat needs to talk to Apple. Prefer the modern **App Store Connect API key** / **In-App Purchase key** path; some projects still use a shared secret.

#### Option A — In-App Purchase Key (recommended path in RC docs)

1. App Store Connect → **Users and Access** → **Integrations** → **In-App Purchase**.
2. Generate a key → download **once** (`.p8`).
3. Note **Key ID** and **Issuer ID** (Users and Access → Integrations).
4. You will paste these into RevenueCat when creating/updating the **App Store** app.

#### Option B — App-specific shared secret (legacy / still used in some setups)

1. App → **General** → **App Information** (or Monetization → Manage).
2. **App-Specific Shared Secret** → Generate.
3. Copy into RevenueCat App Store app settings if RC asks for it.

#### App Store Connect API key (optional, product import)

1. Users and Access → **Integrations** → **App Store Connect API**.
2. Generate key with **App Manager** (or Admin) access.
3. Download `.p8`, note Key ID + Issuer ID.
4. Can help RC import products automatically.

---

## 5. RevenueCat dashboard setup

Sign in: [https://app.revenuecat.com](https://app.revenuecat.com)

### 5.1 Find your project

1. Top-left project switcher → **ChristCalm**.
2. Project ID is in the URL or Project settings: **`proj43f1dce8`**.

### 5.2 Create an **App Store** app (production path)

You currently have **Test Store** only. For real IAP:

1. Project → **Apps** → **+ New**.
2. Platform: **App Store** (iOS).
3. Name: `ChristCalm iOS`.
4. **Bundle ID:** `com.christcalm.app` (must match ASC exactly).
5. Paste In-App Purchase / shared secret credentials from §4.6.
6. Save.

**Find later:** Project → Apps → select app → Configuration / Service credentials.

### 5.3 API keys — find public vs secret

1. Project → **API keys** (or App → API keys).
2. **Public app-specific key** for iOS: starts with **`appl_`**  
   - Goes in the **mobile app** only:  
     `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_…`
3. **Secret key** (v1 or v2): starts with **`sk_`**  
   - Server, webhooks tooling, MCP — **never** ship in the client.
4. For MCP / REST v2: create a **v2** secret key with **project configuration read/write** if you manage catalog via API/MCP.

**Test Store public key** (already in use for sandbox without ASC):

```text
test_iOFZidqNcAXQabRbTcHHYiAEKug
```

Switch to `appl_…` when the App Store app is connected and products are live in sandbox.

### 5.4 Entitlement (create or verify)

1. **Product catalog** → **Entitlements** → **+ New**.
2. Identifier (lookup key): **`christcalm_premium`**.
3. Display name: `ChristCalm Premium`.
4. Attach all four active `cc_*` products after they exist.

**Already created:** lookup key `christcalm_premium`.

**Why one entitlement?**  
App code checks a single flag: “does this user have premium access?” Monthly and annual both grant the same access.

### 5.5 Products (create or import)

For each store product:

1. **Product catalog** → **Products** → **+ New**.
2. **App:** your **App Store** app (not only Test Store, for production).
3. **Store product identifier:** exact ASC Product ID  
   - `cc_999_1m`
   - `cc_5999_1y`
   - `cc_3999_1y`
   - `cc_1999_1y`
4. Type: Subscription; duration P1M / P1Y.

If products already exist on **Test Store**, either:

- Create **additional** product rows attached to the **App Store** app with the **same store identifiers**, or  
- Follow RC’s import-from-store flow once credentials are valid.

Test Store aliases may exist for preview builds, but active App Store packages must map to the four `cc_*` identifiers above.

### 5.6 Offering + packages (paywall catalog)

1. **Product catalog** → **Offerings** → **+ New**.
2. Identifier: **`default`**.
3. Make it **Current** (SDK `Purchases.getOfferings().current`).
4. Add packages:
   - **`$rc_monthly`** → attach `cc_999_1m`
   - **`$rc_annual`** → attach `cc_5999_1y`
   - **`$rc_custom_annual_mid`** → attach `cc_3999_1y`
   - **`$rc_custom_annual_low`** → attach `cc_1999_1y`
5. Position: annual first if you want it highlighted (app UI still defaults to annual).

**Already created:** offering `default` (current) with all four packages.

**How the app uses this**

```ts
// frontend/src/features/subscriptions/RevenueCatContext.tsx
Purchases.getOfferings() → offerings.current
// packages filtered by PACKAGE_TYPE.MONTHLY / ANNUAL
Purchases.purchasePackage(pkg)
```

### 5.7 (Optional) RevenueCat Paywalls

RC can host a remote paywall UI. This app uses a **custom** screen: `frontend/app/paywall.tsx`.  
You can ignore RC Paywalls unless you want dashboard-driven UI later.

### 5.8 Webhooks (recommended for server `is_premium`)

1. RevenueCat → **Integrations** → **Webhooks** → **+ New**.
2. URL (ChristCalm-Dev example):

   ```text
   https://u2r7gwyg3j.execute-api.us-east-1.amazonaws.com/api/revenuecat/webhook
   ```

   Confirm current URL:

   ```bash
   cd infrastructure/terraform && terraform output -raw api_url
   # append: api/revenuecat/webhook
   ```

3. **Authorization header:** generate a long random secret, e.g.

   ```bash
   openssl rand -hex 32
   ```

4. Events: at least **INITIAL_PURCHASE**, **RENEWAL**, **CANCELLATION**, **EXPIRATION**, **PRODUCT_CHANGE**, **BILLING_ISSUE** (or “all production + sandbox”).
5. Store the same secret in AWS SSM as `REVENUECAT_WEBHOOK_AUTHORIZATION` under your stack prefix (`/christcalm-dev/…`) via Terraform `revenuecat_webhook_authorization` in `terraform.tfvars`, then:

   ```bash
   ./scripts/deploy-aws.sh apply
   ./scripts/deploy-aws.sh code   # if Lambda env needs refresh from SSM load path
   ```

Backend checks (see `backend/server.py`):

- Header `Authorization: Bearer <secret>` (or raw secret).
- Looks for entitlement `christcalm_premium` in the payload.
- Sets DynamoDB `users.is_premium`.

---

## 6. Wire the mobile app (this repo)

### 6.1 Env vars (public only)

In `frontend/.env` (also written by `./scripts/sync-env-from-aws.sh`):

```bash
# After App Store app is linked, replace test_ with appl_
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxx
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=christcalm_premium
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
EXPO_PUBLIC_REVENUECAT_PRODUCT_MONTHLY=cc_999_1m
EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL_FULL=cc_5999_1y
EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL_MID=cc_3999_1y
EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL_LOW=cc_1999_1y

# Set 0 when testing real paywall gating
EXPO_PUBLIC_UNLOCK_ALL=0
```

**Do not put `sk_` keys here.**

Constants resolution:

```ts
// frontend/src/features/subscriptions/constants.ts
ENTITLEMENT_ID   // christcalm_premium
OFFERING_ID      // default
PRODUCT_IDS.monthly / .annualFull / .annualMid / .annualLow
```

### 6.2 SDK flow (already implemented)

1. **Configure** with iOS public key when `Platform.OS === "ios"`.
2. **`Purchases.logIn(userId)`** with your Cognito / backend user id (stable).
3. **`getOfferings()`** → current offering packages for paywall prices.
4. **`purchasePackage` / `restorePurchases`**.
5. Read **`customerInfo.entitlements.active["christcalm_premium"]`**.
6. Best-effort **`api.syncSubscription`** so API reflects premium immediately; webhook is long-term source of truth.

### 6.3 Premium gate behavior

- Preview/dev often uses `EXPO_PUBLIC_UNLOCK_ALL=1` so content is free.
- For real monetization testing: set **`EXPO_PUBLIC_UNLOCK_ALL=0`**.
- The boot route and tabs redirect a signed-in non-premium user to `/paywall` after RevenueCat finishes loading.

### 6.4 Where the paywall opens

- Route: `frontend/app/paywall.tsx`
- Primary trigger: post-auth hard gate. A post-practice soft trigger remains for preview/limited-access configurations (see [`../product/10-auth-and-monetization.md`](../product/10-auth-and-monetization.md)).

---

## 7. Backend integration

### 7.1 Client sync

After purchase, the app calls the API to set `is_premium` quickly. Webhook re-confirms.

### 7.2 Webhook endpoint

```http
POST /api/revenuecat/webhook
Authorization: Bearer <REVENUECAT_WEBHOOK_AUTHORIZATION>
```

Env / SSM:

| Variable | Purpose |
|----------|---------|
| `REVENUECAT_WEBHOOK_AUTHORIZATION` | Shared secret |
| `REVENUECAT_ENTITLEMENT_ID` | Default `christcalm_premium` |

If the auth secret is **empty**, the backend may accept events without verification — **always set a secret in production**.

### 7.3 Deploy secret

```hcl
# infrastructure/terraform/terraform.tfvars (gitignored)
revenuecat_webhook_authorization = "YOUR_LONG_RANDOM_SECRET"
revenuecat_entitlement_id        = "christcalm_premium"
```

```bash
./scripts/deploy-aws.sh apply
```

---

## 8. Testing matrix

| Stage | API key | Products | Build | What works |
|-------|---------|----------|-------|------------|
| **A. RC Test Store** | `test_…` | Test Store products | Dev client / simulator (RC test) | Offerings + simulated purchases without ASC |
| **B. ASC Sandbox** | `appl_…` | ASC sandbox subscriptions | Device / simulator + sandbox Apple ID | Real StoreKit sandbox charges ($0) |
| **C. Production** | `appl_…` | ASC Approved products | App Store / TestFlight | Real money |

**Checklist before B**

- [ ] Paid Apps agreement active  
- [ ] Products **Ready to Submit** / available in sandbox  
- [ ] RC App Store app bundle ID matches  
- [ ] Products attached to entitlement + packages  
- [ ] Offering `default` is **Current**  
- [ ] `EXPO_PUBLIC_UNLOCK_ALL=0`  
- [ ] Signed-in with a **non-unlock** user  
- [ ] Sandbox tester signed in on device  

**Common errors**

| Symptom | Likely cause |
|---------|----------------|
| Empty offerings | Wrong API key · offering not current · products not attached to packages · bundle ID mismatch |
| “Product not available” | ASC product ID ≠ RC store identifier · products not cleared for sale · agreements incomplete |
| Purchase works, app still free | Checking wrong entitlement id · `UNLOCK_ALL=1` · premium not refreshed · backend sync/webhook not firing |
| Webhook 401 | Authorization header ≠ SSM secret |
| Works in Test Store, fails in sandbox | Still using `test_` key instead of `appl_` · App Store app not configured in RC |

---

## 9. Production go-live checklist

### Apple

- [ ] Bundle ID `com.christcalm.app`  
- [ ] Subscription group + all four active `cc_*` products
- [ ] Prices + localizations + review screenshot  
- [ ] Banking / tax / Paid Applications **Active**  
- [ ] Sandbox purchase verified on a device  
- [ ] App binary submitted with IAP  

### RevenueCat

- [ ] App Store app with correct bundle ID + Apple credentials  
- [ ] Products linked (App Store), attached to `christcalm_premium`  
- [ ] Offering `default` current with monthly + full/mid/low annual packages
- [ ] Public `appl_` key in production app config (EAS secrets / CI)  
- [ ] Webhook → production API URL + secret  
- [ ] (Optional) charts / customer lists sanity check after first sandbox purchase  

### ChristCalm app & API

- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_…`  
- [ ] `EXPO_PUBLIC_UNLOCK_ALL=0` for release  
- [ ] Entitlement id still `christcalm_premium`  
- [ ] SSM webhook secret set; Lambda redeployed  
- [ ] Manual test: purchase → premium UI → restore on reinstall → cancel/expire (sandbox)  

### Security

- [ ] No `sk_` in git, Expo, or client bundles  
- [ ] Secret keys only in Grok MCP config / password manager / SSM  
- [ ] Rotate any secret that was pasted into chat logs  

---

## 10. How to **find** every value quickly

| Need | Where to look |
|------|----------------|
| Bundle ID | Expo `app.json` · ASC App Information · Apple Developer Identifiers |
| ASC Product IDs | ASC → App → Subscriptions → product detail → Product ID |
| RC Project ID | RC URL or Project settings → `proj43f1dce8` |
| Entitlement id | RC → Product catalog → Entitlements → Identifier |
| Offering id | RC → Offerings → Identifier (`default`) |
| Package ids | Inside offering (`$rc_monthly`, `$rc_annual`, `$rc_custom_annual_mid`, `$rc_custom_annual_low`) |
| iOS public key | RC → Apps → [iOS app] → API keys → Public (`appl_` / `test_`) |
| Secret key | RC → Project settings → API keys (`sk_`) |
| Webhook URL | Your API: `terraform output api_url` + `api/revenuecat/webhook` |
| Whether user is premium | RC Customer profile · SDK `CustomerInfo` · DynamoDB `users.is_premium` |
| MCP tools | Grok `~/.grok/config.toml` → `[mcp_servers.revenuecat]` → `https://mcp.revenuecat.ai/mcp` |

---

## 11. Create catalog via API / MCP (optional)

With a **v2 secret key** (write permissions):

Base URL: `https://api.revenuecat.com/v2`  
Header: `Authorization: Bearer sk_…`

Useful endpoints:

| Action | Method / path |
|--------|----------------|
| List apps | `GET /projects/{project_id}/apps` |
| Create entitlement | `POST /projects/{project_id}/entitlements` body: `lookup_key`, `display_name` |
| Create product | `POST /projects/{project_id}/products` (`app_id`, `store_identifier`, `type`, `title`, `subscription.duration`) |
| Attach products to entitlement | `POST /projects/{project_id}/entitlements/{id}/actions/attach_products` |
| Create offering | `POST /projects/{project_id}/offerings` |
| Create package | `POST /projects/{project_id}/offerings/{id}/packages` |
| Attach product to package | `POST /projects/{project_id}/packages/{id}/actions/attach_products` body: `{ "products": [{ "product_id": "prod…", "eligibility_criteria": "all" }] }` |

Or use **RevenueCat MCP** in Grok (already configured) with natural language once tools are available in-session.

Snapshot of current IDs: [`config/auth/revenuecat.example.json`](../../config/auth/revenuecat.example.json).

---

## 12. Recommended implementation order

1. **Keep using Test Store** (`test_` key) to finish paywall UX against `default` offering.  
2. **ASC:** agreements → subscription group → create the four active products.
3. **RC:** add App Store app + credentials → create/import App Store products → attach to same entitlement & packages.  
4. **App:** switch to `appl_` key; `UNLOCK_ALL=0`; test on device with sandbox Apple ID.  
5. **Backend:** webhook + SSM secret; confirm `is_premium` flips.  
6. **Submit** app + IAPs for review together.

---

## 13. Support links

- RevenueCat quickstart: https://www.revenuecat.com/docs/getting-started/quickstart  
- Entitlements: https://www.revenuecat.com/docs/getting-started/entitlements  
- Offerings: https://www.revenuecat.com/docs/offerings/overview  
- iOS / StoreKit: https://www.revenuecat.com/docs/getting-started/installation/ios  
- Expo / React Native: https://www.revenuecat.com/docs/getting-started/installation/reactnative  
- API v2: https://www.revenuecat.com/docs/api-v2  
- MCP setup: https://www.revenuecat.com/docs/tools/mcp/setup  
- Apple subscriptions: https://developer.apple.com/app-store/subscriptions/  

---

## 14. Quick reference — ChristCalm production target

```text
Bundle ID:        com.christcalm.app
Entitlement:      christcalm_premium
Offering:         default  (current)
Packages:         $rc_monthly           → cc_999_1m
                  $rc_annual            → cc_5999_1y
                  $rc_custom_annual_mid → cc_3999_1y
                  $rc_custom_annual_low → cc_1999_1y
Public key (dev): test_iOFZidqNcAXQabRbTcHHYiAEKug
Public key (prod): appl_…   (create after App Store app in RC)
Webhook:          {api_url}api/revenuecat/webhook
RC project:       proj43f1dce8
Platform:         iOS only
```

When in doubt: **same product IDs in ASC and RevenueCat**, **one entitlement**, **one current offering**, **public key only in the app**, **secret key only on server/MCP**.
