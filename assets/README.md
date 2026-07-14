# Assets (media hub)

Canonical place for **content and design media**.

```
assets/
├── meditations/
│   ├── covers/          # Cover images med-1.jpg … med-10.jpg (tracked)
│   └── audio/           # Optional local audio (gitignored)
├── audio/               # General audio uploads (gitignored)
├── app-design/          # Product design screenshots / mocks
└── design-reference/    # Local research only (gitignored frames)
```

## Meditation covers

1. Replace files in `meditations/covers/` (`med-1.jpg` …).
2. Copy into the Expo bundle:

```bash
cp assets/meditations/covers/*.jpg frontend/assets/meditations/covers/
```

3. Restart Expo: `cd frontend && npx expo start --clear`

Runtime app images live under `frontend/assets/`.
