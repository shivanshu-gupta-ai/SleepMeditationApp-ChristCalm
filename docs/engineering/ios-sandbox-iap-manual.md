# ChristCalm — Manual iOS sandbox IAP guide

**Purpose:** Step-by-step checklist **you** run by hand to complete a real **StoreKit sandbox purchase** on a physical iPhone through RevenueCat.

**Audience:** You (operator / developer), not an automated CI job.  
**Time:** ~45–90 minutes the first time (Apple accounts + Xcode/EAS setup dominate).  
**Outcome:** One successful sandbox subscription; premium visible in app + RevenueCat + backend.

---

## 0. What is already done for you (do not re-do)

Verified live as of repo config / MCP checks:

| Item | Value / status |
|------|----------------|
| App Store Connect app | **Christ Calm** · ID `6788769964` |
| Bundle ID | `com.christcalm.app` |
| Subscription group | **ChristCalm Premium** · ASC `22217597` |
| Monthly product | `cc_999_1m` · ~$9.99 · Ready to Submit |
| Annual products | `cc_5999_1y` · $59.99; `cc_3999_1y` · $39.99; `cc_1999_1y` · $19.99; no trial |
| RevenueCat project | `proj43f1dce8` (ChristCalm) |
| RC App Store app | `app7793b2074c` (ChristCalm iOS) |
| RC public iOS key | `appl_cccgVPkKesnGrFTnzfXMEjQvfRA` |
| RC Test Store key | `test_iOFZidqNcAXQabRbTcHHYiAEKug` (web/preview only) |
| Entitlement | `christcalm_premium` |
| Offering | `default` (current) · monthly + full/mid/low annual packages |
| RC ↔ ASC credentials | In-App Purchase key **configured** · ASC API key **configured** |
| Apple Server Notifications | **V2** → RevenueCat (production **and** sandbox) |
| Backend webhook | `https://u2r7gwyg3j.execute-api.us-east-1.amazonaws.com/api/revenuecat/webhook` |
| App code | `react-native-purchases` + paywall + Customer Center |

You are **not** starting from zero. You are finishing the **device sandbox purchase** path.

### What this guide is *not*

| Skip | Why |
|------|-----|
| Expo Go / web browser purchases | No StoreKit |
| `test_…` RevenueCat key for real IAP | Test Store only |
| Leaving `EXPO_PUBLIC_UNLOCK_ALL=1` | Hides the real paywall |
| Simulator-only “purchase” confidence | Sandbox Apple ID is for **device** |

---

## 1. Prerequisites checklist (before any install)

### 1.1 Accounts & hardware

- [ ] **Apple Developer Program** membership (paid) on the team that owns `com.christcalm.app`
- [ ] Access to [App Store Connect](https://appstoreconnect.apple.com/) for app **Christ Calm**
- [ ] Access to [RevenueCat](https://app.revenuecat.com/) project **ChristCalm**
- [ ] **Physical iPhone** (USB cable recommended for first build)
- [ ] Mac with **Xcode** installed (for local `expo run:ios --device`)
  - *or* plan to use **EAS Build** only (no local Xcode compile)

### 1.2 Laptop tools

Open Terminal. From anywhere:

```bash
# Node / npm (Expo)
node -v          # expect 18+ (or whatever you already use for this repo)
npm -v

# Apple / native
xcodebuild -version
xcrun simctl list devices available | head

# Repo tools
cd /path/to/ChristCalmApp   # your clone path
git status
aws sts get-caller-identity   # optional; only if you re-sync env from AWS
```

Optional (EAS cloud builds):

```bash
npm install -g eas-cli
eas login
eas whoami
```

### 1.3 Clone & install (if not already)

```bash
cd /path/to/ChristCalmApp
cd frontend
npm install
cd ..
```

---

## 2. Create an App Store **Sandbox Tester**

Sandbox purchases use a **fake Apple ID** that only works for IAP testing.

### 2.1 Create the tester in App Store Connect

1. Open [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **Users and Access**
3. Open the **Sandbox** tab (left or top, depending on ASC UI)
4. Click **Testers**
5. Click **+** (Add Tester)
6. Fill in (examples — use your own):

| Field | Example |
|-------|---------|
| First Name | `Christ` |
| Last Name | `Sandbox` |
| Email | `yours+ccsandbox1@gmail.com` (must be unused as a real Apple ID) |
| Password | Strong password you will remember (e.g. meet Apple rules) |
| Country/Region | **United States** (or match product pricing territory) |

7. Save / invite as prompted  
8. **Write down email + password** — you need them on the phone

> Tip: Gmail `you+something@gmail.com` is fine for ASC sandbox; do **not** use an email already tied to a real production Apple ID.

### 2.2 Sign in as sandbox on the iPhone

1. Unlock the **physical iPhone**
2. Open **Settings → App Store**
3. Scroll to **Sandbox Account** (bottom)
4. Tap **Sign In**
5. Enter the **sandbox tester** email + password
6. Leave your **personal Apple ID** signed in for the device itself — do **not** sign out of Settings → [Your Name] just for sandbox

**Done when:** Settings → App Store shows a Sandbox Account email.

---

## 3. Prepare the app env for **App Store IAP** (not Test Store)

Repo root:

```bash
cd /path/to/ChristCalmApp

# Force App Store public key + paywall gates ON
CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh
```

### 3.1 Verify `.env` (critical)

```bash
grep -E 'REVENUECAT_IOS|UNLOCK_ALL|BACKEND' frontend/.env
```

**Must look like:**

```text
EXPO_PUBLIC_BACKEND_URL=https://u2r7gwyg3j.execute-api.us-east-1.amazonaws.com
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_cccgVPkKesnGrFTnzfXMEjQvfRA
EXPO_PUBLIC_UNLOCK_ALL=0
```

| Check | Good | Bad |
|-------|------|-----|
| Key prefix | `appl_` | `test_` |
| Unlock | `0` | `1` or missing (defaults can unlock everything) |

Manual alternative (copy template):

```bash
cp frontend/env.device.example frontend/.env
# Then re-run sync if you need Cognito/API URLs refreshed:
CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh
```

### 3.2 Switch back later (content / web preview)

```bash
CHRISTCALM_RC_MODE=preview ./scripts/sync-env-from-aws.sh
# → test_ key + UNLOCK_ALL=1
```

---

## 4. Build & install on a **physical iPhone**

Pick **one** path: A (local USB) or B (EAS cloud).

---

### Path A — Local native build (recommended first time)

#### A.1 Trust the Mac / developer mode

On iPhone:

1. Plug into Mac with USB
2. If prompted: **Trust This Computer**
3. iOS 16+: **Settings → Privacy & Security → Developer Mode → On** (reboot if asked)

On Mac:

1. Open **Xcode** once; accept license if needed  
2. **Xcode → Settings → Accounts** → add your Apple ID / team  
3. Confirm team can sign `com.christcalm.app`

#### A.2 Generate native iOS project + install

```bash
cd /path/to/ChristCalmApp
CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh

cd frontend
npx expo prebuild --platform ios --clean
npx expo run:ios --device
```

What happens:

- `prebuild` creates/updates the `ios/` folder  
- `run:ios --device` compiles with Xcode, installs on the selected phone  
- First run may ask which device / which signing team — choose your **physical** phone and the **correct team**

If Xcode signing fails:

1. Open `frontend/ios/*.xcworkspace` in Xcode  
2. Select the **ChristCalm** target → **Signing & Capabilities**  
3. Team = your Apple Developer team  
4. Bundle ID must stay **`com.christcalm.app`**  
5. Re-run:

```bash
cd frontend
npx expo run:ios --device
```

#### A.3 Metro still needed for JS (dev builds)

Leave the Metro terminal running. If it died:

```bash
cd /path/to/ChristCalmApp/frontend
npx expo start --dev-client --clear
```

---

### Path B — EAS Build (no local compile)

```bash
cd /path/to/ChristCalmApp/frontend

# Once per machine
eas login
eas whoami

# Internal device build — env already baked in eas.json "preview" profile
# (appl_ key + UNLOCK_ALL=0 + backend URL)
npm run build:ios:preview
# same as: eas build -p ios --profile preview
```

Then:

1. Wait for Expo dashboard build to finish  
2. Install via QR code / link on the **same Apple ID team** device  
3. Trust developer if prompted: **Settings → General → VPN & Device Management**

Production / TestFlight later:

```bash
cd frontend
npm run build:ios:production
eas submit -p ios --profile production
```

`eas.json` already sets **ASC App ID** `6788769964` for submit.

---

## 5. Run the purchase flow in the app

### 5.1 Sign in

1. Launch **ChristCalm** on the device  
2. Create an account or sign in (Cognito email is fine)  
3. Complete onboarding if shown  

### 5.2 Open the paywall

Any of:

- Complete onboarding and auth; the hard premium gate opens automatically
- **Me** → **Unlock Premium** in preview/previously entitled test paths
- Navigate to paywall route if you have a deep link  

### 5.3 Confirm products load

You should see **real prices** (localized), not “unavailable” forever.

| If products empty / unavailable | Fix |
|---------------------------------|-----|
| Still using `test_` key | Re-sync with `CHRISTCALM_RC_MODE=appstore` and rebuild |
| Expo Go | Stop — use Path A or B native build |
| Sandbox not signed in | Settings → App Store → Sandbox Account |
| Wrong bundle ID | Must be `com.christcalm.app` |
| Products not Ready to Submit | ASC → Subscriptions → check status |

### 5.4 Buy

1. Tap an offered package: monthly (`cc_999_1m`) or an annual tier (`cc_5999_1y`, `cc_3999_1y`, `cc_1999_1y`)
2. Apple sheet appears → use **Sandbox** password when asked  
3. Confirm purchase  
4. App should show premium (badge, unlocked content, Customer Center options)

### 5.5 Restore (optional)

On paywall: **Restore purchases** — should re-apply entitlement after reinstall/sign-out/in.

---

## 6. Verify success (three places)

### 6.1 In the app

- [ ] Premium badge / unlocked premium content  
- [ ] **Me → Manage Subscription** (Customer Center) works if SDK UI is available  
- [ ] Sign out / sign in → still premium (if `Purchases.logIn` linked to user)

### 6.2 RevenueCat dashboard

1. Open [app.revenuecat.com](https://app.revenuecat.com) → **ChristCalm**  
2. **Customers**  
3. Find the user (by App User ID = your Cognito/backend user id if login sync works, or anonymous id)  
4. Confirm:
   - Active entitlement **`christcalm_premium`**
   - One of the four active product ids
   - Environment **Sandbox**

### 6.3 Backend (optional but recommended)

If the app calls subscription sync / webhook fired:

- Profile / API `GET /api/subscription/status` with auth should show premium  
- Or DynamoDB user row: `is_premium` true  

Webhook endpoint (already configured):

```text
POST https://u2r7gwyg3j.execute-api.us-east-1.amazonaws.com/api/revenuecat/webhook
```

In RevenueCat: **Integrations → Webhooks → ChristCalm-Dev API** → optional **Send test** (tests delivery; purchase events come from real buys).

---

## 7. Command cheat sheet (copy/paste)

### Device IAP day

```bash
cd /path/to/ChristCalmApp
CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh
grep -E 'REVENUECAT_IOS|UNLOCK' frontend/.env

cd frontend
npx expo prebuild --platform ios --clean
npx expo run:ios --device
```

### EAS internal build

```bash
cd /path/to/ChristCalmApp/frontend
eas login
npm run build:ios:preview
```

### Back to local web / unlocked preview

```bash
cd /path/to/ChristCalmApp
CHRISTCALM_RC_MODE=preview ./scripts/sync-env-from-aws.sh
./scripts/preview.sh
```

### Optional config smoke (needs RC secret key)

```bash
export REVENUECAT_API_KEY='sk_…'   # from RC Project settings — never commit
python3 scripts/e2e/revenuecat_config_check.py
```

### Backend re-deploy (only if API code changed)

```bash
./scripts/deploy-aws.sh deploy
```

---

## 8. Identifier reference card

| Concept | Exact string |
|---------|----------------|
| Bundle ID | `com.christcalm.app` |
| ASC App ID | `6788769964` |
| Entitlement | `christcalm_premium` |
| Offering | `default` |
| Monthly product | `cc_999_1m` |
| Annual full / mid / low | `cc_5999_1y` / `cc_3999_1y` / `cc_1999_1y` |
| Package monthly | `$rc_monthly` |
| Package annual | `$rc_annual` |
| Package annual mid | `$rc_custom_annual_mid` |
| Package annual low | `$rc_custom_annual_low` |
| Device SDK key | `appl_cccgVPkKesnGrFTnzfXMEjQvfRA` |
| Preview SDK key | `test_iOFZidqNcAXQabRbTcHHYiAEKug` |
| API base | `https://u2r7gwyg3j.execute-api.us-east-1.amazonaws.com` |

---

## 9. Troubleshooting (manual)

### Purchase sheet never appears

1. Confirm native build (not Expo Go)  
2. Confirm `appl_` key in the **binary** (rebuild after env change)  
3. Confirm sandbox account signed in  
4. Airplane mode off; App Store reachable  

### “Product not available” / empty offerings

1. Bundle ID match: ASC, RC, `app.json` all `com.christcalm.app`  
2. Offering **default** is **Current** in RC  
3. Packages point at **App Store** products `cc_*`, not only Test Store  
4. Wait a few minutes after ASC product edits; restart app  

### Purchase succeeds but app still free

1. `EXPO_PUBLIC_UNLOCK_ALL` must be `0`  
2. Entitlement id must be exactly `christcalm_premium` (case-sensitive)  
3. RC Customer shows entitlement?  
   - Yes → client/login/sync issue (`Purchases.logIn` user id)  
   - No → product not attached to entitlement (already fixed in project; re-check dashboard)  
4. Force refresh: kill app, reopen, or Restore  

### Sandbox asks for real Apple ID password constantly

- Use **Settings → App Store → Sandbox Account** only  
- Don’t mix production App Store sign-in for the purchase sheet  

### Build signing errors

```bash
# Open workspace and set Team
open frontend/ios/*.xcworkspace
```

Or use EAS so Expo manages certs:

```bash
cd frontend && eas build -p ios --profile preview
```

### Revert env after testing

```bash
CHRISTCALM_RC_MODE=preview ./scripts/sync-env-from-aws.sh
```

---

## 10. After sandbox works — App Store upload

Sandbox success ≠ public App Store. Full submit path (listing, EAS production, review, release):

→ **[ios-app-store-submit-manual.md](./ios-app-store-submit-manual.md)**

Also optional:

1. Customize RC Paywall → Publish  
2. Subscription review screenshots: `assets/store/subscription-review/`  
3. Keep `UNLOCK_ALL=0` and `appl_` key for production (EAS `production` profile)

---

## 11. Progress tracker (print / check off)

- [ ] Sandbox tester created in ASC  
- [ ] iPhone Sandbox Account signed in  
- [ ] `CHRISTCALM_RC_MODE=appstore` env verified (`appl_` + `UNLOCK_ALL=0`)  
- [ ] Native build installed (local USB **or** EAS)  
- [ ] Signed into ChristCalm account  
- [ ] Paywall shows prices  
- [ ] Sandbox purchase completed  
- [ ] RC Customers shows `christcalm_premium`  
- [ ] App shows premium  
- [ ] (Optional) Backend / subscription status premium  
- [ ] Env switched back to preview if desired  

---

## Related docs in this repo

| Doc | Role |
|-----|------|
| [revenuecat-sdk-integration.md](./revenuecat-sdk-integration.md) | SDK code map |
| [revenuecat-ios-app-store-guide.md](./revenuecat-ios-app-store-guide.md) | Full ASC + RC creation guide |
| [revenuecat-e2e-testing.md](./revenuecat-e2e-testing.md) | Automated/API checks |
| `config/auth/revenuecat.example.json` | ID snapshot |
| `frontend/eas.json` | EAS env bake-in |
| `frontend/env.device.example` | Device env template |

---

**End of manual.** When the progress tracker is fully checked, iOS sandbox IAP for ChristCalm is complete.
