# Grace onboarding assets

Grace is ChristCalm's soft 3D companion. Production GIF loops are bundled under
`grace/` so onboarding starts instantly, works offline, and never swaps a static
pose for an animated one.

## Character lock

- Cream/white fluffy bunny, soft 3D / Pixar-adjacent
- Large sparkly blue eyes, pink nose, rosy cheeks
- Knitted lavender scarf with a gold cross pendant
- Clean silhouette on a transparent plate
- Warm key light and soft rim for both light and dark themes

## Runtime assets

- All animation files use a 300 × 169 canvas.
- `graceAssets.ts` maps every expression with a static `require` for Metro.
- `GraceActor` renders the native aspect ratio with `expo-image`.
- Reduce Motion pauses the same local GIF on its first frame.
- The current bundled set is approximately 8.5 MB total.

## Updating Grace

1. Start from an approved Grace asset so the character remains consistent.
2. Export a short looping GIF at 300 × 169 and compress it for mobile.
3. Replace the matching file under `grace/<expression>.gif`.
4. Confirm all expressions typecheck and test normal and Reduce Motion playback.

Do not add a separate PNG placeholder. A different placeholder pose recreates
the visible flash this local animation pipeline is designed to avoid.
