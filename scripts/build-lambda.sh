#!/usr/bin/env bash
# Lambda builds run on AWS CodeBuild (no local Docker).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Lambda packages are built on AWS CodeBuild, not locally."
exec "$ROOT/scripts/deploy-aws.sh" code