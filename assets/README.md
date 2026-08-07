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

Animated mascot GIFs are **not** stored in git. They live on the same media bucket:

`…/onboarding/grace/<expression>.gif`

Client: `frontend/src/features/onboarding/mascot/graceAssets.ts`.  
PNG stills remain under `frontend/assets/images/onboarding/` as offline fallbacks.