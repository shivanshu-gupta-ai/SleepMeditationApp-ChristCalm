#!/usr/bin/env bash
# AWS credential auto-detection for local deploy scripts.
# Resolution order (same as AWS SDK default chain):
#   1. Environment variables (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN)
#   2. AWS_PROFILE → ~/.aws/credentials (+ SSO / aws login)
#   3. EC2/ECS/Lambda instance metadata (when running on AWS)

aws_auth_available() {
  command -v aws &>/dev/null || return 1
  aws sts get-caller-identity &>/dev/null
}

aws_auth_identity() {
  aws sts get-caller-identity --output text --query 'Arn' 2>/dev/null
}

aws_auth_region() {
  if [[ -n "${AWS_REGION:-}" ]]; then
    echo "$AWS_REGION"
    return
  fi
  if [[ -n "${AWS_DEFAULT_REGION:-}" ]]; then
    echo "$AWS_DEFAULT_REGION"
    return
  fi
  if command -v aws &>/dev/null; then
    local configured
    configured="$(aws configure get region 2>/dev/null || true)"
    if [[ -n "$configured" ]]; then
      echo "$configured"
      return
    fi
  fi
  echo "us-east-1"
}

aws_auth_print_status() {
  if aws_auth_available; then
    echo "✓ AWS credentials detected"
    echo "  Identity: $(aws_auth_identity)"
    echo "  Region:   $(aws_auth_region)"
    [[ -n "${AWS_PROFILE:-}" ]] && echo "  Profile:  $AWS_PROFILE"
    [[ -n "${AWS_SESSION_TOKEN:-}" ]] && echo "  Session:  temporary (SSO/assumed role)"
    return 0
  fi
  echo "✗ No AWS credentials found"
  echo "  Configure one of:"
  echo "    • aws configure"
  echo "    • aws sso login --profile <name>  +  export AWS_PROFILE=<name>"
  echo "    • export AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY"
  return 1
}

aws_auth_require() {
  if ! aws_auth_print_status; then
    exit 1
  fi
}