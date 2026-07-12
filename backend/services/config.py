"""Load configuration from SSM Parameter Store on Lambda, or process env locally.

Canonical templates and API requirements live under the repo `config/` folder.
"""

from __future__ import annotations

import os
from pathlib import Path

_LOADED = False

# Keys loaded from SSM when SSM_PREFIX is set (Lambda).
SSM_KEYS = (
    "JWT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "CORS_ORIGINS",
    "LLM_PROVIDER",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "BEDROCK_MODEL_ID",
    "BEDROCK_MODEL_IDS",
    "BEDROCK_INFERENCE_GEO",
    "REVENUECAT_WEBHOOK_AUTHORIZATION",
    "REVENUECAT_ENTITLEMENT_ID",
    "RATE_LIMIT_AUTH",
    "RATE_LIMIT_AI",
)


def bootstrap() -> None:
    global _LOADED
    if _LOADED:
        return

    # Local: load backend/.env if present (never override already-set env).
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.is_file():
        try:
            from dotenv import load_dotenv

            load_dotenv(env_path, override=False)
        except ImportError:
            pass

    prefix = os.environ.get("SSM_PREFIX", "").rstrip("/")
    if prefix:
        import boto3
        from botocore.exceptions import ClientError

        ssm = boto3.client("ssm", region_name=os.environ.get("AWS_REGION", "us-east-1"))
        for key in SSM_KEYS:
            if os.environ.get(key):
                continue
            try:
                resp = ssm.get_parameter(Name=f"{prefix}/{key}", WithDecryption=True)
                os.environ[key] = resp["Parameter"]["Value"]
            except ClientError:
                pass

    # Sensible defaults for non-secret config
    os.environ.setdefault("LLM_PROVIDER", "bedrock")
    # Working models only (Converse-probed). First success wins.
    os.environ.setdefault("BEDROCK_INFERENCE_GEO", "us")
    os.environ.setdefault("BEDROCK_MODEL_ID", "openai.gpt-oss-20b-1:0")
    os.environ.setdefault(
        "BEDROCK_MODEL_IDS",
        ",".join(
            [
                "openai.gpt-oss-20b-1:0",  # primary
                "us.amazon.nova-micro-v1:0",
                "us.amazon.nova-lite-v1:0",
                "us.amazon.nova-2-lite-v1:0",
                "us.meta.llama3-1-8b-instruct-v1:0",
                "mistral.mistral-large-2402-v1:0",
                "us.meta.llama3-1-70b-instruct-v1:0",
                "us.meta.llama3-3-70b-instruct-v1:0",
                "us.amazon.nova-pro-v1:0",
                "us.deepseek.r1-v1:0",
                "us.mistral.pixtral-large-2502-v1:0",
            ]
        ),
    )
    os.environ.setdefault("REVENUECAT_ENTITLEMENT_ID", "christcalm_premium")

    _LOADED = True


def require_jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET", "").strip()
    if not secret or secret in ("unset", "dev-only-change-me") and os.environ.get("SSM_PREFIX"):
        # Allow weak secret only outside AWS; on Lambda with SSM, fail closed if still placeholder
        if os.environ.get("SSM_PREFIX") and secret in ("", "unset", "dev-only-change-me"):
            raise RuntimeError("JWT_SECRET is not configured in SSM")
    if not secret:
        raise RuntimeError("JWT_SECRET is required")
    return secret
