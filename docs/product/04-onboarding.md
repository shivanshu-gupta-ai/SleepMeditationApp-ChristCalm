# Onboarding

**Canonical design:** [Onboarding-Design-Spec.md](./Onboarding-Design-Spec.md) (v3.1)  
**Implementation:** `frontend/src/features/onboarding/` · route `app/onboarding.tsx`

## Goal

High-converting first-run experience: personalization → insight → loss aversion → hope → commitment → escalating paywalls → app orientation. Grace is the emotional companion throughout.

## Architecture

```
app/onboarding.tsx                    → thin Expo Router entry
src/features/onboarding/
  OnboardingNavigator.tsx             → layout shell + CTA footer
  OnboardingContext.tsx               → shared draft, patch/toggle, Next/Back, canProceed
  sequence.ts                         → 27 screens (0–26), CTAs, paywall rules
  copy.ts                             → design-spec titles + option catalogs
  types.ts                            → route ids, Grace expressions
  components/
    ProgressBar.tsx                   → continuous flow progress
    OnboardingStepLayout.tsx          → shell (back, progress, footer CTA)
    GraceCompanion / Option / Question
  screens/                            → one component per design screen
```

**Navigation model:** single route `/onboarding` with an internal step index.  
**State:** `OnboardingProvider` + `useOnboarding()` — all answers live in one draft, persisted to AsyncStorage `cc_onboarding_draft`.  
**Exit:** last CTA → `markOnboardingComplete` → `/(auth)/sign-up`.

## Screen sequence (0–26)

| # | id | Label | Type |
|---|-----|-------|------|
| 0 | `splash` | Splash | static |
| 1 | `welcome` | Welcome + Scripture | hook |
| 2–4 | `benefit1`…`benefit3` | Benefits | value |
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
| 26 | `howAppWorks` | How the app works | education → Home |

Copy, options, timers, and Grace expression map: **see Onboarding-Design-Spec.md** (source of truth).

## Progress

- `ProgressBar` spans the **entire** flow (`(step + 1) / 27`).
- Splash hides the bar; calculating / some paywalls hide **back**.
- Paywall ladder: after leaving full price, back does **not** return to an earlier offer tier (`previousStepIndex` in `sequence.ts`).

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
  dailyLoad: number | null;       // 0–10
  profileType: string | null;     // derived
  commitmentAccepted: boolean;
  commitmentDate: string | null;
  firstPracticesDone: string[];
  highestPaywallSeen: number | null;
}
```

Synced fields after auth: `POST /auth/onboarding` (`draftToApiPayload`).

## Timers (paywalls)

| Offer | Duration | Storage key (planned) |
|-------|----------|------------------------|
| Full price | 12 min | `cc_paywall_full_expiry` |
| 50% off | 5 min | `cc_paywall_50_expiry` |
| 80% off | 3 min | `cc_paywall_80_expiry` |

Persist expiry timestamps in AsyncStorage (spec §4 / §8). Not implemented in skeleton.

## Implementation status

| Layer | Status |
|-------|--------|
| Sequence + navigator + ProgressBar | Done |
| OnboardingContext (shared answers) | Done |
| Screens 0–5 UI | Done |
| Screens 6–10 personalization questions | Done |
| Screens 11–15 (facts → profile reveal) | Done |
| Screens 16–19 (lifetime loss → reclaim) | Done |
| Screens 20–22 (proof · commitment · stats) | Done |
| Screens 23–25 escalating paywalls + timers | Done (RevenueCat purchase) |
| Screen 26 How the App Works | Skeleton / pending full UI |
| Scarcity timers + RevenueCat on paywalls | Pending |
| Profile derivation math | Pending |

## Principles (product)

- Copy: headline + at most one short line; Grace is the visual focus (`GraceMoodImage`).  
- Motion: fade + gentle slide (250–350ms); subtle pulse only on final timer.  
- Soft paywall after first practice on Home remains a **secondary** trigger; in-flow paywalls are primary conversion.  
