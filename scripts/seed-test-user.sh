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

# Grant full access in DynamoDB (is_premium) so nothing is paywalled
TABLE_PREFIX="$(terraform output -raw dynamodb_table_prefix 2>/dev/null || echo christcalm-dev)"
USERS_TABLE="${TABLE_PREFIX}-users"
echo "  Unlocking premium on table: $USERS_TABLE"

# Find user by email and set is_premium
USER_ID="$(aws dynamodb scan \
  --table-name "$USERS_TABLE" \
  --region "$AWS_REGION" \
  --filter-expression "email = :e" \
  --expression-attribute-values "{\":e\":{\"S\":\"$EMAIL\"}}" \
  --projection-expression "id" \
  --query 'Items[0].id.S' \
  --output text 2>/dev/null || true)"

if [[ -n "${USER_ID}" && "${USER_ID}" != "None" && "${USER_ID}" != "null" ]]; then
  aws dynamodb update-item \
    --table-name "$USERS_TABLE" \
    --region "$AWS_REGION" \
    --key "{\"id\":{\"S\":\"${USER_ID}\"}}" \
    --update-expression "SET is_premium = :t, #plan = :p, subscription_provider = :s" \
    --expression-attribute-names "{\"#plan\":\"plan\"}" \
    --expression-attribute-values "{\":t\":{\"BOOL\":true},\":p\":{\"S\":\"preview\"},\":s\":{\"S\":\"preview\"}}" \
    >/dev/null
  echo "  DynamoDB premium unlocked for id=${USER_ID}"
else
  echo "  No DynamoDB profile yet — will unlock on first app sign-in"
fi

echo "OK — sign in with:"
echo "  Email:    $EMAIL"
echo "  Password: $PASS"
echo "  Access:   full (no paywall)"
echo ""
echo "Note: password needs upper + lower + number (Cognito policy)."
