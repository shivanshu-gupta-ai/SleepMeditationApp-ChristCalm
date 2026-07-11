# Static assets

## `audio/`

Drop meditation audio files here before upload to your CDN (S3 + CloudFront recommended).

Suggested naming:

```
audio/
  med-1-cast-your-cares.mp3
  med-2-be-still.mp3
  ...
```

After upload, set `audio_url` in `backend/seed_data.py` to the public URL. Until then, seed data uses temporary Pixabay CDN links.

Supported formats: `.mp3`, `.m4a`, `.wav`