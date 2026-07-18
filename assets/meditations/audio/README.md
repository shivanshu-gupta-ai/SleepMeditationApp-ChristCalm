# Meditation audio

Source files for sessions. **App titles** are Christian names in `backend/seed_data.py` (file slugs are internal).

| File | App title | Emotion |
|------|-----------|---------|
| `shanti.m4a` | Cast Your Cares | Anxious |
| `transforming-emotions.mp3` | Fear Not | Fearful |
| `contentment.mp3` | Comfort in Sorrow | Sad |
| `laugh-sing-1.mp3` | Make a Joyful Noise | Sad |
| `aura.mp3` | Never Alone | Lonely |
| `sun.mp3` | Morning Mercies | Hopeful |
| `panchakosha.mp3` | Come to Me and Rest | Drained |
| `tick-tick.mp3` | Release Every Burden | Drained |
| `space.mp3` | Be Still and Know | Peaceful |
| `ambient-track.mp3` | Abide With Me | Peaceful |
| `happy.mp3` | Joy of the Lord | Grateful |
| `laugh-sing-2.mp3` | Songs of Thanksgiving | Grateful |
| `bamboo-flute.mp3` | Lie Down in Peace | Can't sleep |
| `yoga-nidra.mp3` | Rest in His Presence | Can't sleep |

## Hosting

Public S3 (example):

`https://christcalm-preview-media-<account>.s3.us-east-1.amazonaws.com/meditations/audio/`

Lambda `MEDIA_BASE_URL` must point at that base. Each track is exclusive to one emotion (see `_EMOTION_TRACKS` in `seed_data.py`).
