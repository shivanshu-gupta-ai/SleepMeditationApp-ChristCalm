# Meditation audio (optional local originals)

Put source audio files here (e.g. `med-1.mp3`).  

They are **not** auto-served by Lambda. Upload to S3/CloudFront and set `audio_url` in  
`backend/seed_data.py`, or use `MEDIA_BASE_URL` + consistent paths.

See also `assets/audio/` for general uploads.
