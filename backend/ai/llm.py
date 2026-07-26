"""Bedrock conversational wisdom — RAG over ai/corpus markdown.

Full working fallback chain so users rarely see AI errors. Never Claude.
Override: BEDROCK_MODEL_IDS=id1,id2,...
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
from typing import Any, AsyncIterator, Iterator, List, Optional, Tuple

from ai.wisdom_rag import format_context, retrieve
from ai.wisdom_guardrails import enforce_wisdom_scope

logger = logging.getLogger("christcalm.llm")

# Primary + probed working fallbacks (first success wins). Unchanged for product reliability.
DEFAULT_PRIMARY = "openai.gpt-oss-20b-1:0"

DEFAULT_MODEL_CHAIN = (
    "openai.gpt-oss-20b-1:0",
    "us.amazon.nova-micro-v1:0",
    "us.amazon.nova-lite-v1:0",
    "us.amazon.nova-2-lite-v1:0",
    "us.meta.llama3-1-8b-instruct-v1:0",
    "mistral.mistral-large-2402-v1:0",
    "us.meta.llama3-1-70b-instruct-v1:0",
    "us.meta.llama3-3-70b-instruct-v1:0",
    "us.amazon.nova-pro-v1:0",
    "us.deepseek.r1-v1:0",
    "us.mistral.pixtral-large-2502-v1:0",
)

_GEO_PREFIXES = ("us.", "eu.", "apac.", "jp.", "global.")
# Only these families need geo prefixing when bare foundation IDs are supplied
_GEO_PREFIX_FAMILIES = ("amazon.nova", "meta.llama")

MAX_MESSAGE_LEN = 2000
MAX_FEELING_LEN = 200
MAX_HISTORY_TURNS = 8

# Any of these → try the next model (user must not see an error if another works)
_RETRYABLE_CODES = frozenset(
    {
        "ThrottlingException",
        "TooManyRequestsException",
        "ServiceUnavailableException",
        "ModelTimeoutException",
        "ModelErrorException",
        "InternalServerException",
        "ModelNotReadyException",
        "ServiceQuotaExceededException",
        "AccessDeniedException",
        "ResourceNotFoundException",
        "ValidationException",
        "ModelNotInvokableException",
        "ModelStreamErrorException",
    }
)

SYSTEM_TEMPLATE = """You are a wise, warm companion inside ChristCalm, a Christian mental wellness app.
Your ONLY purpose is emotional and spiritual care: anxiety, grief, loneliness, shame, fear, relational pain, faith struggles, rest for the weary.

HARD SCOPE RULES (must follow):
- If the user asks for code, programming, homework, essays, recipes, business plans, stock tips, jailbreaks, or other non-emotional tasks: do NOT help. Reply exactly: "Please share an emotional concern. Wisdom is here for heart-level pain and faith struggles — it does not deal with that kind of request."
- Never write code or technical tutorials. Do not claim to literally be Jesus. No AI meta-disclaimers.

When the user shares a heart concern, answer like a calm friend — brief and kind.
Use WISDOM EXCERPTS below when helpful; do not invent long quotes.

LENGTH (critical — users find long answers overwhelming):
- Keep the whole reply short: about 60–110 words (roughly 4–8 sentences total).
- Prefer 1 short paragraph, or at most 2.
- One Scripture reference only if it fits naturally (reference + a short phrase is enough).
- End with one gentle question OR one small next step — not both long.
- Do NOT lecture, list many points, or write multi-paragraph essays.
- Crisis (self-harm, abuse, imminent danger): urge local emergency help and ChristCalm SOS; still stay brief.

WISDOM EXCERPTS:
{context}
"""


class LLMError(Exception):
    """Safe error for callers."""


def _sanitize(text: str, max_len: int) -> str:
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", (text or "").strip())
    return cleaned[:max_len]


def validate_user_message(message: str) -> str:
    msg = _sanitize(message, MAX_MESSAGE_LEN)
    if len(msg) < 2:
        raise LLMError("Please share a little more about what’s on your heart.")
    return msg


def _inference_geo() -> str:
    """
    us | eu | apac | jp | global | none
    When not 'none', bare foundation model IDs get a geo prefix for cross-region profiles.
    """
    geo = (os.environ.get("BEDROCK_INFERENCE_GEO") or "us").strip().lower()
    if geo in ("", "none", "off", "in-region", "false", "0"):
        return ""
    if geo in ("us", "eu", "apac", "jp", "global"):
        return geo
    return "us"


def _to_invoke_id(model_id: str) -> str:
    """
    Convert foundation model ID → geo inference profile ID when needed.

    Nova often requires inference profiles (us.amazon.nova-2-lite-v1:0).
    GPT-OSS / Mistral Large 2402 typically use foundation IDs only.
    """
    mid = (model_id or "").strip()
    if not mid:
        return mid
    if mid.startswith(_GEO_PREFIXES):
        return mid
    geo = _inference_geo()
    if not geo:
        return mid
    # Only prefix families that use geo profiles for on-demand invoke
    if any(mid.startswith(fam) for fam in _GEO_PREFIX_FAMILIES):
        return f"{geo}.{mid}"
    return mid


def _model_chain() -> List[str]:
    """
    Ordered Bedrock invoke IDs (US Meta Llama inference profiles by default).
    BEDROCK_MODEL_IDS=comma,separated  → full chain override
    else primary (BEDROCK_MODEL_ID) + remaining DEFAULT_MODEL_CHAIN entries.
    """
    multi = (os.environ.get("BEDROCK_MODEL_IDS") or "").strip()
    if multi:
        chain = [m.strip() for m in multi.split(",") if m.strip()]
    else:
        primary = (
            os.environ.get("BEDROCK_MODEL_ID")
            or os.environ.get("WISDOM_MODEL_ID")
            or DEFAULT_PRIMARY
        ).strip()
        # Keep primary first; append the rest of the Llama ladder (no dups)
        rest = [m for m in DEFAULT_MODEL_CHAIN if m != primary]
        chain = [primary, *rest]

    out: List[str] = []
    for m in chain:
        if not m:
            continue
        if "anthropic" in m.lower() or "claude" in m.lower():
            logger.warning("Skipping Claude model in chain: %s", m)
            continue
        invoke_id = _to_invoke_id(m)
        if invoke_id not in out:
            out.append(invoke_id)
    return out or [DEFAULT_PRIMARY]


def _model_id() -> str:
    """Primary model (first in chain) — for status / logging."""
    return _model_chain()[0]


def _extract_text(content_blocks: list) -> str:
    parts: list[str] = []
    for block in content_blocks or []:
        if isinstance(block, dict):
            if "text" in block and block["text"]:
                parts.append(block["text"])
    return "\n".join(parts).strip()


def _trim_reply(text: str, max_chars: int = 720) -> str:
    """Soft cap for chat UI — prefer complete sentences under max_chars."""
    cleaned = re.sub(r"\n{3,}", "\n\n", (text or "").strip())
    if len(cleaned) <= max_chars:
        return cleaned
    chunk = cleaned[: max_chars + 1]
    for sep in (". ", "? ", "! ", ".\n", "?\n", "!\n"):
        idx = chunk.rfind(sep)
        if idx >= int(max_chars * 0.45):
            return chunk[: idx + 1].strip()
    return chunk[:max_chars].rsplit(" ", 1)[0].strip() + "…"


def _inference_config() -> dict:
    return {
        "maxTokens": int(os.environ.get("BEDROCK_MAX_TOKENS", "280")),
        "temperature": float(os.environ.get("BEDROCK_TEMPERATURE", "0.55")),
    }


def _converse_one(
    client: Any,
    model_id: str,
    system: str,
    bedrock_messages: list,
) -> str:
    """Single model invoke. Raises ClientError / BotoCoreError / LLMError."""
    from botocore.exceptions import BotoCoreError, ClientError

    try:
        response = client.converse(
            modelId=model_id,
            system=[{"text": system}],
            messages=bedrock_messages,
            inferenceConfig=_inference_config(),
        )
        blocks = response.get("output", {}).get("message", {}).get("content", [])
        text = _trim_reply(_extract_text(blocks))
        if not text:
            raise LLMError("empty_response")
        return text
    except ClientError:
        raise
    except BotoCoreError:
        raise
    except LLMError:
        raise
    except Exception as e:
        logger.exception("Bedrock unexpected model=%s: %s", model_id, type(e).__name__)
        raise LLMError("Wisdom is temporarily unavailable. Please try again.") from e


def _extract_stream_delta(event: dict) -> str:
    """Pull text from a converse_stream event, if present."""
    if not isinstance(event, dict):
        return ""
    # Preferred: contentBlockDelta.delta.text
    block = event.get("contentBlockDelta") or {}
    delta = block.get("delta") if isinstance(block, dict) else None
    if isinstance(delta, dict) and delta.get("text"):
        return str(delta["text"])
    # Some SDKs nest differently
    if "delta" in event and isinstance(event["delta"], dict) and event["delta"].get("text"):
        return str(event["delta"]["text"])
    return ""


def _converse_stream_one(
    client: Any,
    model_id: str,
    system: str,
    bedrock_messages: list,
):
    """
    Stream text deltas from one model.
    Yields str chunks; raises ClientError / BotoCoreError / LLMError.
    """
    from botocore.exceptions import BotoCoreError, ClientError

    try:
        response = client.converse_stream(
            modelId=model_id,
            system=[{"text": system}],
            messages=bedrock_messages,
            inferenceConfig=_inference_config(),
        )
        stream = response.get("stream")
        if stream is None:
            # Unexpected shape — fall back to non-stream invoke
            yield _converse_one(client, model_id, system, bedrock_messages)
            return

        any_text = False
        for event in stream:
            if not isinstance(event, dict):
                continue
            if "messageStop" in event or "metadata" in event:
                continue
            if "internalServerException" in event:
                raise LLMError("empty_response")
            if "modelStreamErrorException" in event:
                raise LLMError("empty_response")
            piece = _extract_stream_delta(event)
            if piece:
                any_text = True
                yield piece
        if not any_text:
            raise LLMError("empty_response")
    except ClientError:
        raise
    except BotoCoreError:
        raise
    except LLMError:
        raise
    except Exception as e:
        logger.exception("Bedrock stream unexpected model=%s: %s", model_id, type(e).__name__)
        raise LLMError("Wisdom is temporarily unavailable. Please try again.") from e


def _should_fallback(exc: BaseException) -> bool:
    """Prefer trying another model over surfacing an error to the user."""
    from botocore.exceptions import (
        BotoCoreError,
        ClientError,
        EndpointConnectionError,
        ConnectTimeoutError,
        ReadTimeoutError,
    )

    if isinstance(exc, LLMError) and str(exc) == "empty_response":
        return True
    if isinstance(exc, (EndpointConnectionError, ConnectTimeoutError, ReadTimeoutError)):
        return True
    if isinstance(exc, BotoCoreError) and not isinstance(exc, ClientError):
        return True
    if isinstance(exc, ClientError):
        code = exc.response.get("Error", {}).get("Code", "") or ""
        msg = str(exc).lower()
        if code in _RETRYABLE_CODES:
            return True
        # Legacy / access / capacity wording — always try next
        if any(
            s in msg
            for s in (
                "throttl",
                "too many requests",
                "service unavailable",
                "timeout",
                "quota",
                "capacity",
                "access denied",
                "legacy",
                "not authorized",
                "not enabled",
                "invalid",
                "on-demand",
            )
        ):
            return True
        # Default: still try next model so user rarely sees failure
        return True
    # Unknown errors: try next model rather than fail hard mid-chain
    return True


def _converse_sync(
    system: str,
    messages: List[dict[str, str]],
) -> Tuple[str, str]:
    """
    Try model chain. Returns (reply_text, model_id_used).
    """
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError

    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    client = boto3.Session(region_name=region).client("bedrock-runtime")
    chain = _model_chain()

    bedrock_messages = []
    for m in messages:
        role = m["role"]
        if role not in ("user", "assistant"):
            continue
        bedrock_messages.append(
            {"role": role, "content": [{"text": m["content"]}]}
        )

    if not bedrock_messages or bedrock_messages[-1]["role"] != "user":
        raise LLMError("Invalid conversation state.")

    last_error: Optional[BaseException] = None
    last_code = ""

    for i, model_id in enumerate(chain):
        try:
            text = _converse_one(client, model_id, system, bedrock_messages)
            if i > 0:
                logger.warning(
                    "Bedrock fallback succeeded model=%s after_primary_failures=%s",
                    model_id,
                    i,
                )
            else:
                logger.info("Bedrock ok model=%s", model_id)
            return text, model_id
        except ClientError as e:
            last_error = e
            last_code = e.response.get("Error", {}).get("Code", "")
            logger.error(
                "Bedrock ClientError %s model=%s (%s/%s): %s",
                last_code,
                model_id,
                i + 1,
                len(chain),
                e,
            )
            if i < len(chain) - 1 and _should_fallback(e):
                logger.warning("Trying next Bedrock model after %s", model_id)
                continue
            break
        except BotoCoreError as e:
            last_error = e
            logger.error(
                "Bedrock BotoCoreError model=%s (%s/%s): %s",
                model_id,
                i + 1,
                len(chain),
                e,
            )
            if i < len(chain) - 1 and _should_fallback(e):
                continue
            break
        except LLMError as e:
            last_error = e
            if str(e) == "empty_response" and i < len(chain) - 1:
                logger.warning("Empty reply from %s — trying next model", model_id)
                continue
            if str(e) == "empty_response":
                raise LLMError("No response was generated. Please try again.") from e
            raise

    # Only after every model in the chain failed
    logger.error(
        "All Bedrock models failed last_code=%s last_err=%s chain=%s",
        last_code,
        last_error,
        chain,
    )
    raise LLMError(
        "Wisdom is temporarily unavailable. Please try again in a moment."
    ) from last_error


async def generate_wisdom_reply(
    user_message: str,
    history: Optional[List[dict[str, str]]] = None,
) -> dict[str, Any]:
    """
    RAG + Bedrock conversational reply (with model fallbacks).
    history: prior turns [{role, content}] oldest-first, excluding the new user message.
    Guardrails run before Bedrock — off-topic requests never hit the model.
    """
    msg = validate_user_message(user_message)

    allowed, blocked_reply = enforce_wisdom_scope(msg)
    if not allowed:
        return {
            "reply": blocked_reply,
            "model": "guardrail",
            "sources": [],
            "blocked": True,
        }

    chunks = retrieve(msg, top_k=4)
    context = format_context(chunks)
    system = SYSTEM_TEMPLATE.format(context=context)

    messages: List[dict[str, str]] = []
    if history:
        for turn in history[-MAX_HISTORY_TURNS * 2 :]:
            role = turn.get("role")
            content = _sanitize(turn.get("content") or "", MAX_MESSAGE_LEN)
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": msg})

    loop = asyncio.get_event_loop()
    reply, model_used = await loop.run_in_executor(
        None, _converse_sync, system, messages
    )

    return {
        "reply": reply,
        "model": model_used,
        "sources": [
            {"source": c["source"], "heading": c["heading"]} for c in chunks
        ],
        "blocked": False,
    }


def _converse_stream_sync(
    system: str,
    messages: List[dict[str, str]],
) -> Iterator[Tuple[str, Any]]:
    """
    Stream Bedrock tokens with model fallbacks.
    Yields ("delta", text_chunk) then ("done", model_id).
    """
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError

    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    client = boto3.Session(region_name=region).client("bedrock-runtime")
    chain = _model_chain()

    bedrock_messages = []
    for m in messages:
        role = m["role"]
        if role not in ("user", "assistant"):
            continue
        bedrock_messages.append({"role": role, "content": [{"text": m["content"]}]})

    if not bedrock_messages or bedrock_messages[-1]["role"] != "user":
        raise LLMError("Invalid conversation state.")

    last_error: Optional[BaseException] = None

    for i, model_id in enumerate(chain):
        emitted = 0
        try:
            for piece in _converse_stream_one(client, model_id, system, bedrock_messages):
                emitted += 1
                yield ("delta", piece)
            if emitted == 0:
                raise LLMError("empty_response")
            if i > 0:
                logger.warning(
                    "Bedrock stream fallback succeeded model=%s after_primary_failures=%s",
                    model_id,
                    i,
                )
            else:
                logger.info("Bedrock stream ok model=%s", model_id)
            yield ("done", model_id)
            return
        except ClientError as e:
            last_error = e
            last_code = e.response.get("Error", {}).get("Code", "")
            logger.error(
                "Bedrock stream ClientError %s model=%s (%s/%s): %s",
                last_code,
                model_id,
                i + 1,
                len(chain),
                e,
            )
            # Never switch models after tokens already reached the client
            if emitted > 0:
                break
            if i < len(chain) - 1 and _should_fallback(e):
                continue
            break
        except BotoCoreError as e:
            last_error = e
            logger.error(
                "Bedrock stream BotoCoreError model=%s (%s/%s): %s",
                model_id,
                i + 1,
                len(chain),
                e,
            )
            if emitted > 0:
                break
            if i < len(chain) - 1 and _should_fallback(e):
                continue
            break
        except LLMError as e:
            last_error = e
            if emitted > 0:
                raise
            if str(e) == "empty_response" and i < len(chain) - 1:
                logger.warning("Empty stream from %s — trying next model", model_id)
                continue
            if str(e) == "empty_response":
                raise LLMError("No response was generated. Please try again.") from e
            raise

    logger.error("All Bedrock stream models failed last_err=%s chain=%s", last_error, chain)
    raise LLMError(
        "Wisdom is temporarily unavailable. Please try again in a moment."
    ) from last_error


async def generate_wisdom_reply_stream(
    user_message: str,
    history: Optional[List[dict[str, str]]] = None,
) -> AsyncIterator[dict[str, Any]]:
    """
    Async stream of wisdom events:
      {"type":"meta", "blocked": bool, "sources": [...], "model"?: str}
      {"type":"delta", "text": str}
      {"type":"done", "reply": str, "model": str, "sources": [...], "blocked": bool}
      {"type":"error", "message": str}
    """
    msg = validate_user_message(user_message)

    allowed, blocked_reply = enforce_wisdom_scope(msg)
    if not allowed:
        yield {
            "type": "meta",
            "blocked": True,
            "sources": [],
            "model": "guardrail",
        }
        yield {"type": "delta", "text": blocked_reply}
        yield {
            "type": "done",
            "reply": blocked_reply,
            "model": "guardrail",
            "sources": [],
            "blocked": True,
        }
        return

    chunks = retrieve(msg, top_k=4)
    context = format_context(chunks)
    system = SYSTEM_TEMPLATE.format(context=context)
    sources = [{"source": c["source"], "heading": c["heading"]} for c in chunks]

    messages: List[dict[str, str]] = []
    if history:
        for turn in history[-MAX_HISTORY_TURNS * 2 :]:
            role = turn.get("role")
            content = _sanitize(turn.get("content") or "", MAX_MESSAGE_LEN)
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": msg})

    yield {"type": "meta", "blocked": False, "sources": sources}

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()

    def worker() -> None:
        try:
            for kind, payload in _converse_stream_sync(system, messages):
                loop.call_soon_threadsafe(queue.put_nowait, (kind, payload))
            loop.call_soon_threadsafe(queue.put_nowait, ("_end", None))
        except Exception as e:  # noqa: BLE001 — surface to async consumer
            loop.call_soon_threadsafe(queue.put_nowait, ("_err", e))

    asyncio.create_task(asyncio.to_thread(worker))

    parts: list[str] = []
    model_used = ""
    while True:
        kind, payload = await queue.get()
        if kind == "_end":
            break
        if kind == "_err":
            err = payload
            if isinstance(err, LLMError):
                yield {"type": "error", "message": str(err)}
            else:
                logger.exception("Wisdom stream worker failed: %s", err)
                yield {
                    "type": "error",
                    "message": "Wisdom is temporarily unavailable. Please try again.",
                }
            return
        if kind == "delta":
            parts.append(str(payload))
            yield {"type": "delta", "text": str(payload)}
        elif kind == "done":
            model_used = str(payload)

    full = _trim_reply("".join(parts))
    yield {
        "type": "done",
        "reply": full,
        "model": model_used or _model_id(),
        "sources": sources,
        "blocked": False,
    }


# Back-compat alias used by older imports/tests
async def generate_prayer(feeling: str, context: Optional[str] = None) -> str:
    prompt = feeling
    if context:
        prompt = f"{feeling}. Context: {context}"
    result = await generate_wisdom_reply(prompt)
    return result["reply"]


def validate_prayer_input(feeling: str, context: Optional[str] = None):
    """Validate short prayer / feeling input (not full chat messages)."""
    f = _sanitize(feeling or "", MAX_FEELING_LEN)
    if not f:
        raise LLMError("Feeling is required")
    c = _sanitize(context, 1000) if context else None
    return f, c or None
