#!/usr/bin/env bash
# Enable Sign in with Apple on Cognito after Apple Developer + SSM secrets are ready.
#
# Prerequisites (Apple Developer):
#   1. App ID com.christcalm.app — Sign in with Apple ON
#   2. Services ID com.christcalm.app.signin — domain + return URL:
#        Domain:  christcalm-dev.auth.us-east-1.amazoncognito.com
#        Return:  https://christcalm-dev.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
#   3. Key (.p8) with Sign in with Apple — note Key ID + Team ID
#
# Usage:
#   export APPLE_SERVICES_ID=com.christcalm.app.signin
#   export APPLE_TEAM_ID=XXXXXXXXXX
#   export APPLE_KEY_ID=XXXXXXXXXX
#   export APPLE_PRIVATE_KEY_FILE=~/Downloads/AuthKey_XXXXXXXX.p8
#   ./scripts/enable-apple-sign-in.sh
#
# What this does:
#   1) Seeds SSM (/christcalm-dev/APPLE_*)
#   2) Sets enable_apple_sign_in = true in terraform.tfvars
#   3) terraform apply (creates SignInWithApple IdP + enables it on the app client)
#   4) Redeploys Lambda so /api/auth/config reports apple_enabled: true
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/lib/aws-auth.sh"
aws_auth_require

TFVARS="$ROOT/infrastructure/terraform/terraform.tfvars"

: "${APPLE_SERVICES_ID:?Set APPLE_SERVICES_ID (e.g. com.christcalm.app.signin)}"
: "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID}"
: "${APPLE_KEY_ID:?Set APPLE_KEY_ID}"

if [[ -z "${APPLE_PRIVATE_KEY:-}" && -z "${APPLE_PRIVATE_KEY_FILE:-}" ]]; then
  echo "Set APPLE_PRIVATE_KEY or APPLE_PRIVATE_KEY_FILE" >&2
  exit 1
fi

echo "==> 1/4 Seed Apple secrets into SSM"
"$ROOT/scripts/seed-apple-ssm-once.sh"

echo "==> 2/4 enable_apple_sign_in = true in terraform.tfvars"
if [[ -f "$TFVARS" ]]; then
  if grep -q 'enable_apple_sign_in' "$TFVARS"; then
    # portable sed
    if sed --version >/dev/null 2>&1; then
      sed -i 's/enable_apple_sign_in[[:space:]]*=.*/enable_apple_sign_in = true/' "$TFVARS"
    else
      sed -i '' 's/enable_apple_sign_in[[:space:]]*=.*/enable_apple_sign_in = true/' "$TFVARS"
    fi
  else
    printf '\nenable_apple_sign_in = true\n' >> "$TFVARS"
  fi
else
  echo "enable_apple_sign_in = true" > "$TFVARS"
fi
grep enable_apple_sign_in "$TFVARS" || true

echo "==> 3/4 Terraform apply (Cognito Apple IdP + app client)"
"$ROOT/scripts/deploy-aws.sh" apply

echo "==> 4/4 Redeploy Lambda code (auth/config apple_enabled)"
"$ROOT/scripts/deploy-aws.sh" code

echo ""
echo "Done. Verify:"
echo "  curl -sS \"\$(grep EXPO_PUBLIC_BACKEND_URL frontend/.env | cut -d= -f2-)/api/auth/config\" | jq ."
echo "  App: Sign in / Sign up → Continue with Apple"
echo ""
echo "If invalid_client: re-check Apple Services ID return URL exactly:"
echo "  https://christcalm-dev.auth.us-east-1.amazoncognito.com/oauth2/idpresponse"
