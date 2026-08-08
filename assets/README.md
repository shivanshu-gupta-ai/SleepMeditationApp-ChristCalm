# Assets (content media)

Canonical source for meditation media. Runtime bundle copies live under `frontend/assets/`.

```
assets/
└── meditations/
    ├── covers/   # One unique cover per track (<track>.jpg)
    └── audio/    # Source audio (hosted on S3 for playback)
```

## Covers

1. Add or replace `meditations/covers/<track>.jpg` (track keys match `backend/seed_data.py`).
2. Sync into Expo:

```bash
./scripts/sync-meditation-covers.sh
# or: cp assets/meditations/covers/*.jpg frontend/assets/meditations/covers/
```

3. Restart Expo with cache clear: `cd frontend && npx expo start --clear`

## Audio

Source files live in `meditations/audio/`. Production playback uses S3:

`MEDIA_BASE_URL` → `…/meditations/audio/<file>`

Upload after adding files:

```bash
aws s3 sync assets/meditations/audio/ \
  s3://christcalm-preview-media-<account>/meditations/audio/ \
  --exclude 'README.md' --exclude '.gitkeep'
```

See `assets/meditations/audio/README.md` and `assets/meditations/covers/README.md`.

## Onboarding Grace GIFs

The 21 animated mascot GIFs are committed and bundled under:

`frontend/assets/images/onboarding/grace/<expression>.gif`

The static Metro map is `frontend/src/features/onboarding/mascot/graceAssets.ts`. Every asset uses a 300×169 canvas and is available offline. The runtime has no remote URL or PNG loading placeholder, which prevents a still-image flash before animation begins.
