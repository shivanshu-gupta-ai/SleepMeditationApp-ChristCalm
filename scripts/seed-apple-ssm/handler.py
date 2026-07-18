"""One-shot Lambda: write Apple Sign-In secrets to SSM, then exit.

Deployed only by scripts/seed-apple-ssm-once.sh and deleted immediately after invoke.
Secrets are passed as environment variables at create-time (never committed).
"""

from __future__ import annotations

import json
import os

import boto3


def handler(event, context):
    prefix = (os.environ.get("SSM_PREFIX") or "").rstrip("/")
    if not prefix.startswith("/"):
        prefix = f"/{prefix}"

    pairs = {
        "APPLE_SERVICES_ID": os.environ.get("APPLE_SERVICES_ID", "").strip(),
        "APPLE_TEAM_ID": os.environ.get("APPLE_TEAM_ID", "").strip(),
        "APPLE_KEY_ID": os.environ.get("APPLE_KEY_ID", "").strip(),
        "APPLE_PRIVATE_KEY": os.environ.get("APPLE_PRIVATE_KEY", "").strip(),
    }

    missing = [k for k, v in pairs.items() if not v]
    if missing:
        return {
            "statusCode": 400,
            "body": json.dumps({"ok": False, "missing": missing}),
        }

    if "BEGIN PRIVATE KEY" not in pairs["APPLE_PRIVATE_KEY"]:
        return {
            "statusCode": 400,
            "body": json.dumps({"ok": False, "error": "APPLE_PRIVATE_KEY must be PEM"}),
        }

    ssm = boto3.client("ssm")
    written = []
    for key, value in pairs.items():
        name = f"{prefix}/{key}"
        ssm.put_parameter(
            Name=name,
            Value=value,
            Type="SecureString",
            Overwrite=True,
        )
        written.append(name)

    return {
        "statusCode": 200,
        "body": json.dumps({"ok": True, "written": written}),
    }
