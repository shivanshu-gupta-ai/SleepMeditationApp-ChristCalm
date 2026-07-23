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

`frontend/.env`:

```bash
# Test Store (RC simulated products)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=test_iOFZidqNcAXQabRbTcHHYiAEKug

# Production / ASC sandbox device builds:
# EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_…

EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=christcalm_premium
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
EXPO_PUBLIC_REVENUECAT_PRODUCT_MONTHLY=cc_999_1m
EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL=cc_1999_1y_1w0

# 0 = real paywall gating
EXPO_PUBLIC_UNLOCK_ALL=0
```

Never put `sk_` secret keys in the app.

---

## 3. Product catalog (RevenueCat dashboard)

| Role | Identifier |
|------|------------|
| Entitlement | `christcalm_premium` |
| Offering (current) | `default` |
| Package monthly | `$rc_monthly` |
| Package annual | `$rc_annual` |
| App Store monthly | `cc_999_1m` |
| App Store annual | `cc_1999_1y_1w0` |
| Test Store aliases | `christcalm_monthly`, `christcalm_annual` |

App code maps **all four product ids** via `PRODUCT_ID_ALIASES` in `constants.ts`.

---

## 4. Code map

| File | Responsibility |
|------|----------------|
| `src/features/subscriptions/constants.ts` | Entitlement, offering, product ids |
| `src/features/subscriptions/RevenueCatContext.tsx` | Configure, login, purchase, paywall, customer center |
| `src/features/subscriptions/use-premium.ts` | Premium gating helpers |
| `app/_layout.tsx` | Wraps tree in `RevenueCatProvider` |
| `app/paywall.tsx` | Branded UI + “More plans” → RC Paywall |
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

await purchase("annual");  // or "monthly"
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

ChristCalm keeps a **branded** `/paywall` route as primary UX; remote paywall is available from:

- Paywall screen → “More plans (RevenueCat paywall)”
- Profile → “Unlock Premium” → `presentPaywallIfNeeded`

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
