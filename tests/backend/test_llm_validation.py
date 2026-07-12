"""Unit tests for LLM input validation + model chain (no network)."""

import pytest

from backend_path import ensure_backend_path  # noqa: F401

from services.llm import LLMError, _model_chain, validate_prayer_input


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


def test_model_chain_primary_gpt_oss_and_working_fallbacks(monkeypatch):
    monkeypatch.delenv("BEDROCK_MODEL_IDS", raising=False)
    monkeypatch.delenv("BEDROCK_MODEL_ID", raising=False)
    monkeypatch.delenv("WISDOM_MODEL_ID", raising=False)
    chain = _model_chain()
    assert chain[0] == "openai.gpt-oss-20b-1:0"
    assert "us.amazon.nova-micro-v1:0" in chain
    assert "us.amazon.nova-lite-v1:0" in chain
    assert "us.amazon.nova-2-lite-v1:0" in chain
    assert "us.meta.llama3-1-8b-instruct-v1:0" in chain
    assert "mistral.mistral-large-2402-v1:0" in chain
    assert "us.meta.llama3-1-70b-instruct-v1:0" in chain
    assert not any("claude" in m.lower() or "anthropic" in m.lower() for m in chain)
    # Legacy Llama 3.2 small sizes not in default chain (access denied on many accounts)
    assert "us.meta.llama3-2-1b-instruct-v1:0" not in chain
    assert "us.meta.llama3-2-3b-instruct-v1:0" not in chain


def test_model_chain_strips_claude(monkeypatch):
    monkeypatch.setenv(
        "BEDROCK_MODEL_IDS",
        "openai.gpt-oss-20b-1:0,anthropic.claude-3-haiku,us.amazon.nova-lite-v1:0",
    )
    chain = _model_chain()
    assert not any("claude" in m or "anthropic" in m for m in chain)
    assert chain[0] == "openai.gpt-oss-20b-1:0"
