#!/usr/bin/env bash
# Probe every model in the ChristCalm Wisdom fallback chain.
# Usage: ./scripts/check-bedrock-models.sh [region]
set -euo pipefail
REGION="${1:-${AWS_REGION:-us-east-1}}"

echo "Region: $REGION"
echo "Account: $(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo '?')"
echo ""

probe() {
  local MID="$1"
  local OUT
  set +e
  OUT=$(aws bedrock-runtime converse \
    --region "$REGION" \
    --model-id "$MID" \
    --messages '[{"role":"user","content":[{"text":"Say only: ok"}]}]' \
    --inference-config '{"maxTokens":8,"temperature":0}' \
    --query 'output.message.content[0].text' \
    --output text 2>&1)
  local RC=$?
  set -e
  if [[ $RC -ne 0 ]] || echo "$OUT" | grep -qiE 'AccessDenied|ValidationException|ResourceNotFound|not authorized|Throttl|error occurred'; then
    echo "FAIL  $MID"
    echo "      $(echo "$OUT" | head -c 200 | tr '\n' ' ')"
    return 1
  fi
  echo "OK    $MID"
  echo "      reply: $(echo "$OUT" | head -c 60 | tr '\n' ' ')"
  return 0
}

# Cost-optimized working chain (primary = GPT-OSS)
MODELS=(
  "openai.gpt-oss-20b-1:0"
  "us.amazon.nova-micro-v1:0"
  "us.amazon.nova-lite-v1:0"
  "us.amazon.nova-2-lite-v1:0"
  "us.meta.llama3-1-8b-instruct-v1:0"
  "mistral.mistral-large-2402-v1:0"
  "us.meta.llama3-1-70b-instruct-v1:0"
  "us.meta.llama3-3-70b-instruct-v1:0"
  "us.amazon.nova-pro-v1:0"
  "us.deepseek.r1-v1:0"
  "us.mistral.pixtral-large-2502-v1:0"
)

ok=0
fail=0
echo "=== Converse probe (Wisdom chain) ==="
for m in "${MODELS[@]}"; do
  if probe "$m"; then ok=$((ok + 1)); else fail=$((fail + 1)); fi
  echo ""
done

echo "=== Summary: $ok OK, $fail FAIL (app uses any OK model) ==="
if [[ $ok -eq 0 ]]; then
  echo "No models working — enable Model access in Bedrock console."
  exit 1
fi
exit 0
