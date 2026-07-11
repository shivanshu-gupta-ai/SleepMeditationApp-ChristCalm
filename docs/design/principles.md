# Mobile UI Video Analysis → ChristCalm Premium Direction

**Source video:** *Everything you need to know about Mobile App UI’s in 8 minutes (beginner friendly)*  
**Path:** `video/vidssave.com Everything you need to know about Mobile App UI’s in 8 minutes (beginner friendly) 720P.mp4`  
**Technical analysis:** ffmpeg 8.1.2 + ffprobe  
**Frames:** `docs/design/video-frames/` (fps=1/10 + key timestamps)

## Video technical profile (ffprobe)

| Property | Value |
|----------|--------|
| Container | QuickTime / MOV |
| Duration | **456.07 s (~7m 36s)** |
| Size | 13.26 MB |
| Video | H.264 Main, **1280×720**, 30 fps, yuv420p |
| Audio | AAC 44.1 kHz stereo |
| Bitrate | ~233 kbps overall |

---

## 1. Core principles extracted from the video

### Navigation
- **Bottom floating tab bar** (pill / capsule), not a hard full-width edge bar
- **Max 4–5 destinations**
- **Prominent FAB** (+) for the primary create/start action, visually separate from tabs
- Labels + icons together; active state clearly filled/highlighted

### Layout
- **One screen = one job** — don’t mix unrelated tasks on one canvas
- **Cards are the atom** — generous internal padding; **avoid card-in-card**
- Clear section headers with optional “see all →”
- Content breathes; dark surfaces with soft elevation

### Patterns
- **Contextual chrome** — actions appear when relevant (e.g. share/overflow on detail, hide when not needed)
- **Bottom sheets / floating sheets** for secondary flows (filters, quick create, share) instead of full navigation stacks
- **Empty states** that point at the primary CTA (not dead ends)
- Premium dark: deep charcoal, white type hierarchy, subtle borders, green/teal accent sparingly for status

### Interaction quality
- Soft presses, selection states, progress/completion checkmarks
- Micro-moments (recent / suggested chips, status pills)
- Gestures implied: sheet drag, swipe-friendly lists

---

## 2. Premium design direction for ChristCalm

**Positioning:** High-end wellness (Calm / Headspace caliber) + biblical depth. Never kitschy church clip-art; never sparse “generic meditation.”

### Navigation (recommended)

| Slot | Label | Icon | Job |
|------|-------|------|-----|
| 1 | **Home** | home | Today’s path, emotion entry, daily word |
| 2 | **Meditate** | leaf | Sessions library / filters |
| 3 | **FAB** | + | **Start calm** sheet (emotion / SOS / Wisdom) |
| 4 | **Wisdom** | chat | Conversational Scripture care |
| 5 | **Me** | person | Progress, journal, profile, plan |

**Note:** Journal can live under **Me** or as a Home card to keep tabs ≤4 + FAB. Current app has 5 tabs (Home/Meditate/Wisdom/Journal/Me) — video wants float + FAB; prefer collapsing Journal into Me or Home to free FAB slot.

### Main screens (purpose)

1. **Home** — *One job: begin calm today*  
2. **Meditate** — *One job: pick and play a session*  
3. **Wisdom** — *One job: share a heart concern*  
4. **Progress / Me** — *One job: see growth & account*  
5. **Sheets** — SOS, filters, share journal → wisdom, paywall soft prompt  

### Cards / sheets / contextual actions

| Pattern | ChristCalm use |
|---------|----------------|
| **Cards** | Emotion tiles, session cards, devotional, journal entries, progress stats |
| **Bottom sheet** | Emotion picker FAB, session filter, journal→Wisdom, paywall soft |
| **Contextual** | Player: play/pause only; Wisdom: mic when empty/editing; Meditate: Clear filter when selected |
| **FAB** | “Start calm” — opens sheet: How I feel · SOS · Ask Wisdom |

### Typography / color / spacing (calm premium)

- **Heading:** Outfit (or similar geometric sans) — soft weight hierarchy  
- **Body:** Figtree / Inter-like — 15–16px, line-height 1.5  
- **Scripture:** Cormorant Garamond italic — never all-caps verse walls  
- **Colors:** Deep charcoal night, soft teal primary, sage secondary, coral SOS only  
- **Spacing:** 8pt base; section 32–40; card pad 20–24  
- **Radius:** 16–22 surface; pills full  
- **Elevation:** soft single-layer shadow + 1px borderSoft (not heavy neumorphism)

---

## 3. Five key screens (high detail)

### A. Home — “Begin calm”
```
[ status / safe area ]
Greeting overline + Name                    [Premium badge]
────────────────────────────────────────────
TODAY’S PATH card
  icon | “Continue with Anxious” / morning stillness
  sub + streak · chevron
────────────────────────────────────────────
How are you feeling?   (one job)
  2-col emotion cards (icon + label only)
────────────────────────────────────────────
More support (secondary)
  SOS row · Wisdom row
────────────────────────────────────────────
Today’s word (Surface card — scripture)
────────────────────────────────────────────
[ floating tab bar + FAB ]
```
**Interactions:** Emotion press → Meditate with filter; FAB → Start Calm sheet; long-press emotion → soft haptic + optional pin.

### B. Meditate — “Choose a session”
```
PageHeader: emotion name OR “Meditations”
EmotionFilter chips (horizontal, edge fades)
[ Selected emotion continuity banner | Clear ]
List of session cards:
  cover · title · duration · scripture chip · premium tag
Empty: Grace + “Try another emotion” + Clear CTA
```
**Contextual:** Clear filter only when selected; no FAB conflict on this tab.

### C. Session player (full-screen immersive)
```
Blur cover background
Close · title · progress
Large circular artwork (gentle pulse when playing)
Verse + reference
Scrub + play
On complete: celebration sheet (not instant paywall)
```
**One job:** listen. No tabs.

### D. Wisdom — “Share a concern”
```
Header + New + quota line
Message list (bubbles)
Starters chips (contextual when empty)
Composer: mic | input | Send
```
**FAB alternative on this tab:** hide global FAB or morph to mic — avoid double primary actions.

### E. Me / Progress
```
Avatar / name / plan
Streak + minutes cards (single row, not nested cards)
Journal entry list preview → full journal
Settings: theme, notifications, subscription
```

---

## 4. Empty states & first-time UX

| Surface | Empty copy | Primary CTA |
|---------|------------|-------------|
| Journal | Grace: “Cast one care here” | Write line |
| Meditate filter | Grace resting | Clear / All |
| Wisdom | Grace listening + starters | Type or mic |
| Progress | “Your first session unlocks this” | Go to Home emotion |

**First-time:** Keep first-steps checklist on Home (already). Later: onboarding trim so first calm happens before account friction.

**Pre-permission sheet** before mic: “Speak a concern; we’ll turn it into text for Wisdom.”

---

## 5. Figma design system tokens

### Color (dark default)
| Token | Hex | Use |
|-------|-----|-----|
| `bg` | `#0B0E13` | App background |
| `bgElevated` | `#12161E` | Tab bar / elevated |
| `surface` | `#171C26` | Cards |
| `surfaceAlt` | `#1E2430` | Nested chips (not nested cards) |
| `primary` | `#8AD0DA` | Teal accent / CTAs |
| `primarySoft` | `rgba(138,208,218,0.2)` | Icon wells |
| `textPrimary` | `#F5F7FA` | Titles |
| `textSecondary` | `#B0B8C4` | Body |
| `textMuted` | `#7A8494` | Overlines |
| `borderSoft` | `#252B36` | Card borders |
| `sos` | `#ECA8A3` | Emergency only |
| `premium` | `#EBC878` | Gold sparingly |
| `scrim` | `rgba(0,0,0,0.72)` | Sheets |

### Spacing (8pt)
`4 / 8 / 16 / 24 / 32 / 48 / 64`

### Radius
`sm 10 · md 14 · lg 18 · xl 24 · full 999 · surface 18`

### Elevation
- Card: `0 4 16 rgba(0,0,0,0.28)` + borderSoft  
- FAB: stronger glow primary soft  
- Sheet: top radius 24, handle 4×36 muted  

### Components
- Tab bar: floating pill, 16px bottom inset, max height ~64+safe  
- FAB: 56 circle, primary fill, `+` or leaf  
- Card pad: 20–24  
- Touch: min 44  

---

## Gap vs current ChristCalm app

| Video principle | Current status | Gap |
|-----------------|----------------|-----|
| Floating bottom nav + FAB | Solid tab bar, no FAB | Add floating capsule + Start Calm FAB |
| One screen one job | Mostly good | Home still multi-section — keep hierarchy strict |
| Cards, no double nest | Good | Audit nested Surfaces |
| Bottom sheets | Limited | Sheets for FAB, filters, paywall soft |
| Empty states | Grace empties | Expand CTAs |
| Premium dark type | Strong | Keep Outfit/Figtree/Cormorant |

---

## Recommended implementation order

1. Floating tab bar + **Start Calm FAB** sheet  
2. Bottom sheets for filter / journal share / soft paywall  
3. Stricter Home hierarchy (path → emotion → secondary)  
4. Onboarding trim (deferred)  
5. Optional Rive Grace on empties  

---

*Generated from frame analysis of the attached 720p tutorial video + existing ChristCalm Soft UI Evolution system.*
