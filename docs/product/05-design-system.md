# Design system

**Style names:** Nest (dark) + Cooper (light)  
**Default theme:** **Light (Cooper)** — dark is explicit user choice only  
**Icons:** System-like outline icons (Ionicons in reference app). Do not use emoji as structural UI icons.  
**Mascot:** Grace — onboarding + loading/empty states (`GraceActor` + bundled mood GIFs).

Implement tokens as named semantic colors in **any** stack (Swift Asset Catalog, Compose ColorScheme, CSS variables, RN theme).

---

## Color tokens

### Light — Cooper

| Token | Hex / value | Usage |
|-------|-------------|--------|
| `background` | `#F6F3FA` | App canvas |
| `backgroundElevated` | `#FCFAFE` | Elevated chrome |
| `surface` | `#FFFFFF` | Cards, sheets |
| `surfaceAlt` | `#F0ECF6` | Subtle wells |
| `surfaceMuted` | `#EDE8F7` | Muted wells |
| `primary` | `#7C6FE0` | Links, active accents |
| `primaryDark` | `#6358C4` | Pressed primary |
| `primarySoft` | `rgba(124,111,224,0.12)` | Icon wells |
| `secondary` | `#C4A35A` | Soft gold accent |
| `textPrimary` | `#1A1525` | Headings / body |
| `textSecondary` | `#5C5568` | Secondary copy |
| `textMuted` | `#8E8799` | Labels / overlines |
| `textOnPrimary` | `#FFFFFF` | On filled primary (rare) |
| `accentSOS` | `#D47872` | SOS only |
| `premium` | `#C9A227` | Premium / gold |
| `border` | `#E6E1EF` | Soft borders |
| `borderSoft` | `#F0ECF5` | Hairlines |
| `success` | `#5BA88F` | Positive |
| `danger` | `#C45C57` | Errors |
| `fab` | `#7C6FE0` | Start Calm FAB |
| `fabText` | `#FFFFFF` | FAB icon |
| `tileA` | `#EDE8FB` | Home tile |
| `tileB` | `#FBF3D9` | Home tile |
| `tileC` | `#1A1525` | Ink tile |
| `tileD` | `#F5E6E4` | Rose tile |
| `scrim` | `rgba(26,21,37,0.5)` | Sheets |
| `tabBar` | `rgba(255,255,255,0.94)` | Floating bar |

**Primary CTA (light):** ink black fill (`textPrimary`), not full-width violet.

### Dark — Nest

| Token | Hex / value | Usage |
|-------|-------------|--------|
| `background` | `#000000` | True black canvas |
| `backgroundElevated` | `#0A0A0B` | Elevated |
| `surface` | `#161618` | Cards (borderless fill) |
| `surfaceAlt` | `#1C1C1F` | Elevated wells |
| `primary` | `#B8A4F5` | Soft violet accent |
| `primaryDark` | `#9B86E8` | Pressed |
| `primarySoft` | `rgba(184,164,245,0.14)` | Icon wells |
| `secondary` / `premium` | `#F0C14A` | Warm gold |
| `textPrimary` | `#F5F5F7` | Titles |
| `textSecondary` | `#A0A0A8` | Body |
| `textMuted` | `#6E6E76` | Labels |
| `textOnPrimary` | `#0A0A0A` | On light CTAs |
| `accentSOS` | `#F0A8A3` | SOS |
| `border` | `rgba(255,255,255,0.08)` | Rare |
| `borderSoft` | `rgba(255,255,255,0.04)` | Rare |
| `fab` | `#F0C14A` | Gold FAB |
| `fabText` | `#0A0A0A` | FAB icon |
| `tileA–D` | `#1A1A1D` | Quiet charcoal tiles |
| `scrim` | `rgba(0,0,0,0.72)` | Sheets |
| `tabBar` | `rgba(18,18,20,0.92)` | Floating bar |

**Primary CTA (dark):** light/white pill. Premium: gold + dark ink.

### Rules

1. Never hardcode hex in screens — always semantic tokens.  
2. Dark hierarchy = **fill**, not heavy borders.  
3. Purple/gold are **accents**, not full backgrounds.  
4. SOS stays warm coral only on emergency paths.  

---

## Typography

| Role | Guidance |
|------|----------|
| Titles | Geometric/humanist sans, SemiBold/Bold, tight tracking |
| Body | Same family Regular/Medium, ~15–16sp, line-height ~1.45–1.5 |
| Overlines | Smaller, muted, slight letter-spacing |
| Scripture | Elevated treatment — Medium/italic or refined serif; never all-caps walls |

**Reference fonts:** Inter (current). Acceptable alternatives: SF Pro (iOS), Outfit + Figtree + Cormorant Garamond (legacy pairing).

### Scale (approx)

| Token | Size | Line height |
|-------|------|-------------|
| Title | 32 | 38 |
| Subtitle | 15 | 22 |
| Overline | 13 | — |
| Body | 15–16 | 22–24 |
| Caption | 12–13 | 16–18 |

---

## Layout rhythm (8pt base)

| Token | Value |
|-------|-------|
| page padding horizontal | 18–24 |
| page top | ~22 |
| page bottom (above tab bar) | ~120 |
| section gap | 40 |
| list gap | 16 |
| card pad | 20–24 |
| surface radius | 24 |
| touch min | 44 |
| FAB size | 52–56 |
| tab bar float inset | ~14 |

Spacing steps: `4 / 8 / 16 / 24 / 32 / 48 / 64`

Radius: `sm 10 · md 14 · lg 18 · xl 24 · full 999 · surface 24`

---

## Elevation

| Surface | Treatment |
|---------|-----------|
| Dark card | Fill only (`surface`); no hard border |
| Light card | Soft border + soft shadow |
| FAB | Soft primary/gold glow |
| Sheet | Top radius 24, drag handle 4×36 muted |

---

## Components (UI kit)

Every platform should implement equivalents of:

| Component | Behavior |
|-----------|----------|
| `Screen` | Safe area, background token, optional scroll |
| `PageHeader` | Title + optional trailing action |
| `Surface` / Card | Elevated content block |
| `Button` | Primary / secondary / ghost / SOS |
| `TextField` | Rounded, filled input |
| `Chip` | Filter / multi-select |
| `EmotionFilter` | Horizontal emotion chips |
| `BottomSheet` | Drag, scrim, soft corners |
| `FloatingTabBar` | Pill + FAB cutout |
| `ListeningWave` | Wisdom voice UI |
| `EmptyState` | Grace + copy + CTA |
| `LoadingState` / `ErrorState` | Calm feedback |
| `PremiumBadge` | Gold sparingly |
| `SectionHeader` | Title + optional “see all” |

### Buttons

- Dark primary: light pill on black  
- Light primary: ink black pill  
- SOS: coral soft fill  
- Destructive: soft danger, never alarm red full-bleed  

---

## Navigation chrome

- Floating pill tab bar, max ~5 destinations  
- Center FAB gold (dark) / lavender (light) for **Start calm**  
- Sheets for secondary flows (filters, soft paywall, start calm)  
- Full-screen immersive for player & SOS (hide tabs)  

---

## Motion

| Pattern | Spec |
|---------|------|
| Screen enter | Opacity + 8–16px Y, 250–350ms ease-out |
| Press | Scale ~0.98 soft |
| Player pulse | Slow breathe while playing |
| Onboarding | Fade + slide between steps |
| Sheet | Spring or ease from bottom |

Avoid: bouncy game physics, confetti spam, aggressive parallax.

---

## Media guidelines

- One **unique cover image** per meditation track  
- Covers: calm abstract / nature; not stock-church kitsch  
- Audio: host on CDN/S3; client streams HTTPS  
- Grace assets: still + short companion video/wave optional  

---

## Accessibility

- Contrast: body text readable on both themes  
- Dynamic type: allow scaling where layout permits  
- Screen reader labels on icons  
- Reduce motion: disable non-essential pulses if OS setting on  
