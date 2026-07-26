#!/usr/bin/env bash
# Run FastAPI locally with secrets from SSM (no secret .env required).
#
#   ./scripts/run-backend-local.sh
#   ./scripts/run-backend-local.sh --port 8000
#
# Prerequisites: AWS credentials (profile/SSO), terraform applied, SSM populated.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/lib/aws-auth.sh"
aws_auth_require

export AWS_REGION="$(aws_auth_region)"
export AWS_DEFAULT_REGION="$AWS_REGION"

# Refresh disposable non-secret env if terraform is available
if [[ -d "$ROOT/infrastructure/terraform" ]]; then
  "$ROOT/scripts/sync-env-from-aws.sh" >/dev/null || true
fi

# Load non-secret flags if present
if [[ -f "$ROOT/backend/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/backend/.env"
  set +a
fi

export SSM_PREFIX="${SSM_PREFIX:-/christcalm-dev}"
export DYNAMODB_TABLE_PREFIX="${DYNAMODB_TABLE_PREFIX:-christcalm-dev}"
# Dev-only: seed test@christcalm.dev as premium on login. Never set on production Lambda.
export ALLOW_PREVIEW_TEST_PREMIUM="${ALLOW_PREVIEW_TEST_PREMIUM:-1}"
# Strip leading path quirks
SSM_PREFIX="${SSM_PREFIX%/}"
[[ "$SSM_PREFIX" == /* ]] || SSM_PREFIX="/$SSM_PREFIX"
export SSM_PREFIX

PORT=8000
if [[ "${1:-}" == "--port" && -n "${2:-}" ]]; then
  PORT="$2"
fi

echo "ChristCalm local API"
echo "  Region:     $AWS_REGION"
echo "  SSM_PREFIX: $SSM_PREFIX"
echo "  Tables:     $DYNAMODB_TABLE_PREFIX-*"
echo "  Identity:   $(aws_auth_identity)"
echo "  URL:        http://127.0.0.1:${PORT}"
echo "  Secrets:    loaded from SSM at process start (not from .env)"
echo ""

cd "$ROOT/backend"

if [[ -x .venv/bin/uvicorn ]]; then
  UV=".venv/bin/uvicorn"
elif command -v uvicorn &>/dev/null; then
  UV="uvicorn"
else
  echo "Install deps: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

# Prove SSM is reachable before serving
python3 - <<'PY'
import os, sys
sys.path.insert(0, ".")
os.environ.setdefault("SSM_PREFIX", os.environ.get("SSM_PREFIX", "/christcalm-dev"))
from core.config import bootstrap, require_jwt_secret
bootstrap()
require_jwt_secret()
print("  SSM bootstrap OK (JWT_SECRET present)")
PY

exec $UV server:app --reload --host 0.0.0.0 --port "$PORT"
