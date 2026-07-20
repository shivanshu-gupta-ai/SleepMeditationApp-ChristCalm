# Onboarding

**Goal:** Warm, personalized, reverent first-run experience. Acknowledge struggle → offer hope → gentle education → meaningful commitment → teach how the app works.  
**Duration target:** ~75–100 seconds of active attention.  
**Paywall:** Not here — show soft paywall only after first completed practice on Home.

## Principles

**Borrow good patterns:** personalization, mascot warmth, insight moment (not harsh diagnosis), beautiful commitment, value before paywall.

**Never:** fear/guilt, shock, fake social proof, aggressive urgency.

## Step list

| # | Screen | Required | Data |
|---|--------|----------|------|
| 0 | Welcome + Scripture + Grace | — | — |
| 1 | What should I call you? | Name optional | `user_name` |
| 2 | How has your heart been feeling? | ≥1 | `emotional_state[]` |
| 3 | Faith journey stage | One | `faith_journey` |
| 4 | What’s weighing on your heart? | ≥1 | `concerns[]` |
| 5 | When do you most need peace? | One | `preferred_time` |
| 6 | Your current season (insight) | — | derived copy only |
| 7 | How Grace will support you | ≥1 | `desired_support[]` |
| 8 | A moment with Scripture | — | — |
| 9 | Personal Peace Covenant | Commit | `commitment_accepted`, `commitment_date` |
| 10 | Preparing your journey | — | animation |
| 11 | How the app works + first practices | ≥1 practice optional | `first_practices_done[]` |

After step 11 → Home (auth may wrap before/after depending on platform policy).

---

## Copy & options (canonical)

### Step 0 — Welcome

- Overline: “A sacred space for your heart”  
- Headline Scripture: “Peace I leave with you; my peace I give you.”  
- Reference: John 14:27  
- Subtext: “Grace is here to walk with you — one gentle step at a time.”  
- CTA: **Begin My Journey**

### Step 1 — Name

- Title: “What should I call you?”  
- Subtitle: “This helps our conversations feel personal and warm.”  
- Field: optional display name  

### Step 2 — Heart (multi-select OK)

| id | Label | Sub |
|----|-------|-----|
| `weary` | Weary | I'm running on empty |
| `anxious` | Anxious | My mind won't quiet down |
| `numb` | Numb | I'm going through the motions |
| `hopeful_tired` | Hopeful but tired | I want to feel peace again |
| `peaceful` | Peaceful | I'm in a good place |

### Step 3 — Faith stage (single)

| id | Label | Sub |
|----|-------|-----|
| `seeking` | Seeking | I'm exploring faith |
| `new` | New | I'm new to following Jesus |
| `growing` | Growing | I'm growing and learning |
| `deep` | Deeply rooted | Faith is the center of my life |

### Step 4 — Concerns (multi)

| id | Label | Sub |
|----|-------|-----|
| `anxiety` | Anxiety & Fear | Worry, restless thoughts, or panic |
| `sleep` | Sleep & Rest | Hard to settle at night |
| `grief` | Grief or Loneliness | Sorrow, loss, or feeling unseen |
| `overwhelm` | Overwhelm | Too much to hold right now |
| `faith_purpose` | Faith & Purpose | Doubt, direction, or wanting Jesus nearer |

### Step 5 — Timing (single)

| id | Label |
|----|-------|
| `morning` | Morning |
| `midday` | Midday |
| `evening` | Evening |
| `before_sleep` | Before sleep |
| `random` | Random moments |

### Step 6 — Insight (derived)

```
if heavy (many concerns OR anxious/weary):
  headline: "It looks like you're carrying quite a bit right now."
  sub: "You're not alone. God's peace is available to you — one small step at a time."
else if only peaceful:
  headline: "What a gift to begin from a place of peace."
  sub: "Grace will walk with you as you deepen the calm God has already placed in your heart."
else:
  headline: "Every season has its own rhythm."
  sub: "You're not alone. God's peace is available to you — one small step at a time."
```

### Step 7 — Desired support (multi)

| id | Label | Sub |
|----|-------|-----|
| `calm_anxiety` | Calm my mind | Scripture for anxious, racing thoughts |
| `rest_sleep` | Rest & sleep | Settle body and mind at night |
| `scripture` | God's Word | Hear Scripture spoken into this season |
| `hard_emotions` | Hard emotions | Grief, loneliness, or overwhelm |
| `presence` | His presence | Feel God near — quiet company |

### Step 8 — Scripture moment

> “Come to me, all you who are weary and burdened, and I will give you rest.”  
> — Matthew 11:28  

CTA: **I’m ready to begin**

### Step 9 — Peace Covenant

```
With Jesus beside me,
I choose to walk toward peace —
one gentle step, one honest breath, one day at a time.
I am not alone. I am deeply loved.
```

CTA: **I commit to this journey with Jesus**  
Store: `commitment_accepted=true`, `commitment_date=ISO-8601`

### Step 10 — Preparing

- “I’m preparing a journey just for you.”  
- Soft progress / Grace animation  

### Step 11 — How the app works

Honest product (not a locked 7-day course):

| id | Title | Sub |
|----|-------|-----|
| `emotions` | Emotion-based meditations | Tell us how you feel — open a Scripture-guided session for that emotion. |
| `sos` | SOS when panic hits | One-tap 4-7-8 breathing with calming verses. |
| `devotional` | Today's devotional | A fresh Scripture reflection each day. |
| `wisdom` | What would Jesus say? | Type a concern — conversational wisdom + handbook. |
| `journal` | Journal | Write what's on your heart with mood tags. |

Optional first practices checklist:

| id | Label | Text |
|----|-------|------|
| `breathe` | Breathe with Jesus | Take 3 slow breaths and whisper: “Jesus, I receive Your peace.” |
| `scripture` | Today's Scripture | Read today's Scripture slowly and let one word settle. |
| `share` | Honest prayer | Tell Jesus one thing heavy on your heart. |

CTA: **Start my journey**

---

## Data model

```ts
interface OnboardingDraft {
  user_name?: string;
  emotional_state?: string[];   // or single string if product simplifies
  faith_journey?: string;
  concerns?: string[];
  preferred_time?: string;
  desired_support?: string[];
  commitment_accepted?: boolean;
  commitment_date?: string;     // ISO date
  first_practices_done?: string[];
}
```

## Persistence rules

1. Save draft **locally** after each step (survive kill/background).  
2. After auth, `POST /api/auth/onboarding` with draft fields.  
3. Do not block progress on network for early steps.  
4. Mark onboarding complete only after final CTA.

## Motion & UI notes

- Soft fade + gentle slide-up between steps  
- Progress indicator (step labels optional)  
- Grace expression shifts: welcome → listening → hopeful → covenant  
- Scripture uses elevated type treatment (see design system)  
- Full light/dark from step 0  
