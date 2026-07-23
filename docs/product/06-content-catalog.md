# Content catalog

Canonical seed content for MVP. IDs must stay stable across clients.

Media convention:

- Cover file: `{track}.jpg`  
- Audio file: see track table  
- Public URL pattern: `{MEDIA_BASE_URL}/meditations/{covers|audio}/{filename}`  
- Clients may also bundle covers for instant paint  

---

## Emotions

Each meditation maps to **exactly one** emotion.

| id | Label | Color (chip accent) | Notes |
|----|-------|---------------------|-------|
| `anxious` | Anxious | `#F4C77B` | Hard moment first |
| `fearful` | Fearful | `#B8A5D9` | |
| `sad` | Sad | `#89A9C5` | |
| `overwhelmed` | Drained | `#E29587` | UI label “Drained” |
| `lonely` | Lonely | `#A8B5A0` | |
| `hopeful` | Hopeful | `#8FC0A9` | |
| `peaceful` | Peaceful | `#B8D4C7` | |
| `grateful` | Grateful | `#D9B88C` | |
| `cant_sleep` | Can't sleep | `#9BA8C9` | Night path |

Use outline icons in UI (water, moon, heart, etc.) — colors are soft accents only.

---

## Scripture anchors (by emotion)

| Emotion | Reference | Verse |
|---------|-----------|-------|
| anxious | 1 Peter 5:7 | Cast all your anxiety on him because he cares for you. |
| fearful | Isaiah 41:10 | So do not fear, for I am with you; do not be dismayed, for I am your God. |
| sad | Matthew 5:4 | Blessed are those who mourn, for they will be comforted. |
| overwhelmed | Matthew 11:28 | Come to me, all you who are weary and burdened, and I will give you rest. |
| lonely | Deuteronomy 31:6 | He will never leave you nor forsake you. |
| hopeful | Hebrews 6:19 | We have this hope as an anchor for the soul, firm and secure. |
| peaceful | Philippians 4:7 | And the peace of God, which transcends all understanding, will guard your hearts. |
| grateful | 1 Thessalonians 5:18 | Give thanks in all circumstances. |
| cant_sleep | Psalm 4:8 | In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety. |

---

## Audio tracks

| track id | File | Title | Subtitle | Duration (min) |
|----------|------|-------|----------|----------------|
| `shanti` | shanti.m4a | Cast Your Cares | Release worry into the Father’s hands | 50 |
| `sun` | sun.mp3 | Morning Mercies | Hope rises with His new mercies | 34 |
| `bamboo-flute` | bamboo-flute.mp3 | Lie Down in Peace | Instrumental rest for a quiet night | 25 |
| `aura` | aura.mp3 | Never Alone | Rest in His nearness when you feel far | 46 |
| `contentment` | contentment.mp3 | Comfort in Sorrow | Receive His comfort for a heavy heart | 25 |
| `happy` | happy.mp3 | Joy of the Lord | Strength and gladness in His presence | 24 |
| `laugh-sing-1` | laugh-sing-1.mp3 | Make a Joyful Noise | Let praise lift what grief has weighed down | 32 |
| `laugh-sing-2` | laugh-sing-2.mp3 | Songs of Thanksgiving | Gratitude that turns into worship | 32 |
| `panchakosha` | panchakosha.mp3 | Come to Me and Rest | Body and soul renewed in Christ | 47 |
| `space` | space.mp3 | Be Still and Know | Quiet your heart before the living God | 18 |
| `transforming-emotions` | transforming-emotions.mp3 | Fear Not | Trade fear for trust in His presence | 33 |
| `tick-tick` | tick-tick.mp3 | Release Every Burden | Slow body scan under His care | 40 |
| `ambient-track` | ambient-track.mp3 | Abide With Me | Gentle stillness in His peace | 10 |
| `yoga-nidra` | yoga-nidra.mp3 | Rest in His Presence | Deep body rest for a quiet night with Him | 20 |

---

## Emotion → tracks (exclusive)

| Emotion | Tracks |
|---------|--------|
| anxious | shanti |
| fearful | transforming-emotions |
| sad | contentment, laugh-sing-1 |
| lonely | aura |
| hopeful | sun |
| overwhelmed | panchakosha, tick-tick |
| peaceful | space, ambient-track |
| grateful | happy, laugh-sing-2 |
| cant_sleep | bamboo-flute, yoga-nidra |

**Rule:** A track never appears under two emotions.

### Meditation ID pattern

```
med-{emotion}-{track}
```

Example: `med-anxious-shanti`, `med-cant_sleep-yoga-nidra`

### Meditation object shape

```json
{
  "id": "med-anxious-shanti",
  "emotion": "anxious",
  "track": "shanti",
  "title": "Cast Your Cares",
  "subtitle": "Release worry into the Father’s hands",
  "duration_min": 50,
  "cover_file": "shanti.jpg",
  "cover": "https://…/meditations/covers/shanti.jpg",
  "scripture": "1 Peter 5:7",
  "verse": "Cast all your anxiety on him because he cares for you.",
  "audio_url": "https://…/meditations/audio/shanti.m4a",
  "premium": false
}
```

---

## Prayers

### Categories

| id | Label | Cover track |
|----|-------|-------------|
| morning | Morning | sun |
| evening | Evening | ambient-track |
| anxiety | Anxiety | shanti |
| gratitude | Gratitude | happy |
| healing | Healing | contentment |

### Prayer seeds

| id | category | title | premium |
|----|----------|-------|---------|
| prayer-morning-1 | morning | Morning Surrender | false |
| prayer-morning-2 | morning | New Mercies | false |
| prayer-evening-1 | evening | Evening Rest | false |
| prayer-anxiety-1 | anxiety | Peace in the Storm | false |
| prayer-anxiety-2 | anxiety | Release Worry | false |
| prayer-gratitude-1 | gratitude | Overflowing Thanks | false |
| prayer-healing-1 | healing | Healing Touch | false |
| prayer-healing-2 | healing | Wholeness in Christ | false |

Bodies are short first-person prayers ending in Amen (see seed implementation for full text).

---

## Devotionals

Rotate by day-of-year or server “today” selection.

| id | reference | theme |
|----|-----------|-------|
| dev-1 | John 14:27 | Christ’s peace in the storm |
| dev-2 | Psalm 23:1-3 | Shepherd leads to quiet waters |
| dev-3 | Philippians 4:6 | Anxiety → prayer + thanksgiving |

Each has: `verse`, `reference`, `reflection` (2–3 sentences).

---

## SOS rotating verses (suggested set)

Use emotion scriptures plus:

- Philippians 4:6–7  
- Psalm 46:10  
- John 14:27  
- Isaiah 41:10  
- 1 Peter 5:7  

---

## Content policy

- Titles are Christ-centered even if source audio stems are instrumental  
- No medical claims in session titles  
- Premium flags are policy: preview mode may set all `premium: false`  
- Adding content: assign one emotion, unique track id, unique cover, scripture pair  
