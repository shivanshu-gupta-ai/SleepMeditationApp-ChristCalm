#!/usr/bin/env python3
"""POST a synthetic RevenueCat webhook to the live API.

Usage:
  export REVENUECAT_WEBHOOK_SECRET=...   # same as SSM REVENUECAT_WEBHOOK_AUTHORIZATION
  python3 scripts/e2e/revenuecat_webhook_smoke.py --user-id <cognito_sub_or_app_user_id>

Optional:
  API_BASE=https://....amazonaws.com
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

API_BASE = os.environ.get(
    "API_BASE", "https://u2r7gwyg3j.execute-api.us-east-1.amazonaws.com"
).rstrip("/")
SECRET = os.environ.get("REVENUECAT_WEBHOOK_SECRET", "")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--user-id", required=True, help="app_user_id / Cognito sub")
    p.add_argument(
        "--event",
        default="INITIAL_PURCHASE",
        help="INITIAL_PURCHASE | EXPIRATION | RENEWAL",
    )
    args = p.parse_args()
    if not SECRET:
        print("Set REVENUECAT_WEBHOOK_SECRET to match SSM", file=sys.stderr)
        sys.exit(1)

    active = args.event != "EXPIRATION"
    body = {
        "api_version": "1.0",
        "event": {
            "type": args.event,
            "id": f"e2e_{int(time.time())}",
            "app_user_id": args.user_id,
            "entitlement_ids": ["christcalm_premium"] if active else [],
            "entitlements": {"christcalm_premium": {"expires_date": None}} if active else {},
            "product_id": "cc_1999_1y_1w0",
            "store": "APP_STORE",
            "environment": "SANDBOX",
        },
    }
    # Backend accepts either nested event or flat — send flexible payload
    payload = {
        **body,
        "app_user_id": args.user_id,
        "type": args.event,
        "entitlement_ids": ["christcalm_premium"] if active else [],
        "product_id": "cc_1999_1y_1w0",
    }

    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{API_BASE}/api/revenuecat/webhook",
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SECRET}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(resp.status, resp.read().decode()[:500])
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:800])
        sys.exit(1)
    print("Webhook posted. Confirm user premium via app profile or DynamoDB.")


if __name__ == "__main__":
    main()
