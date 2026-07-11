#!/usr/bin/env bash
# Write frontend/.env with API Gateway URL from Terraform.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$ROOT/aws/terraform"
source "$ROOT/scripts/lib/aws-auth.sh"
aws_auth_require

cd "$TF_DIR"
terraform init -input=false >/dev/null
API_URL="$(terraform output -raw api_url)"

cat > "$ROOT/frontend/.env" <<EOF
# Auto-generated — points mobile app at AWS Lambda API
EXPO_PUBLIC_BACKEND_URL=${API_URL%/}
EOF

echo "Wrote frontend/.env:"
cat "$ROOT/frontend/.env"