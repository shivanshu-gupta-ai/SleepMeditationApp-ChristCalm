# Assets (media hub)

Canonical place for **content media** you can replace by hand.

```
assets/
├── meditations/
│   ├── covers/          # Cover images med-1.jpg … med-10.jpg
│   └── audio/           # Optional local meditation audio files
├── audio/               # Legacy / general audio uploads (.gitkeep)
└── design-reference/    # Design research frames (not shipped in app)
```

## Meditation covers

1. Replace files in `meditations/covers/` keeping the same names (`med-1.jpg`, …).  
2. Copy into the Expo bundle:

```bash
cp assets/meditations/covers/*.jpg frontend/assets/meditations/covers/
```

3. Optional CDN: set `MEDIA_BASE_URL` on Lambda so API returns full HTTPS URLs  
   (`{MEDIA_BASE_URL}/meditations/covers/med-1.jpg`).

Details: [`meditations/covers/README.md`](meditations/covers/README.md)

## Audio

Place files under `audio/` or `meditations/audio/`, upload to S3/CloudFront, then set  
`audio_url` in `backend/seed_data.py` (or wire `MEDIA_BASE_URL` the same way).

## Design reference

`design-reference/video-frames/` — research screenshots only. Do not import into the app.
