# RevenueCat + App Store — end-to-end testing framework

How to verify ChristCalm subscriptions yourself (no guesswork).

## Architecture under test

```
iOS device / TestFlight
  → RevenueCat SDK (appl_… key)
  → App Store sandbox / production
  → RevenueCat servers (entitlements)
  → (optional) Webhook → Lambda → DynamoDB is_premium
  → Custom /paywall UI  OR  RevenueCatUI.presentPaywall
```

| Layer | Production identifiers |
|-------|------------------------|
| Bundle ID | `com.christcalm.app` |
| Public SDK key | `appl_cccgVPkKesnGrFTnzfXMEjQvfRA` |
| Entitlement | `christcalm_premium` |
| Offering | `default` (current) |
| Packages | `$rc_annual` → `cc_1999_1y_1w0`, `$rc_monthly` → `cc_999_1m` |
| Paywall (RC) | `pw8ae5b0bdce044611` on offering `default` |
| Webhook | `{api_url}api/revenuecat/webhook` |

---

## 1. Automated config smoke tests (laptop)

Runs without a device. Checks RC + ASC + backend wiring.

```bash
# From repo root (needs AWS + ASC key already on machine)
python3 scripts/e2e/revenuecat_config_check.py
```

What it asserts:

1. RC project has App Store app `com.christcalm.app`
2. Products `cc_999_1m` and `cc_1999_1y_1w0` exist on that app
3. Both attach to entitlement `christcalm_premium`
4. Offering `default` is current and packages map to those products
5. Paywall exists for the offering
6. Webhook URL points at your API
7. Backend `/api/health` is up
8. SSM has `REVENUECAT_WEBHOOK_AUTHORIZATION` set

---

## 2. Backend webhook unit path

```bash
# Simulate RevenueCat webhook (uses secret from SSM)
python3 scripts/e2e/revenuecat_webhook_smoke.py --user-id YOUR_COGNITO_SUB
```

Creates a fake INITIAL_PURCHASE payload with entitlement `christcalm_premium` and checks API user becomes premium (or DynamoDB flag).

---

## 3. Device / sandbox E2E (you run this)

### Prerequisites

- [ ] Apple Paid Apps agreement **Active**
- [ ] Products **Ready to Submit** (or cleared for sale)
- [ ] Sandbox tester: ASC → Users and Access → Sandbox → Testers
- [ ] **Development or TestFlight build** (not Expo web; IAP needs native)
- [ ] `EXPO_PUBLIC_UNLOCK_ALL=0` in the build env
- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_…`
- [ ] Sign into app with a **normal** Cognito user (not unlock-all test email if you want real gating)

### Build

```bash
cd frontend
npx expo prebuild --platform ios   # if needed
npx expo run:ios --device
# or: eas build --profile development --platform ios
```

### Manual checklist (print & tick)

| # | Step | Pass? |
|---|------|-------|
| 1 | Launch app, sign in | ☐ |
| 2 | Settings → App Store → Sandbox Account = your sandbox Apple ID | ☐ |
| 3 | Trigger paywall (complete a free meditation or Profile → Upgrade) | ☐ |
| 4 | Custom paywall shows Annual + Monthly with **Store prices** (not only placeholders) | ☐ |
| 5 | Tap **More plans (RevenueCat paywall)** → native RC UI opens | ☐ |
| 6 | Purchase **Annual** (sandbox) → StoreKit sheet → success | ☐ |
| 7 | Entitlement: premium content unlocked; Profile shows premium | ☐ |
| 8 | Kill app, relaunch → still premium (CustomerInfo cache + restore) | ☐ |
| 9 | Restore Purchases on a fresh install / reinstall | ☐ |
| 10 | RC Dashboard → Customer → sandbox user shows `christcalm_premium` active | ☐ |
| 11 | Backend: `GET /api/auth/me` (or profile) has `is_premium: true` after webhook/sync | ☐ |
| 12 | Cancel sandbox sub in Settings → after expiry, premium ends (or use RC grant/revoke) | ☐ |

### Debug logging

In `__DEV__`, SDK log level is `DEBUG`. Watch Xcode / Metro for:

- `Offerings`
- `Purchasing product`
- `CustomerInfo`

---

## 4. RevenueCat dashboard checks

1. **Product catalog → Products** — App Store products green / not erroring  
2. **Offerings → default** — Current; packages linked  
3. **Paywalls** — Default Paywall attached to `default`  
   - Open editor → customize colors/copy → **Publish** (remote UI only appears after publish; until then SDK shows **default package paywall**)  
4. **Customers** — find sandbox `app_user_id` (your Cognito user id)  
5. **Charts** — sandbox events may be delayed  

### Optional RC-only tests (no ASC charge)

Use **Test Store** app + `test_…` public key in a separate debug build if you only want package UI without StoreKit. Production path uses `appl_` + real ASC products.

---

## 5. What “fully leverage RevenueCat” means for this app

| Capability | How ChristCalm uses it |
|------------|-------------------------|
| Entitlements | Single `christcalm_premium` |
| Offerings / packages | `default` with monthly + annual |
| Custom paywall | Branded `app/paywall.tsx` (primary UX) |
| RC Paywalls | `RevenueCatUI.presentPaywall` via “More plans” + experiments |
| Webhooks | Sync `is_premium` to DynamoDB |
| Customer identity | `Purchases.logIn(userId)` with Cognito user id |
| Experiments / Targeting | Create extra offerings in RC dashboard; no app release needed if using remote paywall |

**Do you need RC Paywalls in the app?**  
- **Yes**, if you want dashboard-driven UI / A-B without shipping a new binary.  
- **No**, if you only use the branded custom paywall + `purchasePackage` (already enough for production IAP).  
We integrated **both**: custom screen remains default; remote paywall is one tap away and ready for experiments.

---

## 6. Common failures

| Symptom | Fix |
|---------|-----|
| Empty offerings | Wrong API key · offline · products not attached to packages |
| Product not available | ASC product not Ready / agreements / wrong sandbox account |
| Premium in RC, free in app | Wrong entitlement id · `UNLOCK_ALL` · `logIn` user id mismatch |
| Webhook 401 | SSM secret ≠ RC Authorization header |
| Screenshot IMAGE_INCORRECT_DIMENSIONS | Use 1242×2688 PNG under `assets/store/subscription-review/*-1242.png` |

---

## 7. Script index

| Script | Purpose |
|--------|---------|
| `scripts/e2e/revenuecat_config_check.py` | Config smoke (RC + API) |
| `scripts/e2e/revenuecat_webhook_smoke.py` | Webhook → backend premium |
| `docs/engineering/revenuecat-ios-app-store-guide.md` | Full setup guide |
| `config/auth/revenuecat.example.json` | Live ID snapshot |
