"""Configuration: secrets from AWS SSM; local files never hold secrets.

Canonical flow
--------------
- **Lambda:** ``SSM_PREFIX`` is set on the function → all secrets/config from SSM.
- **Local API:** ``./scripts/run-backend-local.sh`` sets ``SSM_PREFIX`` and uses your
  AWS profile/SSO. Optional ``backend/.env`` may only contain non-secret flags
  (region, table prefix, SSM_PREFIX). Delete it anytime and re-run the script.
- **Frontend:** public Expo vars only, written by ``./scripts/sync-env-from-aws.sh``.

Templates: repo ``config/env/``. Secrets are created by Terraform → SSM
(``infrastructure/terraform/ssm.tf``).
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

_LOADED = False
logger = logging.getLogger("christcalm.config")

# Loaded from SSM when SSM_PREFIX is set (Lambda + local-with-SSM).
SSM_KEYS = (
    "CORS_ORIGINS",
    "COGNITO_USER_POOL_ID",
    "COGNITO_CLIENT_ID",
    "COGNITO_DOMAIN",
    "COGNITO_REGION",
    "APPLE_SERVICES_ID",
    "APPLE_TEAM_ID",
    "APPLE_KEY_ID",
    # APPLE_PRIVATE_KEY stays in SSM for Cognito/terraform only — not needed on Lambda
    "LLM_PROVIDER",
    "BEDROCK_MODEL_ID",
    "BEDROCK_MODEL_IDS",
    "BEDROCK_INFERENCE_GEO",
    "REVENUECAT_WEBHOOK_AUTHORIZATION",
    "REVENUECAT_ENTITLEMENT_ID",
    "RATE_LIMIT_AUTH",
    "RATE_LIMIT_AI",
)

# May appear in local backend/.env only (never secrets).
_LOCAL_NON_SECRET_KEYS = frozenset(
    {
        "AWS_REGION",
        "AWS_DEFAULT_REGION",
        "SSM_PREFIX",
        "DYNAMODB_TABLE_PREFIX",
        "DYNAMODB_ENDPOINT_URL",
        "VOICE_BUCKET",
        "RATE_LIMIT_BACKEND",
        "AI_MONTHLY_LIMIT",
        "BEDROCK_MAX_TOKENS",
        "BEDROCK_TEMPERATURE",
        "LOG_LEVEL",
        "PORT",
    }
)

# If someone pastes secrets into .env, strip them when SSM is active so SSM wins.
_SECRET_KEY_MARKERS = frozenset(
    {
        "REVENUECAT_WEBHOOK_AUTHORIZATION",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_SESSION_TOKEN",
        "APPLE_PRIVATE_KEY",
    }
)


def _load_optional_local_env() -> None:
    """Load backend/.env for non-secret local flags only (never overrides process env)."""
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.is_file():
        return
    try:
        from dotenv import dotenv_values
    except ImportError:
        return

    values = dotenv_values(env_path)
    skipped_secrets = []
    for key, value in values.items():
        if not key or value is None:
            continue
        if key in _SECRET_KEY_MARKERS or key.endswith("_SECRET") or key.endswith("_PRIVATE_KEY"):
            skipped_secrets.append(key)
            continue
        # Allowlisted non-secrets, or other non-secret-looking keys for flexibility
        if key not in _LOCAL_NON_SECRET_KEYS and key in SSM_KEYS:
            # Prefer SSM for anything that lives in Parameter Store
            skipped_secrets.append(key)
            continue
        if not os.environ.get(key):
            os.environ[key] = str(value)

    if skipped_secrets:
        logger.info(
            "Ignoring secret/SSM keys in backend/.env (use SSM): %s",
            ", ".join(sorted(set(skipped_secrets))),
        )


def _load_ssm(prefix: str) -> int:
    """Fetch parameters into os.environ. SSM always wins for listed keys."""
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError

    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    loaded = 0
    try:
        ssm = boto3.client("ssm", region_name=region)
    except Exception as e:
        logger.warning("SSM client init failed: %s", e)
        return 0

    for key in SSM_KEYS:
        name = f"{prefix}/{key}"
        try:
            resp = ssm.get_parameter(Name=name, WithDecryption=True)
            os.environ[key] = resp["Parameter"]["Value"]
            loaded += 1
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "")
            if code not in ("ParameterNotFound", "AccessDeniedException"):
                logger.debug("SSM get %s: %s", name, code)
        except NoCredentialsError:
            logger.warning("No AWS credentials — cannot load SSM (%s)", prefix)
            break
    return loaded


def bootstrap() -> None:
    global _LOADED
    if _LOADED:
        return

    # 1) Optional disposable local non-secret flags
    _load_optional_local_env()

    # 2) Secrets + shared config from SSM (source of truth)
    prefix = (os.environ.get("SSM_PREFIX") or "").rstrip("/")
    if prefix:
        if not prefix.startswith("/"):
            prefix = f"/{prefix}"
        n = _load_ssm(prefix)
        logger.info("Loaded %s parameters from SSM prefix %s", n, prefix)
    else:
        logger.warning(
            "SSM_PREFIX unset — secrets will not load from Parameter Store. "
            "Use ./scripts/run-backend-local.sh for local API."
        )

    # 3) Non-secret defaults
    os.environ.setdefault("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
    os.environ.setdefault("LLM_PROVIDER", "bedrock")
    os.environ.setdefault("BEDROCK_INFERENCE_GEO", "us")
    os.environ.setdefault("BEDROCK_MODEL_ID", "openai.gpt-oss-20b-1:0")
    os.environ.setdefault(
        "BEDROCK_MODEL_IDS",
        ",".join(
            [
                "openai.gpt-oss-20b-1:0",
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
    if os.environ.get("COGNITO_USER_POOL_ID") and not os.environ.get("COGNITO_REGION"):
        os.environ.setdefault("COGNITO_REGION", os.environ.get("AWS_REGION", "us-east-1"))

    _LOADED = True



