# ChristCalm — Onboarding Flow v3

**Goal**: Create a warm, emotionally engaging, highly personalized onboarding experience that borrows the best structural techniques from Catzy and Brainrot while remaining reverent, biblically grounded, and free of fear/guilt/shock tactics, fake social proof, or aggressive monetization.

**Design System Alignment**

- Full support for **Light + Dark themes** (see `design_guidelines.json` and `colors.md`)
- Background: `#F9F7F1` (light) / `#0F1115` (dark)
- Primary: `#5B9BA5` (light) / `#6BA8B3` (dark)
- Cards: `rounded-3xl`, soft border, generous padding
- Typography: Outfit (headings), Figtree (body), Cormorant Garamond (scripture)
- Motion: Soft fade + gentle slide-up (framer-motion)
- **Mascot**: "Grace" — a gentle brain character holding an open Bible with a soft plus/cross symbol. Represents mental renewal through faith. Never depicts Jesus directly.
- Spacing: Airy and generous to reduce cognitive load

**Total Steps**: 11
**Estimated Completion Time**: 75–100 seconds

---

## Core Principles

**Borrowed (Good Patterns)**

- Strong personalization through thoughtful questions
- Clear emotional journey: Acknowledge struggle → Offer hope → Gentle education → Meaningful commitment
- Expressive mascot with subtle emotional reactions
- Kind "insight" moment (replaces harsh diagnosis)
- Beautiful, memorable commitment ritual
- Show simple value before any paywall

**Explicitly Avoided**

- Fear/guilt-based language or imagery
- Shock visuals
- Fake reviews or social proof
- Aggressive urgency or fake discounts in pricing

---

## Steps Overview

| Step | Screen                                  | Required        | Data Collected                           |
| ---- | --------------------------------------- | --------------- | ---------------------------------------- |
| 0    | Welcome + Scripture + Grace             | —               | —                                        |
| 1    | What should I call you?                 | Name (optional) | `user_name`                              |
| 2    | How has your heart been feeling?        | One option      | `emotional_state`                        |
| 3    | Faith journey stage                     | One option      | `faith_journey`                          |
| 4    | What’s weighing on your heart?          | At least 1      | `concerns[]`                             |
| 5    | When do you most need peace?            | One option      | `preferred_time`                         |
| 6    | Your current season (gentle insight)    | —               | —                                        |
| 7    | How Grace will support you              | Multi-select    | `desired_support[]`                      |
| 8    | A moment with Scripture                 | —               | —                                        |
| 9    | Your Personal Peace Covenant            | Commit          | `commitment_accepted`, `commitment_date` |
| 10   | Preparing your journey...               | —               | —                                        |
| 11   | Begin with gentle steps + 7-day preview | At least 1      | `first_practices_done`                   |

After Step 11 → Home screen (soft paywall shown later, after first practice)

---

## Detailed Screen Specifications

### Step 0: Welcome

**Visual**: Soft gradient background. Large illustration of **Grace** (gentle brain holding open Bible with plus/cross). Warm, calm lighting.

**Copy**:

- Overline: “A sacred space for your heart”
- Headline: “Peace I leave with you; my peace I give you.”
- Scripture: _John 14:27_ (Cormorant Garamond)
- Subtext: “Grace is here to walk with you — one gentle step at a time.”

**Button**: **Begin My Journey**

---

### Step 1: What should I call you?

**Visual**: Grace sitting beside input field with friendly expression.

**Copy**:

- Headline: “What should I call you?”
- Subtext: “This helps our conversations feel personal.”

**Input**: Large rounded-3xl field

**Data**: `user_name`

---

### Step 2: How has your heart been feeling lately?

**Visual**: Grace with soft, listening expression. Emotion cards with gentle pastel icons.

**Options**:

- Weary
- Anxious
- Numb
- Hopeful but tired
- Peaceful

**Data**: `emotional_state`

---

### Step 3: Faith Journey Stage

**Visual**: Grace on a gentle path.

**Options**:

- Seeking
- New
- Growing
- Deeply rooted

**Data**: `faith_journey`

---

### Step 4: What’s weighing on your heart?

**Visual**: Grace with compassionate expression.

**Multi-select chips**:

- Anxiety & Worry, Panic or Fear, Sleep & Rest, Grief or Loss, Loneliness, Overwhelm & Busyness, Purpose & Direction, Struggles with Faith, I just want to grow closer to Jesus

**Data**: `concerns[]`

---

### Step 5: When do you most need peace?

**Options**:

- Morning, Midday, Evening, Before sleep, Random moments

**Data**: `preferred_time`

---

### Step 6: Your Current Season (Gentle Insight)

**Visual**: Grace holding Bible, warm and understanding.

**Copy**:

- “It looks like you’re carrying quite a bit right now.”
- “You’re not alone. God’s peace is available to you — one small step at a time.”

**Button**: Continue

---

### Step 7: How Grace Will Support You

**Multi-select**:

- Help me rest and sleep better
- Calm my anxious thoughts with Scripture
- Hear God’s Word personally
- Build simple daily habits
- Feel God’s presence more deeply
- Process grief or hard emotions
- Find purpose and direction
- Just be with me in the quiet

**Data**: `desired_support[]`

---

### Step 8: A Moment with Scripture

**Visual**: Grace holding open Bible with soft light.

**Scripture**:

> “Come to me, all you who are weary and burdened, and I will give you rest.”  
> — Matthew 11:28

**Button**: I’m ready to begin

---

### Step 9: Your Personal Peace Covenant

**Visual**: Beautiful card with Grace beside it. Warm, reverent lighting.

**Copy**:

> With Jesus beside me,  
> I choose to walk toward peace —  
> one gentle step, one honest breath, one day at a time.  
> I am not alone. I am deeply loved.

**Button**: **I commit to this journey with Jesus**

**Data**: `commitment_accepted`, `commitment_date`

---

### Step 10: Preparing Your Journey

**Visual**: Grace with soft progress bar and hopeful animation.

**Copy**:

- “I’m preparing a journey just for you.”
- “Gentle daily practices rooted in Scripture that fit your season.”

---

### Step 11: Let’s Begin + First 7 Days

**Checklist** (3 gentle first steps):

- Take 3 slow breaths and whisper: “Jesus, I receive Your peace.”
- Read today’s Scripture
- Tell Jesus one thing heavy on your heart

**7-Day Preview Card**:

> Day 1: Receiving Peace → Day 2: Quieting the Mind → ... → Day 7: Walking in Peace

**Button**: Start my journey

---

## After Onboarding

- User lands on **Home screen**
- Soft, non-intrusive paywall shown **only after first practice is completed**
- All onboarding data saved to `cc_onboarding_draft` and sent to backend

---

## Data Model

```ts
interface OnboardingDraft {
  user_name?: string;
  emotional_state?: string;
  faith_journey?: string;
  concerns?: string[];
  preferred_time?: string;
  desired_support?: string[];
  commitment_accepted?: boolean;
  commitment_date?: string;
  first_practices_done?: string[];
}
```

---

## Implementation Notes

- Persist progress in `AsyncStorage` under `cc_onboarding_draft`
- Use `framer-motion` for all transitions
- Grace mascot should have subtle expression changes (listening, hopeful, gentle smile)
- Scripture always uses `Cormorant Garamond`
- All colors must come from the semantic tokens in `design_guidelines.json`
- Support both light and dark themes from the first screen

This onboarding creates emotional safety, personalization, and a meaningful commitment while staying fully aligned with ChristCalm’s values and design system.
