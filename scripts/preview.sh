#!/usr/bin/env bash
# Preview UI/UX locally — backend stays on AWS Lambda.
# Regenerates public frontend env from AWS (no secrets in files).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/scripts/lib/aws-auth.sh" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/scripts/lib/aws-auth.sh"
  if aws_auth_available 2>/dev/null; then
    "$ROOT/scripts/sync-env-from-aws.sh"
  fi
fi

if [[ ! -f frontend/.env ]] || ! grep -q "EXPO_PUBLIC_BACKEND_URL=https://" frontend/.env 2>/dev/null; then
  echo "Missing public API URL in frontend/.env."
  echo "  Run: ./scripts/deploy-aws.sh apply && ./scripts/sync-env-from-aws.sh"
  exit 1
fi

API_URL="$(grep -E '^EXPO_PUBLIC_BACKEND_URL=' frontend/.env | cut -d= -f2- | tr -d '"' | tr -d "'")"

echo "ChristCalm — local mobile UI preview"
echo "  Backend: $API_URL  (AWS Lambda; secrets in SSM)"
echo "  UI:      Expo dev server (local)"
echo "  Env:     frontend/.env is auto-generated public config only"
echo ""
echo "  iOS simulator: press i"
echo "  Android:       press a"
echo "  Expo Go:       scan QR code"
echo "  Web:           press w  → http://localhost:8081"
echo ""

cd frontend

if command -v yarn &>/dev/null; then
  PKG_MGR="yarn"
elif command -v npm &>/dev/null; then
  PKG_MGR="npm"
else
  echo "Install Node.js (npm) or Yarn to run the Expo preview."
  exit 1
fi

echo "Using $PKG_MGR"
$PKG_MGR install
$PKG_MGR run start -- --clear
