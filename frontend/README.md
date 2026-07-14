# Frontend

Expo Router (React Native) client for ChristCalm.

## Layout

```
frontend/
├── app/                      # Routes only (Expo file-based router)
│   ├── (auth)/               # Sign-in / sign-up / password
│   ├── (tabs)/               # Main tabs (home, wisdom, …)
│   └── …
├── src/
│   ├── features/
│   │   ├── auth/             # Session, Cognito, social buttons
│   │   ├── ai/               # Wisdom / AI prayer feature surface
│   │   ├── subscriptions/    # RevenueCat + premium
│   │   └── onboarding/       # Onboarding steps UI
│   ├── components/ui/        # Shared design-system primitives
│   ├── context/              # Theme, Viewport
│   ├── api/                  # Backend HTTP client
│   ├── theme/                # Nest / Cooper tokens
│   └── utils/
└── assets/                   # Bundled media (icons, covers, Grace)
```

## Run

```bash
# from repo root
./scripts/setup-config.sh
./scripts/sync-env-from-aws.sh   # or set EXPO_PUBLIC_BACKEND_URL
cd frontend && npx expo start --web --clear
```

## Notes

- Prefer importing from `@/src/features/*` for domain code.
- Shared UI lives in `@/src/components/ui`.
- Content covers: edit repo `assets/meditations/covers/`, then copy into `frontend/assets/meditations/covers/`.
