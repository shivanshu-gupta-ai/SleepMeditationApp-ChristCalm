# User flows & screens

## Information architecture

### Primary navigation (current app)

Floating bottom tab bar (pill) + center **FAB** (“Start calm”).

| Slot | Label | Route | Job |
|------|-------|-------|-----|
| 1 | **Home** | `(tabs)/home` | Begin calm today |
| 2 | **Meditate** | `(tabs)/meditate` | Pick & play a session |
| 3 | **FAB** | — | Sheet: How I feel · SOS · Wisdom |
| 4 | **Wisdom** | `(tabs)/wisdom` | Share a heart concern |
| 5 | **Journey** | `(tabs)/stats` | Practice recognition & progress |
| 6 | **Me** | `(tabs)/profile` | Account, plan, theme, deep links |

**Hidden tab routes** (`href: null`):

| Route | Access |
|-------|--------|
| **Journal** | Me → Journal · Home quick path · Share with Wisdom |
| **Prayers** | **Deferred** — screen file exists but not in nav; catalog API still live |

### Stack / modal routes (not tabs)

| Route | Purpose |
|-------|---------|
| `/onboarding` | First-run wizard (27 steps) |
| `/(auth)/*` | Sign-in (unified sign-up mode), confirm, forgot, reset |
| `/oauth` | Apple / Hosted UI return |
| `/meditation/:id` | Immersive player |
| `/sos` | Panic relief (modal) |
| `/paywall` | In-app subscription (modal) |

---

## Critical flows

### A. First launch → first calm

```
Install → Onboarding (27 steps, incl. escalating paywalls)
  → Auth (email or Apple) → RevenueCat entitlement check
  → Non-premium: hard /paywall · Premium: Home
  → Tap emotion → Meditate filtered → Open session → Complete
  → Rating/progress → Journey stats updated
```

### B. Panic / hard moment

```
Any screen → SOS (Home row / FAB / deep link)
  → 4-7-8 breathing + verses → Exit when regulated
```

### C. Wisdom concern

```
Wisdom tab (or FAB) → Type or mic → Guardrails → RAG + LLM
  → Reply with Scripture + gentle next step → History saved
```

### D. Return user

```
Open → Home greeting + streak → Today’s path or emotion → Practice
```

### E. Subscribe

```
Onboarding ladder or post-auth hard paywall
  → Choose an offered monthly/annual tier → Store purchase → Entitlement sync
  → Premium badge / unlock gates
```

The post-practice soft sheet remains implemented as a secondary resurfacing trigger for preview/limited-access configurations; it is not the production route around the hard gate.

---

## Screen specifications

### 1. Home — “Begin calm”

**One job:** Start calm today.

```
[ safe area ]
Greeting overline + Name                    [Premium badge]
────────────────────────────────────────────
TODAY’S PATH card
  icon | continue / suggested session
  streak · chevron
────────────────────────────────────────────
How are you feeling?
  emotion grid/chips (icon + label)
────────────────────────────────────────────
More support
  SOS row · Wisdom row
────────────────────────────────────────────
Today’s word (scripture card)
────────────────────────────────────────────
Optional: First-steps checklist (new users)
────────────────────────────────────────────
[ floating tab bar + FAB ]
```

**Interactions**

- Emotion → Meditate with that filter  
- Path card → resume/suggested session  
- SOS → SOS screen  
- FAB → Start Calm sheet (How I feel · SOS · Ask Wisdom)  

### 2. Meditate — “Choose a session”

```
PageHeader: emotion name OR “Meditations”
EmotionFilter chips (horizontal)
[ Selected banner | Clear ]
Session cards:
  cover · title · duration · scripture chip · premium tag
Empty: Grace + “Try another emotion” + Clear
```

### 3. Session player — “Listen”

Full-screen. No tabs.

```
Blur cover background
Close · title · progress
Large circular artwork (gentle pulse when playing)
Verse + reference
Scrub + play/pause
On complete: rating/progress celebration; the soft sheet may appear only in preview/limited-access configurations
```

### 4. SOS — “Regulate now”

```
Title: You’re safe · breathe with Me
Animated pulse (4-7-8 phases labeled)
Start / Pause
Cycle counter
Rotating Scripture
Exit
```

### 5. Wisdom — “What’s on your heart?”

```
Header + New + quota line
Message list (bubbles; streaming deltas)
Starter chips when empty (Anxious / Grieving / Ashamed / Angry / Doubt)
Composer: mic | text | Send
```

**Behavior (current):** primary path is **SSE streaming** (`POST /wisdom/chat/stream`) with non-stream fallback; voice via presign + Transcribe.

### 6. Journey — “Your Journey”

```
Range: week | month | all
JourneyHero (minutes · sessions · streak · rhythm)
WeekActivityChart
ReflectionInsight (when available)
PracticeBreakdown
MomentsCelebrate (milestones)
RecentSessions
```

Empty: invitation to Meditate — recognition framing, not gamified pressure.

### 7. Journal

```
Composer: mood tags + text + voice-to-text + save
List of past entries (date, mood, snippet)
Share with Wisdom (draft into Wisdom input; body not in analytics)
```

Hidden tab — open from **Me** or Home quick path.

### 8. Prayers (deferred UI)

Catalog API (`GET /prayers`) remains. Reference app **hides** the Prayers tab. Do not document as primary nav until re-enabled.

### 9. Profile / Me

```
Avatar initial / name / Free vs Premium
Appearance: light ↔ dark (light is product default)
Focus / reminder prefs
Feedback card
Links: Journey · Journal · Panic Relief (SOS) · Wisdom
Unlock / Manage subscription (RevenueCat)
Sign out
```

**Stats live on Journey**, not a progress ring on Me.

### 10. Paywall

**Primary conversion — onboarding ladder** (see [04-onboarding.md](./04-onboarding.md)):

| Tier | Role | Scarcity timer |
|------|------|----------------|
| Full | Plan picker (annual/monthly) | 12 min |
| 50% | Discount | 5 min |
| 80% | Final offer | 3 min |

**Post-auth hard gate** (`/paywall` modal):

```
Warm headline
Feature checklist
Continue → RevenueCat Paywalls UI (offering `default`)
Restore purchases
```

The separately implemented post-practice soft sheet is a secondary resurfacing trigger for preview/limited-access configurations.

### 11. Auth screens

- Unified **sign-in** with Create account mode (`?mode=signin|signup`)  
- Confirm email · Forgot / reset password  
- **Sign in with Apple** (Hosted UI + PKCE) when Cognito domain configured  
- Google Sign-In **not implemented** in the client  
- `/oauth` return handler  

### 12. Onboarding

Full conversion flow (**27 screens**, indices 0–26): design in [Onboarding-Design-Spec.md](./Onboarding-Design-Spec.md), overview in [04-onboarding.md](./04-onboarding.md). Exit → **auth**, then entitlement check → hard paywall or Home.

---

## Empty states

| Surface | Message spirit | CTA |
|---------|----------------|-----|
| Journal | “Cast one care here” | Write |
| Meditate filter empty | Grace resting | Clear filter |
| Wisdom | Grace listening + starters | Type or mic |
| Journey zero | “Your first session unlocks this” | Meditate |

## Contextual chrome rules

- Player: play/pause focus only  
- Wisdom: mic when empty/editing  
- Meditate: “Clear filter” only when filter active  
- Avoid double primary CTAs (hide global FAB on player/SOS if it conflicts)  

## Haptics & motion (guidance)

- Soft selection haptics on emotion/chips  
- Fade + gentle slide-up between onboarding steps  
- Player artwork pulse only while playing  
- Prefer calm easing; no bouncey “game” motion  
