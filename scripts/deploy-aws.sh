#!/usr/bin/env bash
# Deploy serverless backend to AWS (Lambda + API Gateway + DynamoDB + SSM).
# Lambda packages are built on AWS CodeBuild — no local Docker required.
# Mobile UI/UX preview runs locally via ./scripts/preview.sh
#
#   ./scripts/deploy-aws.sh apply   # first-time infrastructure
#   ./scripts/deploy-aws.sh code    # push backend code changes via CodeBuild
#   ./scripts/deploy-aws.sh deploy  # apply + code
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$ROOT/infrastructure/terraform"

source "$ROOT/scripts/lib/aws-auth.sh"

CMD="${1:-plan}"
aws_auth_require
export AWS_REGION="$(aws_auth_region)"
export TF_VAR_aws_region="$AWS_REGION"

deploy_lambda_code() {
  cd "$TF_DIR"
  terraform init -input=false >/dev/null
  BUCKET="$(terraform output -raw build_bucket)"
  PROJECT="$(terraform output -raw codebuild_project_name)"

  ARCHIVE="$(mktemp -t christcalm-backend.XXXXXX.tar.gz)"
  trap 'rm -f "$ARCHIVE"' RETURN

  echo "Packaging backend source + AI corpus (excludes .venv, caches, tests)..."
  STAGE="$(mktemp -d -t christcalm-pkg.XXXXXX)"
  trap 'rm -rf "$STAGE" "$ARCHIVE"' RETURN
  # rsync avoids copying local virtualenv into the Lambda source tarball
  rsync -a \
    --exclude '.venv/' \
    --exclude '__pycache__/' \
    --exclude '.env' \
    --exclude 'tests/' \
    --exclude '.pytest_cache/' \
    --exclude '*.pyc' \
    --exclude '._*' \
    --exclude '.DS_Store' \
    --exclude '*/._*' \
    "$ROOT/backend/" "$STAGE/"
  # Strip any macOS AppleDouble leftovers that pollute the AI corpus
  find "$STAGE" \( -name '._*' -o -name '.DS_Store' \) -delete 2>/dev/null || true
  if [[ ! -f "$STAGE/ai/corpus/Wisdom_Handbook.md" ]]; then
    echo "ERROR: AI corpus missing (backend/ai/corpus/Wisdom_Handbook.md)" >&2
    exit 1
  fi
  tar -czf "$ARCHIVE" -C "$STAGE" .
  echo "Package contents (ai corpus):"
  tar -tzf "$ARCHIVE" | grep -E '^\./ai/corpus/' | head -20
  echo "Archive size: $(du -h "$ARCHIVE" | awk '{print $1}')"

  echo "Uploading to s3://$BUCKET/source/backend.tar.gz ..."
  aws s3 cp "$ARCHIVE" "s3://$BUCKET/source/backend.tar.gz" --region "$AWS_REGION"

  echo "Starting AWS CodeBuild: $PROJECT"
  BUILD_ID="$(aws codebuild start-build \
    --project-name "$PROJECT" \
    --region "$AWS_REGION" \
    --query 'build.id' \
    --output text)"
  echo "Build ID: $BUILD_ID"

  echo "Waiting for CodeBuild (Lambda build runs on AWS, not locally)..."
  while true; do
    read -r STATUS PHASE <<<"$(aws codebuild batch-get-builds \
      --ids "$BUILD_ID" \
      --region "$AWS_REGION" \
      --query 'builds[0].[buildStatus,currentPhase]' \
      --output text)"
    case "$STATUS" in
      SUCCEEDED)
        echo "CodeBuild succeeded."
        break
        ;;
      FAILED|FAULT|STOPPED|TIMED_OUT)
        echo "CodeBuild failed: $STATUS (phase: $PHASE)"
        LOG_LINK="$(aws codebuild batch-get-builds \
          --ids "$BUILD_ID" \
          --region "$AWS_REGION" \
          --query 'builds[0].logs.deepLink' \
          --output text 2>/dev/null || true)"
        [[ -n "$LOG_LINK" && "$LOG_LINK" != "None" ]] && echo "Logs: $LOG_LINK"
        exit 1
        ;;
      *)
        echo "  … $STATUS ($PHASE)"
        sleep 8
        ;;
    esac
  done

  terraform output api_url
}

echo ""
echo "ChristCalm serverless → AWS ($CMD)"
aws_auth_print_status
echo "  Region: $AWS_REGION"
echo ""

cd "$TF_DIR"

case "$CMD" in
  init) terraform init ;;
  plan)
    terraform init -input=false
    terraform plan
    ;;
  apply)
    terraform init -input=false
    terraform apply -auto-approve -input=false
    echo ""
    terraform output
    echo ""
    echo "Deploy backend code: ./scripts/deploy-aws.sh code"
    echo "Preview mobile UI:   ./scripts/sync-env-from-aws.sh && ./scripts/preview.sh"
    ;;
  code)
    deploy_lambda_code
    ;;
  deploy)
    terraform init -input=false
    terraform apply -auto-approve
    deploy_lambda_code
    ;;
  output)
    terraform output
    ;;
  *)
    echo "Usage: $0 {init|plan|apply|code|deploy|output}"
    exit 1
    ;;
esac