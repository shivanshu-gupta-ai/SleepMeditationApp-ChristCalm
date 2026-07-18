#!/usr/bin/env bash
# One-shot: deploy a temporary Lambda that writes Apple secrets to SSM, invoke, DELETE.
# After this, Terraform only *reads* SSM (enable_apple_sign_in = true).
#
# Usage:
#   export APPLE_SERVICES_ID=com.christcalm.app.signin
#   export APPLE_TEAM_ID=A978T8YCZZ
#   export APPLE_KEY_ID=DRL78NBCUL
#   export APPLE_PRIVATE_KEY_FILE=~/Downloads/AuthKey_DRL78NBCUL.p8
#   ./scripts/seed-apple-ssm-once.sh
#
# Then:
#   enable_apple_sign_in = true   # terraform.tfvars
#   ./scripts/deploy-aws.sh apply
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/lib/aws-auth.sh"
aws_auth_require

export AWS_REGION="$(aws_auth_region)"
export AWS_DEFAULT_REGION="$AWS_REGION"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

TF_DIR="$ROOT/infrastructure/terraform"
cd "$TF_DIR"
terraform init -input=false >/dev/null 2>&1 || true
SSM_PREFIX="$(terraform output -raw ssm_prefix 2>/dev/null || echo "/christcalm-preview")"
SSM_PREFIX="${SSM_PREFIX%/}"
[[ "$SSM_PREFIX" == /* ]] || SSM_PREFIX="/$SSM_PREFIX"

if [[ -z "${APPLE_PRIVATE_KEY:-}" ]]; then
  if [[ -n "${APPLE_PRIVATE_KEY_FILE:-}" ]]; then
    f="${APPLE_PRIVATE_KEY_FILE/#\~/$HOME}"
    APPLE_PRIVATE_KEY="$(cat "$f")"
  else
    echo "Set APPLE_PRIVATE_KEY or APPLE_PRIVATE_KEY_FILE" >&2
    exit 1
  fi
fi

: "${APPLE_SERVICES_ID:?Set APPLE_SERVICES_ID}"
: "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID}"
: "${APPLE_KEY_ID:?Set APPLE_KEY_ID}"

# Normalize .p8 body → PEM if headers were stripped (Cognito/Apple need PEM)
if ! grep -q "BEGIN PRIVATE KEY" <<<"$APPLE_PRIVATE_KEY"; then
  BODY="$(printf '%s' "$APPLE_PRIVATE_KEY" | tr -d '\r\n\t ')"
  if [[ ${#BODY} -lt 80 ]]; then
    echo "APPLE_PRIVATE_KEY looks empty/too short" >&2
    exit 1
  fi
  APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
$(printf '%s' "$BODY" | fold -w 64)
-----END PRIVATE KEY-----"
  echo "  (wrapped raw key body with PEM headers)"
fi

FN_NAME="christcalm-seed-apple-ssm-${RANDOM}"
ROLE_NAME="${FN_NAME}-role"
POLICY_NAME="${FN_NAME}-policy"
WORKDIR="$(mktemp -d -t seed-apple-src.XXXXXX)"
ZIP="$WORKDIR/fn.zip"
TRUST="$WORKDIR/trust.json"
POLICY_DOC="$WORKDIR/policy.json"
ENV_FILE="$WORKDIR/env.json"
OUT_FILE="$WORKDIR/out.json"
CLEANED=0

cleanup() {
  if [[ "$CLEANED" -eq 1 ]]; then return; fi
  CLEANED=1
  aws lambda delete-function --function-name "$FN_NAME" --region "$AWS_REGION" 2>/dev/null || true
  if [[ -n "${POLICY_ARN:-}" ]]; then
    aws iam detach-role-policy --role-name "$ROLE_NAME" --policy-arn "$POLICY_ARN" 2>/dev/null || true
    aws iam delete-policy --policy-arn "$POLICY_ARN" 2>/dev/null || true
  fi
  aws iam delete-role --role-name "$ROLE_NAME" 2>/dev/null || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

echo "ChristCalm — seed Apple secrets via temporary Lambda"
echo "  Account: $ACCOUNT_ID"
echo "  Region:  $AWS_REGION"
echo "  SSM:     ${SSM_PREFIX}/APPLE_*"
echo "  Lambda:  $FN_NAME  (deleted after success)"
echo ""

cp "$ROOT/scripts/seed-apple-ssm/handler.py" "$WORKDIR/handler.py"
( cd "$WORKDIR" && zip -q "$ZIP" handler.py )

cat > "$TRUST" <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

cat > "$POLICY_DOC" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ssm:PutParameter", "ssm:GetParameter", "ssm:AddTagsToResource"],
      "Resource": "arn:aws:ssm:${AWS_REGION}:${ACCOUNT_ID}:parameter${SSM_PREFIX}/*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:${AWS_REGION}:${ACCOUNT_ID}:*"
    }
  ]
}
EOF

# Build Lambda env JSON (private key may contain newlines)
export APPLE_SERVICES_ID APPLE_TEAM_ID APPLE_KEY_ID APPLE_PRIVATE_KEY SSM_PREFIX
python3 - <<'PY' > "$ENV_FILE"
import json, os
print(json.dumps({
    "Variables": {
        "SSM_PREFIX": os.environ["SSM_PREFIX"],
        "APPLE_SERVICES_ID": os.environ["APPLE_SERVICES_ID"],
        "APPLE_TEAM_ID": os.environ["APPLE_TEAM_ID"],
        "APPLE_KEY_ID": os.environ["APPLE_KEY_ID"],
        "APPLE_PRIVATE_KEY": os.environ["APPLE_PRIVATE_KEY"],
    }
}))
PY

echo ">>> IAM role…"
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document "file://$TRUST" >/dev/null

POLICY_ARN="$(aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document "file://$POLICY_DOC" \
  --query 'Policy.Arn' --output text)"

aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$POLICY_ARN"
sleep 10

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

echo ">>> Create Lambda…"
aws lambda create-function \
  --function-name "$FN_NAME" \
  --runtime python3.11 \
  --role "$ROLE_ARN" \
  --handler handler.handler \
  --zip-file "fileb://$ZIP" \
  --timeout 30 \
  --memory-size 128 \
  --environment "file://$ENV_FILE" \
  --region "$AWS_REGION" >/dev/null

echo ">>> Wait for Lambda Active…"
for i in $(seq 1 30); do
  st="$(aws lambda get-function-configuration --function-name "$FN_NAME" --region "$AWS_REGION" --query 'State' --output text 2>/dev/null || echo Pending)"
  [[ "$st" == "Active" ]] && break
  sleep 2
done

echo ">>> Invoke (write SSM)…"
printf '%s' '{}' > "$WORKDIR/payload.json"
aws lambda invoke \
  --function-name "$FN_NAME" \
  --region "$AWS_REGION" \
  --invocation-type RequestResponse \
  --payload "file://$WORKDIR/payload.json" \
  "$OUT_FILE" >/dev/null

python3 - <<PY
import json, sys
raw = open("$OUT_FILE").read().strip()
if not raw:
    print("  empty response", file=sys.stderr)
    sys.exit(1)
d = json.loads(raw)
body = d.get("body", d)
if isinstance(body, str):
    body = json.loads(body)
print("  ", body)
if not body.get("ok"):
    sys.exit(1)
PY

echo ">>> Delete temporary Lambda + IAM…"
cleanup
CLEANED=1
trap - EXIT

echo ""
echo "OK — Apple secrets are only in SSM (${SSM_PREFIX}/APPLE_*)."
echo "  Temporary Lambda fully removed."
echo ""
echo "Next (Terraform reads SSM only):"
echo "  enable_apple_sign_in = true   # terraform.tfvars"
echo "  ./scripts/deploy-aws.sh apply"
echo "  ./scripts/sync-env-from-aws.sh"
