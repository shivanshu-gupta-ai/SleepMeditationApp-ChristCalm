# ChristCalm — Manual App Store submission guide

**Purpose:** Step-by-step **human** checklist to upload ChristCalm to the **public App Store** (or TestFlight first), including the first in-app subscriptions.

**Prerequisite:** Finish sandbox IAP first →  
**[ios-sandbox-iap-manual.md](./ios-sandbox-iap-manual.md)**  
(device purchase works with `appl_` key and `UNLOCK_ALL=0`).

**Time:** Often 1–3 hours of work + **1–7+ days** waiting on Apple Review.

**Outcome:** Build uploaded → version + IAPs submitted → Approved → Released (or Ready for Sale).

---

## 0. What “upload to App Store” actually means

Three different milestones:

| Milestone | Where users get the app | This guide section |
|-----------|-------------------------|---------------------|
| **A. TestFlight (internal)** | You + team | §5–6 (build + submit) |
| **B. Submit for App Review** | Reviewers only | §7–9 |
| **C. Released on App Store** | Public download | §10 |

Sandbox IAP alone is **not** C. This document is A → B → C.

---

## 1. Fixed identifiers (do not invent new ones)

| Item | Value |
|------|--------|
| App name (ASC) | Christ Calm |
| ASC App ID | `6788769964` |
| Bundle ID | `com.christcalm.app` |
| Marketing version (`app.json`) | `1.0.0` (bump when you ship a new store version) |
| Entitlement | `christcalm_premium` |
| Monthly IAP | `cc_999_1m` (~$9.99) |
| Annual IAPs | `cc_5999_1y` ($59.99), `cc_3999_1y` ($39.99), `cc_1999_1y` ($19.99); no trial |
| Subscription group | ChristCalm Premium |
| RC public key (device/prod) | `appl_cccgVPkKesnGrFTnzfXMEjQvfRA` |
| API | `https://u2r7gwyg3j.execute-api.us-east-1.amazonaws.com` |
| IAP review assets | `assets/store/subscription-review/` |

---

## 2. Pre-flight (do this before you build)

### 2.1 Product / legal readiness

- [ ] Privacy Policy URL live on a public HTTPS page (required for subscriptions)
- [ ] Support URL or support email that works
- [ ] Age rating decided (faith/wellness — typically 4+ or 12+ depending on content; answer ASC questionnaire honestly)
- [ ] You know what is free vs premium in the app (with `UNLOCK_ALL=0`)

> If you do not have a privacy policy URL yet, create a simple page on your marketing site (what data you collect: email/account, optional analytics, meditation usage; that journal stays private; payments via Apple; etc.). Apple rejects apps that claim “no data” while using Cognito + analytics + IAP.

### 2.2 Confirm IAP status in App Store Connect

1. Open [App Store Connect](https://appstoreconnect.apple.com/)
2. **Apps → Christ Calm**
3. **Subscriptions** → group **ChristCalm Premium**
4. Confirm all active products exist and are **Ready to Submit** (or clear of missing metadata):
   - `cc_999_1m`
   - `cc_5999_1y`
   - `cc_3999_1y`
   - `cc_1999_1y`
5. For **each** product, open **Review Information**:
   - [ ] Screenshot uploaded (use repo assets below)
   - [ ] Optional review notes

**Repo screenshots (subscription review — not listing screenshots):**

```text
assets/store/subscription-review/monthly-review-1242.png   # for monthly
assets/store/subscription-review/annual-review-1242.png    # legacy; replace before submission
```

Upload path: ASC → product → **Review Information** → screenshot.

Also see: `assets/store/subscription-review/README.md`.

### 2.3 Confirm RevenueCat (quick)

1. [RevenueCat](https://app.revenuecat.com) → ChristCalm  
2. Offering **default** is **Current**  
3. Packages map to the four active App Store products listed above
4. Entitlement `christcalm_premium` attached  
5. You already completed a **sandbox** purchase on device (manual above)

### 2.4 Confirm production env flags

Production / TestFlight builds **must** use:

| Variable | Value |
|----------|--------|
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | `appl_…` (not `test_`) |
| `EXPO_PUBLIC_UNLOCK_ALL` | `0` |

These are already set in `frontend/eas.json` profiles **`preview`** and **`production`**.

Local verify before a manual archive:

```bash
cd /path/to/ChristCalmApp
CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh
grep -E 'REVENUECAT_IOS|UNLOCK' frontend/.env
# expect: appl_… and UNLOCK_ALL=0
```

---

## 3. App Store listing content (fill in ASC)

Open **Apps → Christ Calm → App Store** tab (or the version you will submit).

### 3.1 Create / select a version

1. If no version: **+ Version** or **Add Platform** → iOS  
2. Version string should match marketing version, e.g. **1.0.0**  
3. You will attach a **build** later (§6)

### 3.2 Metadata to complete (checklist)

For each **locale** you ship (at least **English (U.S.)**):

| Field | Notes for ChristCalm |
|-------|----------------------|
| **Name** | Up to 30 chars — e.g. `ChristCalm` or `Christ Calm` |
| **Subtitle** | Short benefit line |
| **Description** | What the app does; free vs Premium; **no medical/clinical claims** |
| **Keywords** | Comma-separated; no competitor trademark spam |
| **Support URL** | Required — working page or form |
| **Marketing URL** | Optional |
| **Privacy Policy URL** | **Required** for IAP / accounts |
| **Promotional text** | Optional; editable without new version |
| **What's New** | For 1.0: “Initial release” is fine |

Suggested tone: calm, faith-based wellness, Scripture-guided meditation — not clinical therapy.

### 3.3 Category & rating

- [ ] Primary category (e.g. **Health & Fitness** or **Lifestyle**)  
- [ ] Secondary optional  
- [ ] Age Rating questionnaire completed  

### 3.4 App Privacy (“nutrition labels”)

**App Store → App Privacy → Edit**

Declare data you actually collect, for example (adjust to your real practices):

| Type | Typical for ChristCalm | Linked to user? | Used for tracking? |
|------|------------------------|-----------------|---------------------|
| Email / name | Cognito account | Yes | Usually No |
| Product interaction | Analytics events, usage | Yes / optional | No if not ad tracking |
| Purchases | Apple / RevenueCat | Yes | No |
| Audio | Only if user uses Wisdom voice | Yes | No |
| Crash / diagnostics | If you add any | No | No |

Be accurate. Over-declaring is safer than under-declaring if you truly collect it.

### 3.5 App Store **listing** screenshots (required)

These are **different** from IAP review screenshots.

Apple requires screenshots for at least one iPhone size class (requirements change; ASC will show missing items with a red badge).

Typical sizes (portrait) — use what ASC requests for your latest devices:

| Display | Example size |
|---------|----------------|
| 6.7" | 1290 × 2796 |
| 6.5" | 1284 × 2778 |
| 5.5" (legacy) | 1242 × 2208 |

**How to capture:**

1. Run the app on a simulator or device with `UNLOCK_ALL=1` if you only need pretty UI screens  
2. Or use `CHRISTCALM_RC_MODE=preview` for content  
3. Capture: Home, Meditate, Player, Wisdom, Paywall, Journal  

```bash
# Optional: local web or simulator for marketing shots (not for IAP proof)
cd /path/to/ChristCalmApp
CHRISTCALM_RC_MODE=preview ./scripts/sync-env-from-aws.sh
./scripts/preview.sh
# or: cd frontend && npx expo run:ios   # simulator
```

Upload under the version → **App Previews and Screenshots**.

### 3.6 App icon

- Source in repo: `frontend/assets/images/icon.png`  
- ASC uses the icon from the **binary**; ensure `app.json` points at the correct asset (already set)

---

## 4. App Review information (account + notes)

Under the version → **App Review Information**:

| Field | What to put |
|-------|-------------|
| **Sign-in required** | Yes (Cognito) |
| **Demo username** | Create a dedicated reviewer account, e.g. `apple-review@yourdomain.com` |
| **Demo password** | Strong password; keep account free + premium path testable |
| **Contact** | Your real email + phone |
| **Notes** | See template below |

### 4.1 Create a review demo account

```bash
# In the app on device/sim, or use Cognito sign-up in the app UI.
# Use an email you control. Complete onboarding.
```

Optional: seed via your existing test tooling if you have it; otherwise sign up normally in TestFlight build.

### 4.2 Review notes template (copy and adapt)

```text
ChristCalm is a Christian meditation and wellness app.

SIGN-IN
• Use the provided demo account (email/password).
• Onboarding can be completed quickly by selecting any options.

SUBSCRIPTIONS (Sandbox)
• Premium unlocks unlimited meditations, Wisdom, and related features.
• Products: cc_999_1m monthly; cc_5999_1y, cc_3999_1y, and cc_1999_1y annual. No active product has a free trial.
• Billing is via Apple In-App Purchase / StoreKit. RevenueCat manages entitlements.
• To test paywall: complete onboarding and sign in; the app then opens the hard premium gate.
• UNLOCK_ALL is disabled in this build; signed-in non-premium users see the hard premium gate.

VOICE
• Microphone is used only when the user chooses voice input for Wisdom chat.
• NSMicrophoneUsageDescription is set in Info.plist.

BACKEND
• API is hosted on AWS (API Gateway + Lambda). App requires network.
```

---

## 5. Build a **production** iOS binary

Use **EAS** (recommended) so signing and upload are simpler.

### 5.1 One-time EAS setup

```bash
cd /path/to/ChristCalmApp/frontend

npm install -g eas-cli   # if needed
eas login
eas whoami

# Link project if first time (follow prompts)
eas build:configure     # only if eas.json not already present — we already have eas.json
```

Confirm `frontend/eas.json` has:

- profile **`production`**: `UNLOCK_ALL=0`, `appl_` key, Cognito + API URLs  
- submit **`production`**: `"ascAppId": "6788769964"`

### 5.2 Version numbers

- Marketing version: `frontend/app.json` → `"version": "1.0.0"`  
- Build number: EAS `production` has `"autoIncrement": true` (recommended)  

To bump marketing version for a new store release:

```bash
# Edit frontend/app.json "version" to 1.0.1, 1.1.0, etc.
```

### 5.3 Start the production build

```bash
cd /path/to/ChristCalmApp/frontend

# Optional: ensure local .env matches (EAS uses eas.json env for cloud builds)
# CHRISTCALM_RC_MODE=appstore is not required for EAS production if eas.json is correct

npm run build:ios:production
# equivalent:
# eas build -p ios --profile production
```

- Wait for Expo dashboard: [expo.dev](https://expo.dev) → your project → Builds  
- Build must finish **Succeeded**  
- Download or keep the `.ipa` on Expo (submit can pull it automatically)

### 5.4 Alternate: local archive (advanced)

Only if you prefer Xcode:

```bash
cd /path/to/ChristCalmApp
CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh
cd frontend
npx expo prebuild --platform ios --clean
# Open Xcode → Product → Archive → Distribute App → App Store Connect
open ios/*.xcworkspace
```

EAS path is preferred for this monorepo.

---

## 6. Upload the build to App Store Connect

### 6.1 Submit with EAS

```bash
cd /path/to/ChristCalmApp/frontend

# After production build succeeds:
npm run submit:ios
# equivalent:
# eas submit -p ios --profile production
```

Follow prompts:

- Use latest production build  
- Apple credentials / App Store Connect API key as EAS asks  
- Target app **Christ Calm** (`6788769964`)

### 6.2 Wait for processing

1. ASC → **Christ Calm** → **TestFlight** tab  
2. Build appears as **Processing** (10–60+ minutes)  
3. Then **Ready to Test** or available to select for App Store version  

Missing compliance?

- Answer **Export Compliance** (encryption): standard HTTPS-only apps usually select the exemption that applies to your case — read carefully  
- Complete **Missing Compliance** on the build if ASC banners it  

### 6.3 (Optional) TestFlight internal test before review

1. TestFlight → Internal Testing → add yourself  
2. Install via TestFlight app on iPhone  
3. Smoke test: sign-in, meditate, paywall, **sandbox** purchase still works  
4. Only then proceed to App Review  

---

## 7. Attach build + subscriptions to the App Store version

1. ASC → **Christ Calm** → **App Store** tab  
2. Open version **1.0.0** (or your version)  
3. **Build** → **+** → select the processed build  
4. Scroll to **In-App Purchases and Subscriptions** (wording varies):  
   - [ ] Add **`cc_999_1m`**  
   - [ ] Add **`cc_5999_1y`**
   - [ ] Add **`cc_3999_1y`**
   - [ ] Add **`cc_1999_1y`**

> **Important:** The **first** subscription for an app is typically submitted **together with a new app version**. Do not leave IAPs out of this first submit.

5. Complete any remaining yellow/red checklist items ASC shows  
6. **Save**

---

## 8. Final submit for review

1. On the version page, click **Add for Review** / **Submit to App Review**  
2. Confirm:
   - [ ] Screenshots present  
   - [ ] Privacy policy URL  
   - [ ] Demo account  
   - [ ] Build selected  
   - [ ] Both subscriptions selected  
3. Submit  

Status becomes **Waiting for Review** → **In Review** → **Pending Developer Release** or **Ready for Sale** or **Rejected**.

---

## 9. During / after review

### 9.1 If approved

- **Pending Developer Release:** ASC → version → **Release This Version**  
- **Automatic release:** goes live after processing  

### 9.2 If rejected

1. Read Resolution Center carefully  
2. Common issues for this app type:
   - Privacy policy missing / incomplete  
   - Subscription terms not clear (price, period, free trial)  
   - Demo account broken  
   - Guideline 3.1.2 — unclear auto-renewable subscription info  
   - Login required with no working demo account  
3. Fix app and/or metadata → new build if code change → resubmit  

### 9.3 After go-live

- [ ] Install from App Store on a fresh device  
- [ ] Production purchase with a **real** Apple ID (you will be charged — use wisely)  
- [ ] Confirm RevenueCat customer is **Production** environment  
- [ ] Confirm webhook / backend premium  
- [ ] Monitor ASC **Sales and Trends** and RC **Overview**

---

## 10. Command cheat sheet (App Store path)

```bash
# 0) Sandbox IAP must already work — see ios-sandbox-iap-manual.md

# 1) Production-aligned local env (optional for EAS; required for local archive)
cd /path/to/ChristCalmApp
CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh
grep -E 'REVENUECAT_IOS|UNLOCK' frontend/.env

# 2) Production build
cd frontend
eas login
npm run build:ios:production

# 3) Upload to ASC
npm run submit:ios

# 4) Then in App Store Connect UI:
#    - Attach build to version 1.0.0
#    - Attach subscriptions cc_999_1m + cc_5999_1y + cc_3999_1y + cc_1999_1y
#    - Complete metadata + privacy + review notes
#    - Submit for Review
```

---

## 11. Progress tracker

### Before build
- [ ] Privacy Policy URL live  
- [ ] Support URL/email  
- [ ] Current IAP review screenshots attached to all four active products
- [ ] Sandbox purchase already succeeded once  
- [ ] Listing copy drafted  

### Build & upload
- [ ] EAS production build succeeded  
- [ ] `eas submit` completed  
- [ ] Build processed in TestFlight  
- [ ] Export compliance answered  

### Listing & review
- [ ] Screenshots for App Store listing uploaded  
- [ ] Description / keywords / category  
- [ ] App Privacy labels filled  
- [ ] Demo account works  
- [ ] Review notes pasted  
- [ ] Build attached to version  
- [ ] Both subscriptions attached to version  
- [ ] Submitted for Review  

### After approval
- [ ] Released  
- [ ] Live install smoke test  
- [ ] Production purchase / RC production customer checked (optional)  

---

## 12. What this guide does **not** cover

| Topic | Where |
|-------|--------|
| First-time ASC product creation | [revenuecat-ios-app-store-guide.md](./revenuecat-ios-app-store-guide.md) |
| Device sandbox purchase | [ios-sandbox-iap-manual.md](./ios-sandbox-iap-manual.md) |
| SDK code | [revenuecat-sdk-integration.md](./revenuecat-sdk-integration.md) |
| Android / Play Billing | Not in scope (iOS-only) |
| Apple Sign-In IdP | Separate (optional; not required for IAP submit) |

---

## 13. Honest expectations

| You complete… | Users can… |
|---------------|------------|
| Sandbox manual only | Test IAP on your phone |
| This guide through TestFlight | Team test via TestFlight |
| This guide through **Release** | Download from the public App Store |

Apple can reject for metadata or policy even when IAP works perfectly. Budget time for one resubmit.

---

**End of App Store submission manual.**  
Start only after the sandbox checklist is fully green.
