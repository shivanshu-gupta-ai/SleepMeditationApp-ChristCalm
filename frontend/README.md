# Frontend

Expo Router (React Native) client for ChristCalm.

## Layout

```
frontend/
├── app/                      # Routes only (Expo file-based router)
│   ├── (auth)/               # Sign-in / sign-up / password
│   ├── (tabs)/               # Home, meditate, wisdom, journal, profile
│   ├── meditation/[id].tsx   # Player
│   ├── sos.tsx · paywall.tsx · onboarding.tsx
│   └── …
├── src/
│   ├── features/
│   │   ├── auth/             # Session, Cognito, social buttons
│   │   ├── subscriptions/    # RevenueCat + premium
│   │   └── onboarding/       # Navigator + 27 screens (design v3.1)
│   ├── components/ui/        # Shared design-system primitives
│   ├── context/              # Theme, Viewport
│   ├── api/                  # Backend HTTP client
│   ├── theme/                # Nest / Cooper tokens
│   ├── constants/            # Emotion icons, meditation covers
│   └── utils/                # Storage, analytics, focus mode, …
└── assets/                   # Bundled media (icons, covers, Grace)
```

## Run

```bash
# from repo root
./scripts/sync-env-from-aws.sh   # public Expo config
cd frontend && npx expo start --web --clear
# → http://localhost:8081
```

Or: `./scripts/preview.sh` from repo root.

## Notes

- Prefer importing from `@/src/features/*` for domain code.
- Shared UI lives in `@/src/components/ui`.
- Meditation covers: edit `assets/meditations/covers/`, then `./scripts/sync-meditation-covers.sh`.
- Wisdom / AI prayer screens call the API directly via `@/src/api/client` (no `features/ai` module).
