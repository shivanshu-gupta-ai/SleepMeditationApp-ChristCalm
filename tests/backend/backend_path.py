"""Ensure backend package is importable for unit tests."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"


def ensure_backend_path() -> None:
    path = str(BACKEND)
    if path not in sys.path:
        sys.path.insert(0, path)


ensure_backend_path()
