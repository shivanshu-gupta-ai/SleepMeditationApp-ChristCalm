# Grace onboarding assets

Soft 3D companion for ChristCalm. Stills are **bundled** for instant/offline display.
**Animated GIFs are not in the app bundle** — they load from the public media S3 bucket.

## Character lock

- Cream/white fluffy bunny, soft 3D / Pixar-adjacent
- Large sparkly blue eyes, pink nose, rosy cheeks
- Knitted **lavender/purple scarf** with **gold cross** pendant and optional heart detail
- Clean silhouette on **transparent** plate (no solid black plate) for UI crop on app gradients
- Warm key light + soft rim so she reads on dark (Nest) and light (Cooper)

## Bundled stills (PNG)

| Still | Expression |
|-------|------------|
| `grace-splash.png` | First impression |
| `grace-welcome.png` | Welcome / greeting |
| `grace-listening.png` | Attentive questions |
| `grace-thoughtful.png` | Reflection / calculating |
| `grace-heavy.png` | Weight / loss screens |
| `grace-hopeful.png` | Hope / reclaim |
| `grace-committed.png` | Commitment |
| `grace-peaceful.png` | Peace / finale |

These are wired as fallbacks / reduce-motion / offline in `graceAssets.ts`.

## Animated GIFs (S3, not git)

**Bucket:** `christcalm-preview-media-500696805306`  
**Prefix:** `onboarding/grace/<expression>.gif`  
**URL:** `https://christcalm-preview-media-500696805306.s3.us-east-1.amazonaws.com/onboarding/grace/<expression>.gif`

Optional override: `EXPO_PUBLIC_MEDIA_BASE_URL` (no trailing slash).

Client map: `frontend/src/features/onboarding/mascot/graceAssets.ts`  
Playback: `GraceActor` via `expo-image` with PNG `placeholder` and `onError` → PNG.

### Upload (after compressing)

Sources usually come from a collaborator branch (extract with `git archive`, never merge GIF binaries into main).

```bash
# Compress aggressively first (≈280–300px, lossy Gifsicle) then:
aws s3 sync ./canonical/ s3://christcalm-preview-media-500696805306/onboarding/grace/ \
  --cache-control "public,max-age=31536000,immutable" \
  --content-type "image/gif"
```

After overwrite, bump `GRACE_GIF_VERSION` in `graceAssets.ts` so clients skip stale cache.

Bucket policy must allow `s3:GetObject` on `onboarding/grace/*` (same pattern as `meditations/audio/*`).

Do **not** commit raw multi‑MB GIFs under `frontend/animation/` or `assets/`.
## Regeneration

1. `image_edit` from an existing Grace PNG (never pure text-only for variants).
2. Export GIF loops, compress for mobile (target ~0.5–1.5 MB each).
3. Upload to S3 with the expression filename (`welcome.gif`, `preparing.gif`, …).
4. Keep PNG stills in this folder as fallbacks.
