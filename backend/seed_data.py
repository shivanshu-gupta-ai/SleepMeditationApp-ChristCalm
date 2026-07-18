"""Static seed content for ChristCalm — emotions, meditations, prayers, devotionals.

Meditation media:
  assets/meditations/covers/<track>.jpg  — one unique cover per session
  assets/meditations/audio/<track>.*     — source audio (hosted on S3)
  frontend/assets/meditations/covers/    — bundled covers (sync via scripts/sync-meditation-covers.sh)

Set MEDIA_BASE_URL for public HTTPS audio/cover URLs (default S3 media bucket).
"""

from __future__ import annotations

import os


def _media_base() -> str:
    return (os.environ.get("MEDIA_BASE_URL") or "").rstrip("/")


# Fallback covers if a track-specific art file is missing
_EMOTION_COVER = {
    "anxious": "shanti",
    "fearful": "transforming-emotions",
    "sad": "contentment",
    "overwhelmed": "panchakosha",
    "lonely": "aura",
    "hopeful": "sun",
    "peaceful": "space",
    "grateful": "happy",
    "cant_sleep": "bamboo-flute",
}


def cover_for(med_id: str, *, emotion: str | None = None, cover_key: str | None = None) -> dict:
    """
    cover_file: unique per meditation track (e.g. shanti.jpg) — one art per session.
    cover: remote URL if MEDIA_BASE_URL set; client also bundles the same files.
    """
    key = cover_key or (emotion and _EMOTION_COVER.get(emotion)) or med_id
    filename = f"{key}.jpg" if not str(key).endswith(".jpg") else str(key)
    base = _media_base()
    return {
        "cover_file": filename,
        "cover": f"{base}/meditations/covers/{filename}" if base else "",
    }


def audio_for(filename: str, fallback_url: str = "") -> str:
    """Prefer CDN / S3 path when MEDIA_BASE_URL set; else fallback URL."""
    base = _media_base()
    if base:
        return f"{base}/meditations/audio/{filename}"
    return fallback_url or f"/media/meditations/audio/{filename}"


# Core support set — hard moments first.
EMOTIONS = [
    {"id": "anxious", "label": "Anxious", "color": "#F4C77B", "emoji": "🌊"},
    {"id": "fearful", "label": "Fearful", "color": "#B8A5D9", "emoji": "🕊️"},
    {"id": "sad", "label": "Sad", "color": "#89A9C5", "emoji": "🌧️"},
    {"id": "overwhelmed", "label": "Drained", "color": "#E29587", "emoji": "🌀"},
    {"id": "lonely", "label": "Lonely", "color": "#A8B5A0", "emoji": "🌙"},
    {"id": "hopeful", "label": "Hopeful", "color": "#8FC0A9", "emoji": "🌱"},
    {"id": "peaceful", "label": "Peaceful", "color": "#B8D4C7", "emoji": "🕯️"},
    {"id": "grateful", "label": "Grateful", "color": "#D9B88C", "emoji": "🍃"},
    {"id": "cant_sleep", "label": "Can't sleep", "color": "#9BA8C9", "emoji": "😴"},
]

# Public media host (S3). Override with MEDIA_BASE_URL env.
_DEFAULT_MEDIA_BASE = (
    "https://christcalm-preview-media-500696805306.s3.us-east-1.amazonaws.com"
)
if not os.environ.get("MEDIA_BASE_URL"):
    os.environ["MEDIA_BASE_URL"] = _DEFAULT_MEDIA_BASE

# Track catalog — file slugs are internal; titles are Christ-centered for the app UI.
_TRACKS = {
    "shanti": {
        "file": "shanti.m4a",
        "title": "Cast Your Cares",
        "subtitle": "Release worry into the Father’s hands",
        "duration_min": 50,
    },
    "sun": {
        "file": "sun.mp3",
        "title": "Morning Mercies",
        "subtitle": "Hope rises with His new mercies",
        "duration_min": 34,
    },
    "bamboo-flute": {
        "file": "bamboo-flute.mp3",
        "title": "Lie Down in Peace",
        "subtitle": "Instrumental rest for a quiet night",
        "duration_min": 25,
    },
    "aura": {
        "file": "aura.mp3",
        "title": "Never Alone",
        "subtitle": "Rest in His nearness when you feel far",
        "duration_min": 46,
    },
    "contentment": {
        "file": "contentment.mp3",
        "title": "Comfort in Sorrow",
        "subtitle": "Receive His comfort for a heavy heart",
        "duration_min": 25,
    },
    "happy": {
        "file": "happy.mp3",
        "title": "Joy of the Lord",
        "subtitle": "Strength and gladness in His presence",
        "duration_min": 24,
    },
    "laugh-sing-1": {
        "file": "laugh-sing-1.mp3",
        "title": "Make a Joyful Noise",
        "subtitle": "Let praise lift what grief has weighed down",
        "duration_min": 32,
    },
    "laugh-sing-2": {
        "file": "laugh-sing-2.mp3",
        "title": "Songs of Thanksgiving",
        "subtitle": "Gratitude that turns into worship",
        "duration_min": 32,
    },
    "panchakosha": {
        "file": "panchakosha.mp3",
        "title": "Come to Me and Rest",
        "subtitle": "Body and soul renewed in Christ",
        "duration_min": 47,
    },
    "space": {
        "file": "space.mp3",
        "title": "Be Still and Know",
        "subtitle": "Quiet your heart before the living God",
        "duration_min": 18,
    },
    "transforming-emotions": {
        "file": "transforming-emotions.mp3",
        "title": "Fear Not",
        "subtitle": "Trade fear for trust in His presence",
        "duration_min": 33,
    },
    "tick-tick": {
        "file": "tick-tick.mp3",
        "title": "Release Every Burden",
        "subtitle": "Slow body scan under His care",
        "duration_min": 40,
    },
    "ambient-track": {
        "file": "ambient-track.mp3",
        "title": "Abide With Me",
        "subtitle": "Gentle stillness in His peace",
        "duration_min": 10,
    },
}

# Emotion → tracks. Each track is exclusive to exactly one emotion (no cross-listing).
_EMOTION_TRACKS: dict[str, list[str]] = {
    "anxious": ["shanti"],
    "fearful": ["transforming-emotions"],
    "sad": ["contentment", "laugh-sing-1"],
    "lonely": ["aura"],
    "hopeful": ["sun"],
    "overwhelmed": ["panchakosha", "tick-tick"],  # Drained
    "peaceful": ["space", "ambient-track"],
    "grateful": ["happy", "laugh-sing-2"],
    "cant_sleep": ["bamboo-flute"],
}

# Guard: one track → one emotion only
_seen_tracks: set[str] = set()
for _em, _tracks in _EMOTION_TRACKS.items():
    for _t in _tracks:
        if _t in _seen_tracks:
            raise ValueError(f"Track {_t!r} assigned to more than one emotion")
        if _t not in _TRACKS:
            raise ValueError(f"Unknown track {_t!r} under emotion {_em!r}")
        _seen_tracks.add(_t)
del _seen_tracks, _em, _tracks, _t

_SCRIPTURE = {
    "anxious": ("1 Peter 5:7", "Cast all your anxiety on him because he cares for you."),
    "fearful": ("Isaiah 41:10", "So do not fear, for I am with you; do not be dismayed, for I am your God."),
    "sad": ("Matthew 5:4", "Blessed are those who mourn, for they will be comforted."),
    "overwhelmed": ("Matthew 11:28", "Come to me, all you who are weary and burdened, and I will give you rest."),
    "lonely": ("Deuteronomy 31:6", "He will never leave you nor forsake you."),
    "hopeful": ("Hebrews 6:19", "We have this hope as an anchor for the soul, firm and secure."),
    "peaceful": ("Philippians 4:7", "And the peace of God, which transcends all understanding, will guard your hearts."),
    "grateful": ("1 Thessalonians 5:18", "Give thanks in all circumstances."),
    "cant_sleep": ("Psalm 4:8", "In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety."),
}


def _build_meditations() -> list[dict]:
    items: list[dict] = []
    for emotion, tracks in _EMOTION_TRACKS.items():
        ref, verse = _SCRIPTURE.get(emotion, ("Psalm 46:10", "Be still, and know that I am God."))
        for i, track_id in enumerate(tracks):
            t = _TRACKS[track_id]
            items.append(
                {
                    "id": f"med-{emotion}-{track_id}",
                    "emotion": emotion,
                    "track": track_id,
                    "title": t["title"],
                    "subtitle": t["subtitle"],
                    "duration_min": t["duration_min"],
                    # Unique cover art per track (not shared across emotions)
                    **cover_for(f"med-{emotion}-{track_id}", emotion=emotion, cover_key=track_id),
                    "scripture": ref,
                    "verse": verse,
                    "audio_url": audio_for(t["file"]),
                    # All sessions unlocked (preview — no paywall gates)
                    "premium": False,
                }
            )
    return items


MEDITATIONS = _build_meditations()

PRAYERS = [
    {
        "id": "prayer-morning-1",
        "category": "morning",
        "title": "Morning Surrender",
        "body": "Heavenly Father, as I begin this day, I surrender every worry and every plan to You. Fill me with Your Spirit and guide my steps. In Jesus' name, Amen.",
        "premium": False,
    },
    {
        "id": "prayer-morning-2",
        "category": "morning",
        "title": "New Mercies",
        "body": "Lord, thank You that Your mercies are new every morning. Great is Your faithfulness. Help me walk today in the light of Your grace. Amen.",
        "premium": False,
    },
    {
        "id": "prayer-evening-1",
        "category": "evening",
        "title": "Evening Rest",
        "body": "Father, as the day ends, I release everything into Your hands. Thank You for Your presence today. Grant me peaceful rest under Your wings. Amen.",
        "premium": False,
    },
    {
        "id": "prayer-anxiety-1",
        "category": "anxiety",
        "title": "Peace in the Storm",
        "body": "Lord Jesus, my heart is heavy and my mind is racing. Speak peace over this storm within me. I trust You to be my anchor. Amen.",
        "premium": False,
    },
    {
        "id": "prayer-anxiety-2",
        "category": "anxiety",
        "title": "Release Worry",
        "body": "God, You tell me not to be anxious about anything, but to bring everything to You. Here I am, laying down my fears at Your feet. Amen.",
        "premium": False,
    },
    {
        "id": "prayer-gratitude-1",
        "category": "gratitude",
        "title": "Overflowing Thanks",
        "body": "Father, my heart overflows with gratitude for Your endless love, Your daily provision, and Your unshakable presence. Thank You. Amen.",
        "premium": False,
    },
    {
        "id": "prayer-healing-1",
        "category": "healing",
        "title": "Healing Touch",
        "body": "Great Physician, I come broken and in need of Your healing touch. Restore my body, mind, and spirit. I trust in Your perfect timing. Amen.",
        "premium": False,
    },
    {
        "id": "prayer-healing-2",
        "category": "healing",
        "title": "Wholeness in Christ",
        "body": "Lord, by Your stripes I am healed. I receive Your wholeness today — spirit, soul, and body. Thank You for Your redeeming love. Amen.",
        "premium": False,
    },
]

DEVOTIONALS = [
    {
        "id": "dev-1",
        "date": "daily",
        "verse": "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.",
        "reference": "John 14:27",
        "reflection": "Christ's peace is different — it is not the absence of storms, but the presence of the Savior within them. Today, receive His peace not as a feeling, but as a person: Jesus Himself.",
    },
    {
        "id": "dev-2",
        "date": "daily",
        "verse": "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
        "reference": "Psalm 23:1-3",
        "reflection": "When your soul is tired, remember: you have a Shepherd who leads, not drives. Let Him bring you to quiet waters today.",
    },
    {
        "id": "dev-3",
        "date": "daily",
        "verse": "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
        "reference": "Philippians 4:6",
        "reflection": "Anxiety loses its grip when we replace it with prayer and thanksgiving. Name three things you are thankful for today, and watch peace return.",
    },
]

# Category covers reuse meditation cover files when no MEDIA_BASE_URL
def _cat_cover(med_id: str) -> str:
    c = cover_for(med_id)
    return c["cover"] or ""


PRAYER_CATEGORIES = [
    {"id": "morning", "label": "Morning", "cover": _cat_cover("sun"), "cover_file": "sun.jpg"},
    {"id": "evening", "label": "Evening", "cover": _cat_cover("ambient-track"), "cover_file": "ambient-track.jpg"},
    {"id": "anxiety", "label": "Anxiety", "cover": _cat_cover("shanti"), "cover_file": "shanti.jpg"},
    {"id": "gratitude", "label": "Gratitude", "cover": _cat_cover("happy"), "cover_file": "happy.jpg"},
    {"id": "healing", "label": "Healing", "cover": _cat_cover("contentment"), "cover_file": "contentment.jpg"},
]
