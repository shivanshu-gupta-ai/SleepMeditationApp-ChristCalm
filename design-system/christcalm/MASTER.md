# Design System Master File — ChristCalm

> **LOGIC:** When building a specific page, first check `design-system/christcalm/pages/[page-name].md`.
> If that page file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** ChristCalm  
**Category:** Christian meditation · mental wellness · emotion-first mobile  
**Style:** Soft UI Evolution (wellness) — not pure neumorphism (better dark-mode + WCAG)  
**Design Dials:** Variance 3/10 (Centered / Minimal) | Motion 3/10 (Subtle) | Density 2/10 (Spacious)  
**Stack:** React Native / Expo  
**Source:** ui-ux-pro-max skill evaluation + product-adapted tokens

---

## Product intent

- **Primary job:** Emotion → Scripture-guided meditation (Home grid → Meditate filter continuity)
- **Tone:** Calm, spacious, premium, spiritually warm — never loud or gamified
- **Default theme:** Dark (charcoal + soft teal)
- **Icons:** Ionicons only — **never emoji as structural icons**

---

## Style: Soft UI Evolution

| Do | Don't |
|----|--------|
| Soft multi-layer shadows, clear hierarchy | Pure neumorphism dual-shadows that break in dark mode |
| Radius 10–22pt organic curves | Sharp 0–4px corners |
| Semantic teal/sage brand tokens | Generic purple SaaS palette |
| One icon family (Ionicons), outline default / filled active | Emoji glyphs for emotions, tabs, filters |
| Press scale 0.97, 150–280ms motion | Instant snaps or >400ms decorative motion |
| Spacious 8pt rhythm (section gaps 32–36) | Dense dashboard packing |

---

## Color tokens (implemented in `frontend/src/theme/tokens.ts`)

### Light
| Role | Hex / value |
|------|-------------|
| Background | `#F5F2EB` |
| Surface | `#FFFFFF` |
| Primary | `#4F8F99` |
| Text primary | `#15202B` |
| Text secondary | `#4F5966` |
| Success / accent calm | `#3D8F80` |
| SOS / danger | `#C96B66` |

### Dark (default)
| Role | Hex / value |
|------|-------------|
| Background | `#0B0E13` |
| Surface | `#171C26` |
| Primary | `#8AD0DA` |
| Text primary | `#F5F7FA` |
| Text secondary | `#B0B8C4` |
| Scrim | `rgba(0,0,0,0.72)` |

**Rules:** Use `useTheme().colors.*` only — no raw hex in screens. Contrast body ≥4.5:1 both themes.

---

## Typography

| Role | Family (Expo) |
|------|----------------|
| Heading | Outfit (semi/bold) |
| Body | Figtree |
| Scripture | Cormorant Garamond italic |

Title ~30 / body 15–16 / overline 12 uppercase tracking ~1.6. Line-height body ~1.5.

---

## Spacing & layout

| Token | Value |
|-------|-------|
| xs–xxxl | 4 / 8 / 16 / 24 / 32 / 48 / 64 |
| pageTop / pageBottom | 20 / 56 |
| sectionGap | 36 |
| listGap | 16 |
| cardPad | 22 |
| surfaceRadius | 22 |
| touchMin | 44 |

Phone shell max width ~430 on web. No horizontal page scroll.

---

## Icons

- Map emotions via `emotionIcon(id)` in `src/constants/emotion-icons.ts`
- Tab bar: outline inactive, filled active
- Size scale: sm 18 / md 22 / lg 28

---

## Motion

- Enter: fade + 10px slide, ~280ms ease-out, stagger 30–50ms
- Press: spring scale 0.97
- **Must** respect `AccessibilityInfo.isReduceMotionEnabled`
- Never animate layout width/height for micro-interactions

---

## Components

### Buttons
- minHeight ≥54 (≥44 touch)
- Primary uses `textOnPrimary` (works light + dark)
- Loading: disable + spinner + a11y “loading”
- Icons: Ionicons only

### Cards / Surface
- surface + borderSoft + soft shadow
- PressableScale for tappable cards
- accessibilityLabel on every interactive card

### Emotion filter
- Horizontal chips, no system scrollbar
- Edge fades for overflow
- Vector icons + labels; filterHeight ≥44

### Navigation
- Bottom tabs ≤5 visible
- Labels + icons always
- Active: filled icon + primary tint

---

## Accessibility checklist (must)

- [ ] Touch targets ≥44×44
- [ ] 8px+ gap between targets
- [ ] accessibilityLabel on icon-only / card presses
- [ ] No color-only state (icon or text too)
- [ ] Reduced motion supported
- [ ] Focus/selected states visible in light and dark
- [ ] No emoji as icons

---

## Anti-patterns (from skill + review)

- Mixing emoji and vector icons for the same role
- Horizontal scrollbars as chrome
- Wide web layouts without phone shell
- Gray-on-gray text in dark mode
- Hover-only interactions
- Blocking navigation on animation

---

## Page hierarchy

1. **Home** — greeting, emotion grid (hero), SOS + Wisdom, daily word  
2. **Meditate** — EmotionFilter + session list (shares emotion language with Home)  
3. **Wisdom** — chat “What would Jesus say?”  
4. **Journal** — mood chips (vector) + entries  
5. **Profile** — theme, account  

When implementing a page: read this file first; only create `pages/*.md` for true deviations.
