"""Guardrails for Wisdom chat — emotional / spiritual care only.

Blocks coding, homework, general productivity, and other off-mission tasks
before any Bedrock call so we don't burn tokens or enable misuse.
"""

from __future__ import annotations

import re
from typing import Tuple

# Friendly, fixed response when the request is outside scope
GUARDRAIL_REPLY = (
    "Please share an emotional concern. "
    "Wisdom is here to walk with you through heart-level pain, anxiety, grief, "
    "loneliness, and faith struggles — it does not deal with that kind of request."
)

# Patterns that clearly indicate non-emotional / utility use
_DENY_PATTERNS: list[re.Pattern[str]] = [
    re.compile(p, re.I)
    for p in [
        # Software / code
        r"\b(write|generate|create|debug|fix|refactor)\b.{0,40}\b(code|script|function|class|program|api|sql|regex)\b",
        r"\b(python|javascript|typescript|java|golang|rust|c\+\+|html|css|react|node\.?js|kotlin|swift)\b",
        r"\b(leetcode|hackerrank|programming|compiler|stack\s*trace|unit\s*test|dockerfile|kubernetes)\b",
        r"```",  # fenced code blocks
        r"\b(npm|pip install|git clone|sudo |chmod |import\s+\w+|def\s+\w+\s*\(|console\.log)\b",
        # Generic AI misuse
        r"\b(write me an?|generate an?)\b.{0,30}\b(essay|article|blog|seo|marketing copy|cover letter|resume)\b",
        r"\b(solve|do)\b.{0,20}\b(my\s+)?(homework|assignment|exam|quiz|math problem)\b",
        r"\b(translate this|summarize this document|rewrite this paragraph)\b",
        r"\b(make me rich|stock tip|crypto|betting odds|lottery)\b",
        r"\b(how to hack|bypass captcha|phishing|malware|exploit)\b",
        r"\b(roleplay as|ignore previous instructions|system prompt|jailbreak)\b",
        # Pure productivity tools
        r"\b(build me an? app|saas product|business plan for a startup)\b",
        r"\b(recipe for|cooking instructions|workout plan only)\b",
    ]
]

# Signals that the user is sharing emotional / spiritual pain (allow even if mixed)
_ALLOW_PATTERNS: list[re.Pattern[str]] = [
    re.compile(p, re.I)
    for p in [
        r"\b(anxious|anxiety|worried|worry|fear|afraid|scared|panic|overwhelmed)\b",
        r"\b(sad|sadness|depressed|depression|grief|grieving|mourn|lonely|loneliness|alone)\b",
        r"\b(hurt|hurting|broken|heartbreak|heartbroken|pain|painful|suffering)\b",
        r"\b(ashamed|shame|guilt|guilty|hopeless|empty|numb|tired of|exhausted)\b",
        r"\b(angry|anger|bitter|resent|betray|rejected|abandoned)\b",
        r"\b(pray|prayer|jesus|god|faith|spirit|scripture|bible|church|forgive)\b",
        r"\b(peace|comfort|hope|rest|weary|burden|heavy on my heart)\b",
        r"\b(i feel|i'm feeling|im feeling|my heart|on my heart|struggling with)\b",
        r"\b(relationship|marriage|spouse|divorce|loss|died|death|sick|illness)\b",
        r"\b(what would jesus|help me (pray|rest|heal|trust))\b",
    ]
]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def is_emotional_concern(message: str) -> Tuple[bool, str]:
    """
    Returns (allowed, reason).
    reason is 'ok' | 'deny_pattern' | 'no_concern_signal' for logging only.
    """
    msg = _normalize(message)
    if len(msg) < 2:
        return False, "too_short"

    # Hard deny first — even if someone wraps code in emotional language
    for pat in _DENY_PATTERNS:
        if pat.search(msg):
            return False, "deny_pattern"

    # Explicit emotional / spiritual language → allow
    for pat in _ALLOW_PATTERNS:
        if pat.search(msg):
            return True, "ok"

    # Short personal notes without code-ish tokens — allow (many genuine concerns
    # are plain: "I can't sleep", "My mom is sick")
    lower = msg.lower()
    codey = bool(
        re.search(
            r"[{};=<>]|https?://|www\.|\.py\b|\.js\b|\.ts\b|\bjson\b|\bxml\b",
            lower,
        )
    )
    if codey:
        return False, "deny_pattern"

    # Very long technical-looking dumps without emotion words
    if len(msg) > 600 and not re.search(r"\b(i |i'm|im |my |me |feel|heart|god|pray)\b", lower):
        return False, "no_concern_signal"

    # Default: allow conversational personal messages; model system prompt is second line of defense
    # But block obvious non-personal task openers
    task_openers = re.compile(
        r"^(write|generate|create|build|make|code|implement|develop|fix|debug|explain how to code)\b",
        re.I,
    )
    if task_openers.search(msg):
        return False, "deny_pattern"

    return True, "ok"


def enforce_wisdom_scope(message: str) -> Tuple[bool, str]:
    """
    Public API for server/llm.
    Returns (allowed, reply_if_blocked).
    When not allowed, reply_if_blocked is the fixed guardrail message.
    """
    ok, _reason = is_emotional_concern(message)
    if ok:
        return True, ""
    return False, GUARDRAIL_REPLY
