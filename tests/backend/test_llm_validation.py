"""Unit tests for LLM input validation + model chain (no network)."""

import pytest

from backend_path import ensure_backend_path  # noqa: F401

from ai.llm import LLMError, MAX_FEELING_LEN, _model_chain, validate_short_input


def test_valid_feeling():
    f, c = validate_short_input("anxious", "work stress")
    assert f == "anxious"
    assert c == "work stress"


def test_empty_feeling_rejected():
    with pytest.raises(LLMError):
        validate_short_input("  ", None)


def test_feeling_truncated():
    long = "x" * (MAX_FEELING_LEN + 300)
    f, _ = validate_short_input(long, None)
    assert len(f) == MAX_FEELING_LEN


def test_control_chars_stripped():
    f, _ = validate_short_input("sad\x00\x01 day", None)
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
