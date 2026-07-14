#!/usr/bin/env bash
# Write frontend/.env with API Gateway + Cognito settings from Terraform.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$ROOT/infrastructure/terraform"
source "$ROOT/scripts/lib/aws-auth.sh"
aws_auth_require

cd "$TF_DIR"
terraform init -input=false >/dev/null
API_URL="$(terraform output -raw api_url)"
POOL_ID="$(terraform output -raw cognito_user_pool_id)"
CLIENT_ID="$(terraform output -raw cognito_client_id)"
COGNITO_DOMAIN="$(terraform output -raw cognito_domain)"
COGNITO_REGION="$(terraform output -raw cognito_region)"

cat > "$ROOT/frontend/.env" <<EOF
# Auto-generated — AWS Lambda API + Cognito auth
EXPO_PUBLIC_BACKEND_URL=${API_URL%/}
EXPO_PUBLIC_COGNITO_USER_POOL_ID=${POOL_ID}
EXPO_PUBLIC_COGNITO_CLIENT_ID=${CLIENT_ID}
EXPO_PUBLIC_COGNITO_DOMAIN=${COGNITO_DOMAIN}
EXPO_PUBLIC_COGNITO_REGION=${COGNITO_REGION}
EOF

echo "Wrote frontend/.env:"
cat "$ROOT/frontend/.env"