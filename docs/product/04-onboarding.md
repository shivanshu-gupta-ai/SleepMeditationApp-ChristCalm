# Onboarding

**Canonical design:** [Onboarding-Design-Spec.md](./Onboarding-Design-Spec.md) (v3.1)  
**Implementation:** `frontend/src/features/onboarding/` · route `app/onboarding.tsx`

## Goal

High-converting first-run experience: personalization → insight → loss aversion → hope → commitment → escalating paywalls → app orientation. Grace is the emotional companion throughout.

## Architecture

```
app/onboarding.tsx                    → thin Expo Router entry
src/features/onboarding/
  OnboardingNavigator.tsx             → layout shell + CTA footer + intro swipe
  OnboardingContext.tsx               → shared draft, patch/toggle, Next/Back, canProceed
  sequence.ts                         → 27 screens (0–26), CTAs, paywall ladder rules
  copy.ts                             → titles, option catalogs, paywall marketing copy
  types.ts                            → route ids, Grace expressions
  deriveProfile.ts                    → spiritual profile from answers
  lifetimeStats.ts                    → years-lost / reclaim math
  paywallConfig.ts                    → timer keys + tier config
  mascot/                             → GraceActor, motion profiles, expression map
  components/
    ProgressBar.tsx                   → continuous flow progress
    OnboardingStepLayout.tsx          → shell (back, progress, footer CTA)
    GraceMoodImage / OnboardingGrace  → thin wrappers over GraceActor
    IntroVisual / IntroHeroSlide      → welcome + benefit carousel visuals
    IntensityMascot / YearDotGrid
    EscalatingPaywall / ScarcityTimer
    OnboardingOption / OnboardingQuestion
  screens/                            → one component per design screen (all 27)
```

**Navigation model:** single route `/onboarding` with an internal step index.  
**State:** `OnboardingProvider` + `useOnboarding()` — draft in AsyncStorage `cc_onboarding_draft`.  
**Exit:** last CTA (`howAppWorks`) → `markOnboardingComplete` → **`/(auth)/sign-in`** (create-account mode available). Welcome secondary “Already have an account?” also completes onboarding and opens sign-in.

## Screen sequence (0–26)

| # | id | Label | Type |
|---|-----|-------|------|
| 0 | `splash` | Splash | static |
| 1 | `welcome` | Welcome + Scripture | hook |
| 2–4 | `benefit1`…`benefit3` | Benefits (swipeable intro with welcome) | value |
| 5 | `name` | Name | input |
| 6 | `heart` | Heart feelings | multi-select |
| 7 | `faith` | Faith journey | single |
| 8 | `concerns` | What weighs on heart | multi-select |
| 9 | `timing` | When need peace | single |
| 10 | `support` | Desired support | multi-select |
| 11 | `didYouKnow` | Did You Know | education |
| 12 | `age` | Age | single |
| 13 | `intensity` | Intensity slider | slider |
| 14 | `calculating` | Calculating insights | loading |
| 15 | `profileReveal` | Spiritual profile | result |
| 16 | `lifetimeLoss` | Lifetime loss | shock |
| 17–18 | `visualRemaining` / `visualLost` | Dot-grid visuals | visualization |
| 19 | `yearsReclaim` | Years reclaimed | hope |
| 20 | `socialProof` | Social proof | trust |
| 21 | `commitment` | Commitment ritual | ritual |
| 22 | `statsPreview` | Before / after | motivation |
| 23–25 | `paywallFull` / `paywall50` / `paywall80` | Escalating paywalls | monetization |
| 26 | `howAppWorks` | How the app works | education → **auth** |

Copy, options, timers, and Grace expression map: **see Onboarding-Design-Spec.md** and live `copy.ts` / `expressionMap.ts`.

## Progress

- `ProgressBar` spans the flow (`(step + 1) / 27`).
- Splash and finale (`howAppWorks`) hide the bar; some paywall tiers hide **back**.
- Paywall ladder: after leaving full price, back does **not** return to an earlier offer tier (`previousStepIndex` in `sequence.ts` — 50%/80% jump to `statsPreview`).

## Data model (client)

```ts
interface OnboardingDraft {
  name: string;
  emotionalState: string[];
  faithStage: string | null;
  concerns: string[];
  preferredTime: string | null;
  desiredSupport: string[];
  ageRange: string | null;
  dailyLoad: number | null;       // 0–10 intensity
  profileType: string | null;     // derived
  commitmentAccepted: boolean;
  commitmentDate: string | null;
  firstPracticesDone: string[];
  highestPaywallSeen: number | null;
}
```

Synced after auth: `POST /api/auth/onboarding` (`draftToApiPayload`).

## Timers (paywalls) — implemented

| Offer | Duration | Storage key |
|-------|----------|-------------|
| Full price | 12 min | `cc_paywall_full_expiry` |
| 50% off | 5 min | `cc_paywall_50_expiry` |
| 80% off | 3 min | `cc_paywall_80_expiry` |

`ScarcityTimer` persists expiry timestamps in AsyncStorage; `EscalatingPaywall` purchases via RevenueCat default offering.

## Implementation status

| Layer | Status |
|-------|--------|
| Sequence + navigator + ProgressBar | **Done** |
| OnboardingContext (shared answers) | **Done** |
| All screens 0–26 UI | **Done** |
| GraceActor reactions + bundled mood animations (GIF) | **Done** |
| Intro carousel (welcome + benefits) | **Done** |
| Profile derivation (`deriveProfile`) | **Done** |
| Lifetime loss / reclaim math | **Done** |
| Escalating paywalls + scarcity timers | **Done** |
| RevenueCat purchase on paywall tiers | **Done** |
| Exit → sign-in | **Done** |

## Principles (product)

- Copy: headline + at most one short line; Grace is the visual focus (`GraceMoodImage` / `GraceActor`).  
- Motion: fade + gentle slide; respect reduce-motion.  
- Soft paywall after first practice on Home remains a **secondary** trigger; **in-flow paywalls are primary conversion**.  
- Theme after launch: **light default** (onboarding itself uses the shared theme).  
