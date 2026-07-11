"""Static seed content for ChristCalm — emotions, meditations, prayers, devotionals.

Meditation cover images (edit by hand):
  assets/meditations/covers/med-1.jpg … med-10.jpg
Bundled for Expo:
  frontend/assets/meditations/covers/ (keep in sync — see assets/README.md)

Optional CDN: set MEDIA_BASE_URL so API returns full HTTPS cover URLs.
"""

from __future__ import annotations

import os
from pathlib import Path

# Local media roots (repo)
ASSETS_ROOT = Path(__file__).resolve().parents[1] / "assets"
AUDIO_ASSETS_DIR = ASSETS_ROOT / "audio"
COVERS_DIR = ASSETS_ROOT / "meditations" / "covers"


def _media_base() -> str:
    return (os.environ.get("MEDIA_BASE_URL") or "").rstrip("/")


def cover_for(med_id: str) -> dict:
    """
    cover_file: local filename (med-N.jpg)
    cover: remote URL if MEDIA_BASE_URL set, else empty (client uses bundled asset)
    """
    filename = f"{med_id}.jpg"
    base = _media_base()
    return {
        "cover_file": filename,
        "cover": f"{base}/meditations/covers/{filename}" if base else "",
    }


def audio_for(filename: str, fallback_url: str) -> str:
    """Prefer CDN path when MEDIA_BASE_URL set; else public fallback URL."""
    base = _media_base()
    if base:
        return f"{base}/meditations/audio/{filename}"
    return fallback_url


# Core support set — hard moments first.
EMOTIONS = [
    {"id": "anxious", "label": "Anxious", "color": "#F4C77B", "emoji": "🌊"},
    {"id": "fearful", "label": "Fearful", "color": "#B8A5D9", "emoji": "🕊️"},
    {"id": "sad", "label": "Sad", "color": "#89A9C5", "emoji": "🌧️"},
    {"id": "overwhelmed", "label": "Overwhelmed", "color": "#E29587", "emoji": "🌀"},
    {"id": "lonely", "label": "Lonely", "color": "#A8B5A0", "emoji": "🌙"},
    {"id": "hopeful", "label": "Hopeful", "color": "#8FC0A9", "emoji": "🌱"},
    {"id": "peaceful", "label": "Peaceful", "color": "#B8D4C7", "emoji": "🕯️"},
]

# Pixabay ambient fallbacks until you host your own under assets/meditations/audio/
_A1 = "https://cdn.pixabay.com/audio/2022/03/15/audio_1b41cf1c05.mp3"
_A2 = "https://cdn.pixabay.com/audio/2023/06/19/audio_c3a3b4e6b4.mp3"
_A3 = "https://cdn.pixabay.com/audio/2022/10/18/audio_31ae1b7702.mp3"

MEDITATIONS = [
    {
        "id": "med-1",
        "emotion": "anxious",
        "title": "Cast Your Cares",
        "subtitle": "A 5-minute release into God's peace",
        "duration_min": 5,
        **cover_for("med-1"),
        "scripture": "1 Peter 5:7",
        "verse": "Cast all your anxiety on him because he cares for you.",
        "audio_url": audio_for("med-1.mp3", _A1),
        "premium": False,
    },
    {
        "id": "med-2",
        "emotion": "anxious",
        "title": "Be Still and Know",
        "subtitle": "Guided stillness in His presence",
        "duration_min": 8,
        **cover_for("med-2"),
        "scripture": "Psalm 46:10",
        "verse": "Be still, and know that I am God.",
        "audio_url": audio_for("med-2.mp3", _A2),
        "premium": True,
    },
    {
        "id": "med-3",
        "emotion": "fearful",
        "title": "Fear Not, For I Am With You",
        "subtitle": "Anchoring in God's presence",
        "duration_min": 7,
        **cover_for("med-3"),
        "scripture": "Isaiah 41:10",
        "verse": "So do not fear, for I am with you; do not be dismayed, for I am your God.",
        "audio_url": audio_for("med-3.mp3", _A3),
        "premium": False,
    },
    {
        "id": "med-4",
        "emotion": "sad",
        "title": "Comfort in Sorrow",
        "subtitle": "A gentle meditation on God's comfort",
        "duration_min": 6,
        **cover_for("med-4"),
        "scripture": "Matthew 5:4",
        "verse": "Blessed are those who mourn, for they will be comforted.",
        "audio_url": audio_for("med-4.mp3", _A1),
        "premium": False,
    },
    {
        "id": "med-5",
        "emotion": "overwhelmed",
        "title": "Come to Me",
        "subtitle": "Finding rest in Christ",
        "duration_min": 10,
        **cover_for("med-5"),
        "scripture": "Matthew 11:28",
        "verse": "Come to me, all you who are weary and burdened, and I will give you rest.",
        "audio_url": audio_for("med-5.mp3", _A2),
        "premium": True,
    },
    {
        "id": "med-6",
        "emotion": "lonely",
        "title": "Never Alone",
        "subtitle": "God's unwavering presence",
        "duration_min": 6,
        **cover_for("med-6"),
        "scripture": "Deuteronomy 31:6",
        "verse": "He will never leave you nor forsake you.",
        "audio_url": audio_for("med-6.mp3", _A3),
        "premium": False,
    },
    {
        "id": "med-7",
        "emotion": "hopeful",
        "title": "A Thankful Heart",
        "subtitle": "Meditation on God's goodness",
        "duration_min": 5,
        **cover_for("med-7"),
        "scripture": "1 Thessalonians 5:18",
        "verse": "Give thanks in all circumstances.",
        "audio_url": audio_for("med-7.mp3", _A1),
        "premium": False,
    },
    {
        "id": "med-8",
        "emotion": "peaceful",
        "title": "Joy of the Lord",
        "subtitle": "Celebrating His faithfulness",
        "duration_min": 6,
        **cover_for("med-8"),
        "scripture": "Nehemiah 8:10",
        "verse": "The joy of the Lord is your strength.",
        "audio_url": audio_for("med-8.mp3", _A2),
        "premium": True,
    },
    {
        "id": "med-9",
        "emotion": "hopeful",
        "title": "Hope Anchors the Soul",
        "subtitle": "Steadfast in God's promises",
        "duration_min": 8,
        **cover_for("med-9"),
        "scripture": "Hebrews 6:19",
        "verse": "We have this hope as an anchor for the soul, firm and secure.",
        "audio_url": audio_for("med-9.mp3", _A3),
        "premium": False,
    },
    {
        "id": "med-10",
        "emotion": "peaceful",
        "title": "Peace That Surpasses",
        "subtitle": "Resting in divine peace",
        "duration_min": 12,
        **cover_for("med-10"),
        "scripture": "Philippians 4:7",
        "verse": "And the peace of God, which transcends all understanding, will guard your hearts.",
        "audio_url": audio_for("med-10.mp3", _A2),
        "premium": True,
    },
]

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
        "premium": True,
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
        "premium": True,
    },
    {
        "id": "prayer-healing-2",
        "category": "healing",
        "title": "Wholeness in Christ",
        "body": "Lord, by Your stripes I am healed. I receive Your wholeness today — spirit, soul, and body. Thank You for Your redeeming love. Amen.",
        "premium": True,
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
    {"id": "morning", "label": "Morning", "cover": _cat_cover("med-4"), "cover_file": "med-4.jpg"},
    {"id": "evening", "label": "Evening", "cover": _cat_cover("med-3"), "cover_file": "med-3.jpg"},
    {"id": "anxiety", "label": "Anxiety", "cover": _cat_cover("med-2"), "cover_file": "med-2.jpg"},
    {"id": "gratitude", "label": "Gratitude", "cover": _cat_cover("med-5"), "cover_file": "med-5.jpg"},
    {"id": "healing", "label": "Healing", "cover": _cat_cover("med-1"), "cover_file": "med-1.jpg"},
]
