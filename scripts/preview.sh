#!/usr/bin/env bash
# Preview UI/UX locally on your phone/simulator — backend stays on AWS Lambda.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f frontend/.env ]]; then
  cp frontend/.env.example frontend/.env
fi

# Pull API Gateway URL from Terraform if available
if [[ -f "$ROOT/scripts/lib/aws-auth.sh" ]]; then
  source "$ROOT/scripts/lib/aws-auth.sh"
  if aws_auth_available 2>/dev/null; then
    "$ROOT/scripts/sync-env-from-aws.sh" 2>/dev/null || true
  fi
fi

if ! grep -q "EXPO_PUBLIC_BACKEND_URL=https://" frontend/.env 2>/dev/null; then
  echo "Set EXPO_PUBLIC_BACKEND_URL in frontend/.env to your API Gateway URL."
  echo "  Run: ./scripts/deploy-aws.sh apply && ./scripts/sync-env-from-aws.sh"
  exit 1
fi

API_URL="$(grep -E '^EXPO_PUBLIC_BACKEND_URL=' frontend/.env | cut -d= -f2- | tr -d '"' | tr -d "'")"

echo "ChristCalm — local mobile UI preview"
echo "  Backend: $API_URL"
echo "  UI:      Expo dev server (local)"
echo ""
echo "  iOS simulator: press i  (recommended)"
echo "  Android:       press a"
echo "  Expo Go:       scan QR code on your phone"
echo "  Web (w):       supported after backend CORS fix"
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