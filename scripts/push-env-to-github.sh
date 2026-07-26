#!/usr/bin/env bash
# Push public frontend EXPO_PUBLIC_* values from local frontend/.env to GitHub
# Actions repository VARIABLES so contributors can run:
#   ./scripts/sync-env-from-github.sh
#
# Never push secrets (JWT, Apple .p8, AWS keys, RevenueCat secret keys).
# Only EXPO_PUBLIC_* (and similar public client config) belong here.
#
# Owner only — requires repo admin/write + gh auth.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${FRONTEND_ENV:-$ROOT/frontend/.env}"
REPO="${GITHUB_REPO:-shivanshu-gupta-ai/SleepMeditationApp-ChristCalm}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — run ./scripts/sync-env-from-aws.sh first." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: https://cli.github.com/" >&2
  exit 1
fi

VARS=(
  EXPO_PUBLIC_BACKEND_URL
  EXPO_PUBLIC_COGNITO_USER_POOL_ID
  EXPO_PUBLIC_COGNITO_CLIENT_ID
  EXPO_PUBLIC_COGNITO_DOMAIN
  EXPO_PUBLIC_COGNITO_REGION
  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
  EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID
  EXPO_PUBLIC_REVENUECAT_OFFERING_ID
  EXPO_PUBLIC_REVENUECAT_PRODUCT_MONTHLY
  EXPO_PUBLIC_REVENUECAT_PRODUCT_ANNUAL
  EXPO_PUBLIC_UNLOCK_ALL
)

echo "Pushing public env → GitHub Variables on $REPO"
for name in "${VARS[@]}"; do
  value=$(grep -E "^${name}=" "$ENV_FILE" | head -1 | cut -d= -f2- || true)
  if [[ -z "${value:-}" ]]; then
    echo "  skip (empty) $name"
    continue
  fi
  # --body "-" would store a literal dash; pass the value explicitly
  gh variable set "$name" -R "$REPO" --body "$value"
  echo "  ✓ $name"
done

echo ""
echo "Collaborators can now run: ./scripts/sync-env-from-github.sh"
gh variable list -R "$REPO"
