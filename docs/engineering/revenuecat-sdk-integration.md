# RevenueCat SDK integration — ChristCalm (React Native / Expo)

Complete client setup for **subscriptions**, **entitlements**, **Paywalls**, and **Customer Center**.

## 1. Install packages

```bash
cd frontend
npm install --save react-native-purchases react-native-purchases-ui
```

Already in this repo (pinned):

- `react-native-purchases@10.4.1`
- `react-native-purchases-ui@10.4.1`

Docs: [React Native installation](https://www.revenuecat.com/docs/getting-started/installation/reactnative#installation)

**Expo note:** StoreKit / Play Billing need a **development build or TestFlight**, not Expo Go web. After installing native modules:

```bash
npx expo prebuild --platform ios
npx expo run:ios
```

---

## 2. Environment (public keys only)

### Quick switch (recommended)

```bash
# Local web / content preview — Test Store + unlock all
./scripts/sync-env-from-aws.sh

# Physical device StoreKit sandbox / EAS — appl_ key + paywall ON
CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh
```

| Mode | Key | `UNLOCK_ALL` | Use for |
|------|-----|--------------|---------|
| `preview` (default) | `test_…` | `1` | Web, content QA |
| `appstore` | `appl_…` | `0` | Device IAP, TestFlight, App Store |

Also: `frontend/env.device.example`, `frontend/eas.json` profiles `preview` / `production` bake in `appl_` + `UNLOCK_ALL=0`.

Never put `sk_` secret keys in the app.

### Device sandbox purchase (next step after config)

Verified live (2026-07):

- ASC app `6788769964` · bundle `com.christcalm.app`
- Apple Server Notifications **V2** → RevenueCat (prod + sandbox)
- RC App Store app: IAP key ✓ · ASC API key ✓
- Products `cc_999_1m`, `cc_5999_1y`, `cc_3999_1y`, and `cc_1999_1y` on the entitlement + current offering
- Webhook → Lambda API

**Full click-by-click + command manual:**  
→ **[ios-sandbox-iap-manual.md](./ios-sandbox-iap-manual.md)** (sandbox tester, env, USB/EAS build, purchase, verify).

---

## 3. Product catalog (RevenueCat dashboard)

| Role | Identifier |
|------|------------|
| Entitlement | `christcalm_premium` |
| Offering (current) | `default` |
| Package monthly | `$rc_monthly` |
| Package annual full | `$rc_annual` |
| Package annual mid | `$rc_custom_annual_mid` |
| Package annual low | `$rc_custom_annual_low` |
| App Store monthly | `cc_999_1m` |
| App Store annual full / mid / low | `cc_5999_1y` / `cc_3999_1y` / `cc_1999_1y` |

App code maps the four active product ids in `constants.ts`. All unlock the same entitlement; there is no free trial.

---

## 4. Code map

| File | Responsibility |
|------|----------------|
| `src/features/subscriptions/constants.ts` | Entitlement, offering, product ids |
| `src/features/subscriptions/RevenueCatContext.tsx` | Configure, login, purchase, paywall, customer center |
| `src/features/subscriptions/use-premium.ts` | Premium gating helpers |
| `app/_layout.tsx` | Wraps tree in `RevenueCatProvider` |
| `app/paywall.tsx` | Branded feature shell + RevenueCat Paywalls checkout |
| `app/(tabs)/profile.tsx` | Upgrade + Customer Center |

---

## 5. Configure + identify user

```tsx
// Already in RevenueCatProvider — called once
Purchases.configure({
  apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY!,
  appUserID: cognitoUserId || undefined,
});

// On sign-in
await Purchases.logIn(cognitoUserId);

// On sign-out
await Purchases.logOut();
```

Best practice: use a **stable** backend user id (Cognito `sub`), not email.

---

## 6. Entitlement check

```tsx
import { ENTITLEMENT_ID } from "@/src/features/subscriptions";
import { useRevenueCat, usePremium } from "@/src/features/subscriptions";

// Low-level
const { customerInfo, isPremium } = useRevenueCat();
const active = Boolean(customerInfo?.entitlements.active[ENTITLEMENT_ID]);

// App-level (includes UNLOCK_ALL + backend mirror)
const { isPremium, storePremium } = usePremium();
```

---

## 7. Purchase packages

```tsx
const { purchase, getPackage, restore } = useRevenueCat();

await purchase("annualFull");  // or "annualMid", "annualLow", "monthly"
await restore();
```

Internally uses `Purchases.purchasePackage(pkg)` with packages from the **current offering**.

---

## 8. RevenueCat Paywalls

```tsx
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

// Via context (preferred)
const { presentPaywall, presentPaywallIfNeeded } = useRevenueCat();
await presentPaywall();
await presentPaywallIfNeeded(); // only if christcalm_premium inactive
```

Docs: [Displaying paywalls](https://www.revenuecat.com/docs/tools/paywalls)

Customize UI in **RC Dashboard → Paywalls → Publish**. Until published, SDK shows the **default package paywall**.

ChristCalm keeps a branded `/paywall` feature shell. Its subscribe action opens RevenueCat Paywalls UI for offering `default`; the onboarding ladder purchases its tier-specific package directly. Profile routes non-premium users to `/paywall` and opens Customer Center for active members.

---

## 9. Customer Center

```tsx
const { presentCustomerCenter } = useRevenueCat();
await presentCustomerCenter();
```

Docs: [Customer Center (React Native)](https://www.revenuecat.com/docs/tools/customer-center/customer-center-react-native)

Profile → **Manage Subscription** opens Customer Center (cancel / change plan / restore / refunds on iOS).

---

## 10. Customer info listener

SDK already registers:

```tsx
Purchases.addCustomerInfoUpdateListener((info) => {
  // updates isPremium + syncs backend
});
```

Force refresh:

```tsx
const { refresh } = useRevenueCat();
await refresh();
```

---

## 11. Error handling

Context maps `PurchasesError` codes to user-facing strings (cancel silent, network, product unavailable, etc.). UI surfaces them via `error` / `ErrorBanner`.

Always treat **user cancellation** as non-fatal.

---

## 12. Best practices checklist

- [x] Public API key only in client  
- [x] Single entitlement for all premium access  
- [x] Current offering with `$rc_*` packages  
- [x] `logIn` with stable app user id  
- [x] CustomerInfo listener  
- [x] Restore purchases  
- [x] Backend webhook / sync for `is_premium`  
- [x] Paywalls UI + Customer Center  
- [ ] Use `appl_` key on device builds for real ASC products  
- [ ] Set `EXPO_PUBLIC_UNLOCK_ALL=0` for real gating tests  

---

## 13. Verify install

```bash
cd frontend
npm ls react-native-purchases react-native-purchases-ui
npx tsc --noEmit
```

Config smoke (server-side catalog):

```bash
export REVENUECAT_API_KEY=sk_…
python3 scripts/e2e/revenuecat_config_check.py
```

Device E2E: [revenuecat-e2e-testing.md](./revenuecat-e2e-testing.md)
