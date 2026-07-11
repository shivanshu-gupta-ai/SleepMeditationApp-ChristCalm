#!/usr/bin/env bash
# Copy canonical covers into Expo bundle path
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/meditations/covers"
DST="$ROOT/frontend/assets/meditations/covers"
mkdir -p "$DST"
cp -f "$SRC"/*.jpg "$DST/" 2>/dev/null || true
cp -f "$SRC"/*.png "$DST/" 2>/dev/null || true
echo "Synced covers → frontend/assets/meditations/covers/"
ls -la "$DST"
