"""Load wisdom markdown corpus and retrieve relevant chunks (lightweight RAG)."""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

# Packaged corpus next to this package, then Lambda package path
_CANDIDATE_ROOTS = [
    Path(__file__).resolve().parent / "corpus",  # backend/ai/corpus
    Path("/var/task/ai/corpus"),
]


def _wisdom_dir() -> Path:
    for p in _CANDIDATE_ROOTS:
        if p.is_dir():
            return p
    # Fallback empty dir path (retrieval returns voice-only)
    return _CANDIDATE_ROOTS[0]


@lru_cache(maxsize=1)
def load_chunks() -> tuple[dict, ...]:
    """Parse all .md files into section chunks keyed by heading."""
    root = _wisdom_dir()
    chunks: list[dict] = []
    if not root.is_dir():
        return tuple()

    for path in sorted(root.glob("*.md")):
        # Skip docs, AppleDouble (._*), and other non-corpus files
        name = path.name
        if name.startswith(".") or name.startswith("._"):
            continue
        if name.upper() in ("README.MD", "README.MARKDOWN"):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        parts = re.split(r"(?=^##\s+)", text, flags=re.MULTILINE)
        for part in parts:
            part = part.strip()
            if len(part) < 80:
                continue
            heading_m = re.match(r"^##\s+(.+)$", part, re.MULTILINE)
            heading = heading_m.group(1).strip() if heading_m else path.stem
            # Soft cap per chunk for prompt size
            body = part[:2200]
            chunks.append(
                {
                    "source": path.name,
                    "heading": heading,
                    "text": body,
                    "tokens": _tokenize(heading + " " + body),
                }
            )
    return tuple(chunks)


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z']{3,}", text.lower())
    stop = {
        "the",
        "and",
        "for",
        "that",
        "with",
        "this",
        "from",
        "your",
        "you",
        "are",
        "was",
        "were",
        "have",
        "has",
        "not",
        "but",
        "what",
        "when",
        "how",
        "who",
        "can",
        "will",
        "all",
        "any",
        "into",
        "about",
        "than",
        "then",
        "them",
        "they",
        "their",
        "there",
        "which",
        "would",
        "could",
        "should",
        "also",
        "just",
        "like",
        "some",
        "more",
        "very",
        "only",
        "other",
        "such",
        "through",
        "over",
        "after",
        "before",
        "between",
    }
    return {w for w in words if w not in stop}


def retrieve(query: str, top_k: int = 4) -> List[dict]:
    """Keyword overlap retrieval — good enough for handbook-scale corpus."""
    chunks = load_chunks()
    if not chunks:
        return []
    q = _tokenize(query)
    if not q:
        # fallback: prefer jesus_voice + a couple mid handbook chunks
        return list(chunks[: min(top_k, len(chunks))])

    scored: list[tuple[float, dict]] = []
    for ch in chunks:
        overlap = len(q & ch["tokens"])
        if overlap == 0:
            continue
        # Boost jesus_voice for pastoral tone
        boost = 1.5 if ch["source"] == "jesus_voice.md" else 1.0
        score = overlap * boost
        # Prefer emotion-related sections lightly
        scored.append((score, ch))

    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        # No lexical hit — still pass jesus_voice if present
        voice = [c for c in chunks if c["source"] == "jesus_voice.md"]
        return (voice + list(chunks[:3]))[:top_k]

    return [c for _, c in scored[:top_k]]


def format_context(chunks: List[dict]) -> str:
    if not chunks:
        return "(No handbook excerpts matched; rely on gospel-shaped pastoral care.)"
    blocks = []
    for i, ch in enumerate(chunks, 1):
        blocks.append(
            f"[Excerpt {i} · {ch['source']} · {ch['heading']}]\n{ch['text']}"
        )
    return "\n\n---\n\n".join(blocks)


def corpus_stats() -> dict:
    chunks = load_chunks()
    sources = sorted({c["source"] for c in chunks})
    return {
        "chunk_count": len(chunks),
        "sources": sources,
        "wisdom_dir": str(_wisdom_dir()),
    }
