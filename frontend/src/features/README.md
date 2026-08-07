# Frontend features

Domain modules (prefer these imports over shared grab-bags).

| Feature | Import | Screens |
|---------|--------|---------|
| Auth | `@/src/features/auth` | `app/(auth)/*` |
| Subscriptions | `@/src/features/subscriptions` | `app/paywall.tsx` |
| Onboarding | `@/src/features/onboarding` | `app/onboarding.tsx` → `OnboardingNavigator` (27 screens) |
| Stats | `@/src/features/stats` | `app/(tabs)/stats.tsx` |

**Wisdom** lives at `app/(tabs)/wisdom.tsx` and uses `@/src/api/client` + `backend/ai/`.

Shared UI: `@/src/components/ui` · Theme: `@/src/context/ThemeContext` · API: `@/src/api/client`.
