# ChristCalm Onboarding — Brainrot-inspired redesign

**Source video:** `brainrot.mp4` (repo root)  
**Frames:** `assets/design-reference/brainrot-frames/tick_001.png` … `tick_032.png`  
**Analysis method:** `ffprobe` + `ffmpeg -vf fps=1/2` (every 2s)

---

## 1. Video analysis summary

### Metadata (ffprobe)

| Property | Value |
|----------|--------|
| File | `brainrot.mp4` |
| Duration | **~64.8 s** |
| Resolution | **1080 × 1920** (9:16) |
| Video codec | H.264 (High), ~30 fps |
| Audio | AAC LC, 48 kHz stereo |
| Approx. size | ~13.5 MB |

### Overall onboarding flow (Brainrot)

| Phase | ~Time | Screens | Purpose |
|-------|-------|---------|---------|
| **A. Hook** | 0–22s | Hero with floating “product demo” phone | Immediate value + problem statement |
| **B. Interactive demo** | ~22–30s | Mascot + slider “See for yourself” | User agency before signup |
| **C. Processing beat** | ~30–34s | Minimal “Analyzing…” + progress bar | Anticipation / magic |
| **D. Personalized insight** | ~34–40s | Profile result + optional rate modal | Emotional payoff + social proof |
| **E. Impact story** | ~40–50s | Big stat + visualization + “what you have left” | Urgency without shame |
| **F. Education** | ~48–52s | Pill statements (not willpower) | Reframe solution |
| **G. Commitment ritual** | ~54–58s | Gesture (“tap 5× to break”) | Embodied commitment |
| **H. Paywall / plan** | ~58–64s | Soft pitch + plans | Monetization after emotion |

**Rough step count in product:** ~6–8 distinct UX beats (not 12 form steps).

### Frame-by-frame highlights

**tick_001 (~0s) — Hero / problem hook**  
- Cream full-bleed background; large floating phone mock (soft drop shadow).  
- Phone shows TikTok-style feed (scroll culture).  
- Bold black display type: “Stop scrolling. Save your brain.”  
- Full-width coral pill CTA “Get started”; legal line under (TOS / Privacy in blue links).  
- Hierarchy: visual demo → 2-line headline → CTA → micro legal.  
- Premium: device-in-device, motion of feed, huge negative space.

**tick_003–008 (~4–14s) — Same shell, rotating phone content**  
- Same layout; inner phone cycles: sad brain meter “80 / 100”, app health dashboard (score 88, screen time), home screen with Brainrot widget.  
- Premium technique: **one fixed template, animated product story** (user never leaves first screen until CTA).

**tick_012 (~22s) — Interactive demo**  
- Thin top progress (coral fill) + back chevron.  
- Huge centered mascot.  
- Headline “See for yourself.”  
- White floating card with labeled slider Healthy → Full rot.  
- Coral “Continue.”  
- Premium: tactile control teaches the product metaphor before account.

**tick_016 (~30s) — Processing**  
- Near-empty cream field.  
- Centered muted copy “Analyzing your habits…” + thin coral progress.  
- Premium: intentional “empty” as magic moment; reduces cognitive load.

**tick_018 (~34s) — Insight + social proof**  
- Soft profile result “The Burned-Out Mind.”  
- System-style rate modal (stars) over content.  
- Premium: personalization label + iOS-native review pattern.

**tick_020–022 (~38–42s) — Impact**  
- Dramatic red number “25 years” in body sentence.  
- Melting brain illustration; tiny footnote.  
- Dot-grid life visualization (grey vs red).  
- Premium: one shocking number + legend; spare chrome.

**tick_024 (~46s) — Education**  
- Progress near complete.  
- Bold thesis headline.  
- 3 tall pill cards (statements, not form fields).  
- Premium: education as calm list, not quiz.

**tick_028 (~54s) — Ritual**  
- Soft headline + gray sub.  
- Center illustration (handcuffed phone).  
- Gesture instruction “tap 5× to break the chain.”  
- Premium: **interaction as commitment**, not checkbox.

**tick_031 (~60s) — Offer**  
- Sparkle mascot, benefit copy, Day 0 card.  
- Plan picker with accent color shift to purple for commerce.  
- Premium: sell after story; hierarchy benefit → plan → CTA.

### Key premium techniques worth copying

1. **Phone-in-phone product story** on first screen (not a form).  
2. **Fixed CTA bar** (full-width soft pill) on almost every step.  
3. **Cream canvas + one accent** (coral) + black type — high calm contrast.  
4. **Huge display headlines** (2 lines max), short support text.  
5. **Mascot as emotional narrator** (moods change with story).  
6. **One interactive toy** early (slider / gesture).  
7. **Processing interstitial** (builds anticipation).  
8. **Personalized “profile” result** before asking for money/account.  
9. **Thin continuous progress** (not 12 dots).  
10. **Commitment ritual** (embodied action).  
11. **Generous whitespace**; few elements per screen.  
12. **Secondary legal / footnote** never competes with CTA.

---

## 2. Recommended ChristCalm flow (5 steps + handoff)

| # | Name | Purpose |
|---|------|---------|
| 1 | **Welcome / Promise** | Hook with Grace + Scripture; product story floating in “phone” |
| 2 | **See for yourself** | Interactive emotion slider / multi-feel (agency) |
| 3 | **Your quiet profile** | Processing → personalized faith/heart insight |
| 4 | **Why this works** | 3 education pills + optional light multi-select concern |
| 5 | **Covenant & enter** | Soft commitment + clear handoff to sign-up / home |

**Total: 5 screens** (vs current ~12). Friction-heavy form steps collapse into 2 interactive + 1 insight.

---

## 3. Detailed screen descriptions

### Screen 1 — Welcome / Promise  
**Headline:** `Peace, not more noise.`  
**Sub:** `Scripture-guided calm for anxious, weary, and honest hearts.`  
**Visual:** Cream (light) or deep ink (dark) canvas. Center: floating phone mock showing Grace + a short meditation card (or animated Grace loop). Below: bold 2-line headline.  
**Copy accent:** John 14:27 as small primary-colored ref under hero.  
**Primary CTA:** `Begin with Grace`  
**Secondary:** `I already have an account` (text link)  
**Motion:** Phone mock gentle float; Grace idle loop; CTA press scale 0.97.  
**Emotion:** Immediate spiritual rest, not productivity guilt.

### Screen 2 — See for yourself  
**Headline:** `How is your heart right now?`  
**Visual:** Large Grace (mood reacts). Segmented or multi chips (max 5): Weary · Anxious · Heavy · Hopeful · Peaceful. Or a single “calm ↔ unrest” slider that changes Grace expression.  
**Progress:** thin top bar ~20%. Back chevron.  
**Primary CTA:** `Continue` (enabled after ≥1 selection)  
**Motion:** Grace morph/expression on selection; chips spring.  
**Emotion:** Honesty without judgment; user feels seen.

### Screen 3 — Processing → Profile  
**3a Processing (auto 2–3s):**  
`Listening with you…` + coral/sage progress bar. Empty center.  

**3b Insight:**  
**Overline:** `Grace senses`  
**Headline:** e.g. `A weary heart seeking rest` (from selections)  
**Body:** 2 short sentences of biblical hope (no lecture).  
**Card:** “What ChristCalm offers you” — 3 bullets max (meditation, SOS, Wisdom).  
**CTA:** `Show me the path`  
**Motion:** Fade from 3a → 3b; card slide-up.  
**Emotion:** Personalization = care.

### Screen 4 — Why this works  
**Headline:** `You don’t need more willpower.`  
**Sub:** `You need a quieter way back to Him.`  
**Three soft pills (tappable for emphasis, not required):**  
1. Scripture meets the feeling you name  
2. Short sessions when panic rises  
3. Wisdom that stays heart-level, not homework  
**Optional multi (max 5 concerns)** only if space; else skip to next.  
**CTA:** `I’m ready`  
**Motion:** Pills stagger-in.  
**Emotion:** Relief + dignity.

### Screen 5 — Covenant & enter  
**Headline:** `A quiet commitment`  
**Sub:** `Between you and Jesus — one step, one breath.`  
**Visual:** Grace + short covenant text in a soft card (current covenant copy, tightened).  
**Ritual (Brainrot-inspired, faith-aligned):** “Hold the heart for a moment” or “Tap Grace 3× to seal this step” (gentle, not gimmicky).  
**Primary CTA:** `Enter ChristCalm` → sign-up / home if already signed in  
**Secondary:** `I’ll explore first` (soft path still completes onboarding flag)  
**Motion:** Soft scale on ritual; CTA glow.  
**Emotion:** Sacred resolve without pressure.

---

## 4. Transition & handoff

1. Final CTA sets `onboardingComplete` + saves draft (hearts, optional concerns).  
2. Prefer: **sign-up / sign-in** if no token; else `/(tabs)/home`.  
3. **Quick start on Home:** banner “Continue with Grace” → meditate filtered by first heart selection, or open SOS if “anxious/weary” dominant.  
4. No hard paywall inside onboarding for ChristCalm v1 (Brainrot sells late; ChristCalm can soft-gate premium later). Optional “ChristCalm+” teaser card on home after day 1.

---

## 5. Premium design system (onboarding)

### Color (calm dark + warm light)
| Token | Light | Dark |
|-------|-------|------|
| Canvas | `#F7F4ED` warm cream | `#0B0E13` ink |
| Surface | white / soft glass | `#16181D` |
| Text | near-black | off-white |
| Accent CTA | sage/teal primary OR warm clay | same, slightly brighter |
| Scripture / overline | primary green | soft mint/gold |
| Danger/urgency | avoid Brainrot red for faith; use soft clay only for rare emphasis |

### Typography
- Display headline: 28–32 / Bold / tight tracking / max 2 lines  
- Body: 15–16 / Regular / line-height 1.4  
- Footnote: 12–13 muted  
- Overline: 12–13 Medium, primary color  

### Spacing & radius
- Screen horizontal padding: 20–24  
- CTA bottom inset: safe area + 12  
- Cards: radius 20–24, padding 16–20  
- Pill buttons: full radius, height 52–56  

### Animation
- Screen enter: 220–280ms fade + 8–12px rise  
- Progress bar: continuous, not per-dot  
- Mascot: idle bob always; expression change on choice  
- Never more than one major motion at a time  

### Components to standardize
- `OnboardingHeroPhone` (floating device mock)  
- `GraceCompanion` (already exists)  
- `SoftProgress` (single track)  
- `PillCTA`  
- `InsightCard`  
- `StatementPill` (education)  
- `RitualHold` (commitment gesture)

---

## Implementation note (vs current app)

Current ChristCalm onboarding is **~12 form steps**. Brainrot quality comes from **fewer, larger beats**. Recommended migration:

1. Ship **5-step flow** above as primary path.  
2. Keep detailed concerns/faith multi only if insight quality needs it — never more than 5 chips per screen.  
3. Defer account creation until after insight (step 3→5) when possible.

---

*Frames extracted 2026-07-12 via ffmpeg. Design tailored for USA Christian meditation audience — calm, premium, undiluted Scripture, never cheesy.*
