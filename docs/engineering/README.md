# Engineering notes

Stack-specific testing for the **current** reference app: [testing.md](testing.md).

RevenueCat + App Store paywall (iOS): [revenuecat-ios-app-store-guide.md](revenuecat-ios-app-store-guide.md).  
SDK integration (client): [revenuecat-sdk-integration.md](revenuecat-sdk-integration.md).  
E2E testing framework: [revenuecat-e2e-testing.md](revenuecat-e2e-testing.md).  
**Manual device sandbox IAP (step-by-step):** [ios-sandbox-iap-manual.md](ios-sandbox-iap-manual.md).  
**Manual App Store submit (upload + review):** [ios-app-store-submit-manual.md](ios-app-store-submit-manual.md).

**Device IAP env:** `CHRISTCALM_RC_MODE=appstore ./scripts/sync-env-from-aws.sh` then `cd frontend && npx expo run:ios --device`  
(or `eas build -p ios --profile preview` — `eas.json` uses `appl_` + `UNLOCK_ALL=0`).

Product rebuild guidance (any stack): [`../product/11-rebuild-playbook.md`](../product/11-rebuild-playbook.md)
