"""Unit tests for LLM input validation (no network)."""

import pytest

from backend_path import ensure_backend_path  # noqa: F401

from services.llm import LLMError, validate_prayer_input


def test_valid_feeling():
    f, c = validate_prayer_input("anxious", "work stress")
    assert f == "anxious"
    assert c == "work stress"


def test_empty_feeling_rejected():
    with pytest.raises(LLMError):
        validate_prayer_input("  ", None)


def test_feeling_truncated():
    long = "x" * 500
    f, _ = validate_prayer_input(long, None)
    assert len(f) == 200


def test_control_chars_stripped():
    f, _ = validate_prayer_input("sad\x00\x01 day", None)
    assert "\x00" not in f
