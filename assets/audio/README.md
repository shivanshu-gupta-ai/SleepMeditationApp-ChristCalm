# General audio uploads

Drop source files here during production. They are gitignored (except this README).

Preferred layout for meditation tracks:

```
assets/meditations/audio/med-1.mp3
```

Upload to CDN/S3, set `MEDIA_BASE_URL` or update `audio_url` in `backend/seed_data.py`.
