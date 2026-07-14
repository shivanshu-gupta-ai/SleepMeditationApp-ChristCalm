"""Unit tests for Wisdom scope guardrails (no network)."""

import pytest

from backend_path import ensure_backend_path  # noqa: F401

from ai.wisdom_guardrails import enforce_wisdom_scope, is_emotional_concern, GUARDRAIL_REPLY


def test_allows_anxiety_concern():
    ok, reason = is_emotional_concern("I feel anxious and can't sleep at night")
    assert ok
    assert reason == "ok"


def test_allows_grief():
    ok, _ = is_emotional_concern("I'm grieving the loss of my dad and feel alone")
    assert ok


def test_allows_faith_struggle():
    ok, _ = is_emotional_concern("I doubt God is near when everything falls apart")
    assert ok


def test_blocks_code_request():
    ok, reply = enforce_wisdom_scope("Write a Python function to sort a list")
    assert not ok
    assert "emotional concern" in reply.lower()
    assert reply == GUARDRAIL_REPLY


def test_blocks_javascript():
    ok, _ = is_emotional_concern("Can you generate javascript code for a react component?")
    assert not ok


def test_blocks_homework():
    ok, _ = is_emotional_concern("Please solve my math homework assignment for calculus")
    assert not ok


def test_blocks_code_fence():
    ok, _ = is_emotional_concern("```\ndef foo():\n  return 1\n```")
    assert not ok


def test_blocks_task_opener():
    ok, _ = is_emotional_concern("Build me an app that tracks calories")
    assert not ok


def test_allows_short_personal():
    ok, _ = is_emotional_concern("My mom is in the hospital")
    assert ok
