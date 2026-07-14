#!/usr/bin/env bash
# Create / reset the preview test user in Cognito.
# Password must meet Cognito policy: 8+ chars, upper, lower, number.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/lib/aws-auth.sh"
aws_auth_require

export AWS_REGION="$(aws_auth_region)"
TF_DIR="$ROOT/infrastructure/terraform"
cd "$TF_DIR"
terraform init -input=false >/dev/null
POOL="$(terraform output -raw cognito_user_pool_id)"
CLIENT="$(terraform output -raw cognito_client_id)"

EMAIL="${1:-test@christcalm.dev}"
PASS="${2:-Test1234}"
NAME="${3:-Test User}"

echo "Seeding Cognito user"
echo "  Pool:  $POOL"
echo "  Email: $EMAIL"

if aws cognito-idp admin-get-user --user-pool-id "$POOL" --username "$EMAIL" --region "$AWS_REGION" &>/dev/null; then
  echo "  User exists — resetting password"
else
  aws cognito-idp admin-create-user \
    --user-pool-id "$POOL" \
    --username "$EMAIL" \
    --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true Name=name,Value="$NAME" \
    --message-action SUPPRESS \
    --region "$AWS_REGION" >/dev/null
  echo "  Created user"
fi

aws cognito-idp admin-set-user-password \
  --user-pool-id "$POOL" \
  --username "$EMAIL" \
  --password "$PASS" \
  --permanent \
  --region "$AWS_REGION" >/dev/null

# Verify password auth
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "$CLIENT" \
  --auth-parameters USERNAME="$EMAIL",PASSWORD="$PASS" \
  --region "$AWS_REGION" \
  --query 'AuthenticationResult.AccessToken' \
  --output text >/dev/null

echo "OK — sign in with:"
echo "  Email:    $EMAIL"
echo "  Password: $PASS"
echo ""
echo "Note: password needs upper + lower + number (Cognito policy)."
