# Grace onboarding assets

Soft 3D companion for ChristCalm. Produced with **Imagine** (build-time only), not at runtime.

## Character lock

- Cream/white fluffy bunny, soft 3D / Pixar-adjacent
- Large sparkly blue eyes, pink nose, rosy cheeks
- Knitted **lavender/purple scarf** with **gold cross** pendant and optional heart detail
- Clean silhouette on **transparent** plate (no solid black plate) for UI crop on app gradients
- Warm key light + soft rim so she reads on dark (Nest) and light (Cooper)

## Files

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

### Dual-frame animation (`grace-*-b.png`)

Second pose for soft A↔B crossfade in `GraceActor` (Imagine `image_edit` pose variants).  
Works offline without MP4. Prefer distinct poses; if missing, copy primary still to `*-b`.

### Video loops (optional)

`grace-anim/*.mp4` via Imagine `image_to_video` when the team allows video output.  
Wire requires in `GRACE_MOOD_VIDEOS`. Soft breathe / sway only — no gamey bounce.

## Regeneration

1. `image_edit` from an existing Grace PNG (never pure text-only for variants).
2. Brighten: clearer eyes, fur highlights, scarf saturation, gold cross.
3. Generate `*-b.png` pose variants for dual-frame loops.
4. Optionally `image_to_video` (6s, 480p) when available; map in `GRACE_MOOD_VIDEOS`.
5. Wire stills in `GRACE_MOOD_ASSETS` / `GRACE_MOOD_FRAME_B`.
