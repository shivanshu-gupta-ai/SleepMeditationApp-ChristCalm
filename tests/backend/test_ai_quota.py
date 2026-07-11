"""Unit tests for monthly AI quota logic (DynamoDB-backed, mocked)."""

from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from backend_path import ensure_backend_path  # noqa: F401


def test_ai_monthly_limit_default():
    from services.rate_limit import AI_MONTHLY_LIMIT

    assert AI_MONTHLY_LIMIT == 100


def test_quota_month_format():
    from services.dynamodb import Database

    m = Database._quota_month()
    assert len(m) == 7
    assert m[4] == "-"


def test_guardrail_blocks_do_not_need_quota_path():
    """Off-topic messages are blocked before Bedrock / quota consume in server."""
    from services.wisdom_guardrails import enforce_wisdom_scope

    ok, reply = enforce_wisdom_scope("Write me a Python sorting function")
    assert ok is False
    assert "emotional concern" in reply.lower()


def test_emotional_allowed():
    from services.wisdom_guardrails import enforce_wisdom_scope

    ok, reply = enforce_wisdom_scope("I feel overwhelmed and can't rest")
    assert ok is True
    assert reply == ""
