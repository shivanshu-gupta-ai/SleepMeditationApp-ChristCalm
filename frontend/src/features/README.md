# Frontend features

Domain modules (prefer these imports over shared grab-bags).

| Feature | Import | Screens |
|---------|--------|---------|
| Auth | `@/src/features/auth` | `app/(auth)/*` |
| AI / Wisdom | `@/src/features/ai` | `app/(tabs)/wisdom.tsx`, `app/ai-prayer.tsx` |
| Subscriptions | `@/src/features/subscriptions` | `app/paywall.tsx` |
| Onboarding | `@/src/features/onboarding` | `app/onboarding.tsx` |

Shared UI: `@/src/components/ui` · Theme: `@/src/context/ThemeContext` · API: `@/src/api/client`.
