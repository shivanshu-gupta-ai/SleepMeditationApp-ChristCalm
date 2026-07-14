#!/usr/bin/env bash
# Local config bootstrap — secrets never live in files long-term.
#
# Preferred path (AWS already deployed):
#   ./scripts/sync-env-from-aws.sh
#
# Offline placeholders only (public / non-secret):
#   ./scripts/setup-config.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "ChristCalm config (SSM-first)"
echo ""

if [[ -f "$ROOT/scripts/lib/aws-auth.sh" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/scripts/lib/aws-auth.sh"
  if aws_auth_available 2>/dev/null; then
    echo "AWS credentials found → syncing disposable env from Terraform/SSM…"
    "$ROOT/scripts/sync-env-from-aws.sh"
    echo ""
    echo "Done. Secrets remain in SSM only."
    echo "  Local API:  ./scripts/run-backend-local.sh"
    echo "  Preview UI: ./scripts/preview.sh"
    exit 0
  fi
fi

echo "No AWS credentials — writing non-secret placeholders only."
echo "  (Secrets must come from SSM after deploy; do not paste them into .env)"
echo ""

cat > "$ROOT/backend/.env" <<'EOF'
# Placeholder — no secrets. Prefer: ./scripts/sync-env-from-aws.sh
AWS_REGION=us-east-1
SSM_PREFIX=/christcalm-preview
DYNAMODB_TABLE_PREFIX=christcalm-preview
EOF

if [[ ! -f "$ROOT/frontend/.env" ]]; then
  cp "$ROOT/config/env/frontend.env.example" "$ROOT/frontend/.env"
  echo "  created: frontend/.env (placeholder — run sync after deploy)"
else
  echo "  exists:  frontend/.env"
fi

echo "  created: backend/.env (SSM_PREFIX only)"
echo ""
echo "Next:"
echo "  1. aws sso login  (or configure AWS credentials)"
echo "  2. ./scripts/deploy-aws.sh apply && ./scripts/deploy-aws.sh code"
echo "  3. ./scripts/sync-env-from-aws.sh"
echo "  4. ./scripts/preview.sh"
echo ""
echo "Docs: config/README.md"
