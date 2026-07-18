# Frontend features

Domain modules (prefer these imports over shared grab-bags).

| Feature | Import | Screens |
|---------|--------|---------|
| Auth | `@/src/features/auth` | `app/(auth)/*` |
| Subscriptions | `@/src/features/subscriptions` | `app/paywall.tsx` |
| Onboarding | `@/src/features/onboarding` | `app/onboarding.tsx` |

**Wisdom / AI prayer** live as routes (`app/(tabs)/wisdom.tsx`, `app/ai-prayer.tsx`) and use `@/src/api/client` + `backend/ai/`.

Shared UI: `@/src/components/ui` · Theme: `@/src/context/ThemeContext` · API: `@/src/api/client`.
