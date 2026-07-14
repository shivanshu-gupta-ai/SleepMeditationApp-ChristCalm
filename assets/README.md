# Assets (media hub)

Canonical place for **content and design media**.

```
assets/
├── meditations/
│   ├── covers/          # Cover images med-1.jpg … med-10.jpg
│   └── audio/           # Optional local meditation audio
├── audio/               # General audio uploads
├── design-reference/    # Research frames (not shipped)
└── app-design/          # Product design screenshots / mocks
```

## Meditation covers

1. Replace files in `meditations/covers/` (`med-1.jpg` …).
2. Copy into the Expo bundle:

```bash
cp assets/meditations/covers/*.jpg frontend/assets/meditations/covers/
```

3. Restart Expo: `cd frontend && npx expo start --clear`

## App design

`app-design/` holds visual product references. Runtime images for Expo live under `frontend/assets/`.
