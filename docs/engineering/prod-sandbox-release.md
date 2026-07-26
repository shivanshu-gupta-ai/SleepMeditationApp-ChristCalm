# Sandbox + App Store release path

## Modes

| Mode | Command / profile | RC key | `UNLOCK_ALL` | Use for |
|------|-------------------|--------|--------------|---------|
| Local preview | `./scripts/sync-env-from-aws.sh` + `./scripts/preview.sh` | `test_` | `1` | UI demos, no IAP |
| Device sandbox | `CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh` + `expo run:ios --device` | `appl_` | `0` | Real StoreKit sandbox purchases |
| TestFlight / store | EAS `production` profile | `appl_` | `0` | Real users |

## Rules (hard)

1. **Never** ship `EXPO_PUBLIC_UNLOCK_ALL=1` in App Store / TestFlight.
2. **Never** put RevenueCat **secret** (`sk_`) keys or Apple `.p8` in the app or git.
3. Premium in production = RevenueCat entitlement + webhook → DynamoDB `is_premium`.
4. `ALLOW_PREVIEW_TEST_PREMIUM` is for **local API only** — do not set on production Lambda.
5. Client public keys (`appl_` / `test_`) are OK in the binary; still prefer env per profile.

## Build & submit

```bash
cd frontend
npm run build:ios:production   # EAS production .ipa
npm run submit:ios             # App Store Connect / TestFlight
```

See also: `ios-sandbox-iap-manual.md`, `ios-app-store-submit-manual.md`.
