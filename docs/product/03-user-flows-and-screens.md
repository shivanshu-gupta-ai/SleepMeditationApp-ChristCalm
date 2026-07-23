# User flows & screens

## Information architecture

### Primary navigation

Floating bottom tab bar (pill) + center **FAB** (“Start calm”).

| Slot | Label | Job |
|------|-------|-----|
| 1 | **Home** | Begin calm today |
| 2 | **Meditate** | Pick & play a session |
| 3 | **FAB** | Sheet: emotion / SOS / Wisdom |
| 4 | **Wisdom** | Share a heart concern |
| 5 | **Me** | Progress, journal entry, profile |

**Note:** Journal may be its own tab or under Me. Prayer library may live under Home card, Meditate section, or dedicated route. Current reference app uses tabs: Home · Meditate · Wisdom · Journal · Profile, plus stack routes for SOS, player, paywall, auth, onboarding, AI prayer.

### Stack / modal routes (not tabs)

| Route | Purpose |
|-------|---------|
| Onboarding | First-run wizard |
| Auth (sign-in, sign-up, confirm, forgot, reset) | Account |
| OAuth callback | Social return |
| Meditation player `/meditation/:id` | Immersive player |
| SOS | Panic relief |
| Paywall | Subscription |
| AI Prayer | Legacy / alternate entry to Wisdom-style prayer |

---

## Critical flows

### A. First launch → first calm

```
Install → Onboarding → (Auth if required) → Home
  → Tap emotion → Meditate filtered → Open session → Complete
  → Soft paywall (optional dismiss) → Profile stats updated
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
Complete first practice → Soft paywall
  → Choose Monthly / Annual → Store purchase → Entitlement sync
  → Premium badge / unlock gates
```

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
On complete: celebration / soft sheet (not instant hard paywall)
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

### 5. Wisdom — “Share a concern”

```
Header + New + quota line
Message list (bubbles)
Starter chips when empty
Composer: mic | text | Send
```

**Empty starters (examples)**

- “I’m anxious and can’t settle.”  
- “I feel alone tonight.”  
- “I’m grieving and don’t know what to pray.”  

### 6. Journal

```
Composer: mood tags + text + save
List of past entries (date, mood, snippet)
Optional: share concern to Wisdom (body not required in analytics)
```

### 7. Prayers

```
Categories: Morning, Evening, Anxiety, Gratitude, Healing
List of prayers (title + body); premium gated if configured
Entry to AI Prayer / Wisdom
```

### 8. Profile / Me

```
Avatar / name / plan badge
Progress ring
Stats: streak · minutes · practices
Theme cycle (dark / light / system)
Manage subscription
Sign out
```

### 9. Paywall

```
Warm headline (invitational)
Feature checklist
Monthly card | Annual card (highlighted)
Restore purchases
Not now (dismiss)
```

**Tone:** Soft, transparent. No fake timers.

### 10. Auth screens

- Sign in / Sign up (email + password)  
- Confirm email (if provider requires)  
- Forgot / reset password  
- Social: Apple, Google (as available)  
- OAuth return handler  

### 11. Onboarding

See [04-onboarding.md](./04-onboarding.md).

---

## Empty states

| Surface | Message spirit | CTA |
|---------|----------------|-----|
| Journal | “Cast one care here” | Write |
| Meditate filter empty | Grace resting | Clear filter |
| Wisdom | Grace listening + starters | Type or mic |
| Progress zero | “Your first session unlocks this” | Go Home |

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
