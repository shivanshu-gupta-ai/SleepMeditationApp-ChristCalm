#!/usr/bin/env bash
# Copy config templates into backend/.env and frontend/.env (if missing).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

copy_if_missing() {
  local src="$1" dest="$2"
  if [[ -f "$dest" ]]; then
    echo "  exists: $dest"
  else
    cp "$src" "$dest"
    echo "  created: $dest"
  fi
}

echo "ChristCalm config setup"
copy_if_missing "$ROOT/config/backend.env.example" "$ROOT/backend/.env"
copy_if_missing "$ROOT/config/frontend.env.example" "$ROOT/frontend/.env"
echo ""
echo "Edit backend/.env and frontend/.env with your keys."
echo "Auth templates: config/auth/"
echo "After deploy:     ./scripts/sync-env-from-aws.sh"