#!/usr/bin/env python3
"""Smoke-check RevenueCat + ChristCalm API wiring (no StoreKit).

Usage:
  export REVENUECAT_API_KEY=sk_...
  python3 scripts/e2e/revenuecat_config_check.py

Optional:
  REVENUECAT_PROJECT_ID=proj43f1dce8
  API_BASE=https://....execute-api...amazonaws.com
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

PROJECT = os.environ.get("REVENUECAT_PROJECT_ID", "proj43f1dce8")
KEY = os.environ.get("REVENUECAT_API_KEY", "")
API_BASE = os.environ.get(
    "API_BASE", "https://u2r7gwyg3j.execute-api.us-east-1.amazonaws.com"
).rstrip("/")

EXPECTED_BUNDLE = "com.christcalm.app"
EXPECTED_ENTITLEMENT = "christcalm_premium"
EXPECTED_OFFERING = "default"
EXPECTED_PRODUCTS = {"cc_999_1m", "cc_1999_1y_1w0"}


def die(msg: str) -> None:
    print(f"FAIL: {msg}")
    sys.exit(1)


def ok(msg: str) -> None:
    print(f"OK   {msg}")


def rc(path: str):
    if not KEY:
        die("Set REVENUECAT_API_KEY=sk_… (v2 secret)")
    req = urllib.request.Request(
        f"https://api.revenuecat.com/v2{path}",
        headers={
            "Authorization": f"Bearer {KEY}",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        die(f"RC {path} → HTTP {e.code}: {e.read()[:300]!r}")


def main() -> None:
    apps = rc(f"/projects/{PROJECT}/apps").get("items") or []
    store_apps = [a for a in apps if a.get("type") == "app_store"]
    if not store_apps:
        die("No App Store app on project")
    app = next(
        (
            a
            for a in store_apps
            if (a.get("app_store") or {}).get("bundle_id") == EXPECTED_BUNDLE
        ),
        store_apps[0],
    )
    bundle = (app.get("app_store") or {}).get("bundle_id")
    if bundle != EXPECTED_BUNDLE:
        die(f"bundle_id {bundle} != {EXPECTED_BUNDLE}")
    ok(f"App Store app {app.get('id')} bundle={bundle}")
    store_cfg = app.get("app_store") or {}
    if store_cfg.get("app_store_connect_api_key_configured"):
        ok("ASC API key configured on RC app")
    else:
        print("WARN ASC API key not configured on RC (receipt import may be limited)")
    if store_cfg.get("subscription_key_configured"):
        ok("In-App Purchase (StoreKit 2) key configured on RC app")
    else:
        print("WARN subscription_key not configured — upload IAP .p8 in RC Apps & providers")

    products = rc(f"/projects/{PROJECT}/products").get("items") or []
    store_ids = {
        p.get("store_identifier")
        for p in products
        if p.get("app_id") == app.get("id")
    }
    missing = EXPECTED_PRODUCTS - store_ids
    if missing:
        die(f"Missing App Store products on RC app: {missing}")
    ok(f"Products present: {sorted(EXPECTED_PRODUCTS)}")

    ents = rc(f"/projects/{PROJECT}/entitlements").get("items") or []
    ent = next((e for e in ents if e.get("lookup_key") == EXPECTED_ENTITLEMENT), None)
    if not ent:
        die(f"Entitlement {EXPECTED_ENTITLEMENT} missing")
    ok(f"Entitlement {EXPECTED_ENTITLEMENT} id={ent.get('id')}")

    ent_prods = rc(f"/projects/{PROJECT}/entitlements/{ent['id']}/products").get("items") or []
    ent_store = {p.get("store_identifier") for p in ent_prods}
    if not EXPECTED_PRODUCTS.issubset(ent_store):
        die(f"Entitlement products incomplete: {ent_store}")
    ok("Entitlement attached to both products")

    offs = rc(f"/projects/{PROJECT}/offerings").get("items") or []
    off = next((o for o in offs if o.get("lookup_key") == EXPECTED_OFFERING), None)
    if not off:
        die("Offering default missing")
    if not off.get("is_current"):
        die("Offering default is not current")
    ok(f"Offering default current paywall_id={off.get('paywall_id')}")
    if not off.get("paywall_id"):
        print("WARN No paywall attached to offering (SDK will use default package UI)")

    pkgs = rc(f"/projects/{PROJECT}/offerings/{off['id']}/packages").get("items") or []
    if len(pkgs) < 2:
        die(f"Expected 2 packages, got {len(pkgs)}")
    ok(f"Packages: {[p.get('lookup_key') for p in pkgs]}")

    hooks = rc(f"/projects/{PROJECT}/integrations/webhooks").get("items") or []
    if not hooks:
        print("WARN No webhooks configured")
    else:
        urls = [h.get("url") for h in hooks]
        ok(f"Webhooks: {urls}")
        if not any(API_BASE in (u or "") for u in urls):
            print(f"WARN Webhook URL may not match API_BASE={API_BASE}")

    try:
        with urllib.request.urlopen(f"{API_BASE}/api/health", timeout=20) as resp:
            health = json.loads(resp.read().decode())
        if health.get("status") != "ok":
            die(f"API health bad: {health}")
        ok(f"API health ok ({API_BASE})")
    except Exception as e:
        die(f"API health failed: {e}")

    print("\nALL CONFIG CHECKS PASSED")


if __name__ == "__main__":
    main()
