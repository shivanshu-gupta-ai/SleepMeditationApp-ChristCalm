# Frontend

Expo Router (React Native) client for ChristCalm.

## Layout

```
frontend/
├── app/                      # Routes only (Expo file-based router)
│   ├── (auth)/               # Sign-in / sign-up / password / confirm
│   ├── (tabs)/               # Home · Meditate · Wisdom · Journey · Me
│   │                         # (+ journal, prayers hidden from tab bar)
│   ├── meditation/[id].tsx   # Player
│   ├── sos.tsx · paywall.tsx · onboarding.tsx · oauth.tsx
│   └── index.tsx             # Gate: onboarding → auth → RevenueCat → paywall/home
├── src/
│   ├── features/
│   │   ├── auth/             # Session, Cognito, Apple button
│   │   ├── subscriptions/    # RevenueCat + premium
│   │   ├── onboarding/       # Navigator + 27 screens + Grace mascot
│   │   └── stats/            # Journey tab
│   ├── components/ui/        # Shared design-system primitives
│   ├── context/              # Theme, Viewport, Connectivity
│   ├── api/                  # Backend HTTP client (incl. Wisdom stream)
│   ├── theme/                # Nest / Cooper tokens
│   ├── constants/            # Emotion icons, meditation covers
│   └── utils/                # Storage, analytics, focus mode, …
└── assets/                   # Bundled media (icons, covers, Grace)
```

## Run

```bash
# from repo root
./scripts/sync-env-from-github.sh   # or sync-env-from-aws.sh (owner)
cd frontend && npm install && npx expo start
```

Web preview: `npx expo start --web` → http://localhost:8081  
Or: `./scripts/preview.sh` from repo root.

## Product map (current)

| Surface | Notes |
|---------|--------|
| Onboarding | 27 steps; 21 bundled Grace GIFs; adaptive question layout; hard escalating paywalls; exit → sign-in |
| Auth | Email + Sign in with Apple |
| Access | Signed-in non-premium users are redirected to the RevenueCat paywall before tabs |
| Tabs | Home · Meditate · Wisdom · Journey · Me + Start Calm FAB |
| Journal | From Me / Home (hidden tab) |
| Prayers | UI deferred; API catalog still available |
| Theme | **Light default**; dark toggle on Me |
| Wisdom | Streaming chat + optional voice |
| Feedback | Me form persists private feedback; meditation completion supports 1–5 star ratings |

## Notes

- Prefer importing from `@/src/features/*` for domain code.
- Shared UI lives in `@/src/components/ui`.
- Meditation covers: edit `assets/meditations/covers/`, then `./scripts/sync-meditation-covers.sh`.
- Wisdom calls the API via `@/src/api/client` (no separate `features/ai` module).
