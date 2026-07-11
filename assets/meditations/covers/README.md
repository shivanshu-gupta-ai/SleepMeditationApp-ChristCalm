# Meditation cover images

| File | Meditation id |
|------|----------------|
| `med-1.jpg` | Cast Your Cares |
| `med-2.jpg` | Be Still and Know |
| `med-3.jpg` | Fear Not |
| `med-4.jpg` | Comfort in Sorrow |
| `med-5.jpg` | Come to Me |
| `med-6.jpg` | Never Alone |
| `med-7.jpg` | A Thankful Heart |
| `med-8.jpg` | Joy of the Lord |
| `med-9.jpg` | Hope Anchors the Soul |
| `med-10.jpg` | Peace That Surpasses |

## Replace a cover

1. Drop a new JPG/PNG over the same filename (prefer JPG ~800px wide).  
2. Sync to the app bundle:

```bash
cp assets/meditations/covers/med-N.jpg frontend/assets/meditations/covers/
```

3. Restart Expo with cache clear if the image looks cached:  
   `npx expo start --clear`

The frontend loads **bundled** covers via `frontend/src/constants/meditation-covers.ts`.  
The API also exposes `cover_file` + optional remote `cover` when `MEDIA_BASE_URL` is set.
