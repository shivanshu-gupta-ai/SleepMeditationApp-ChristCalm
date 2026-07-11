# Color tokens (current)

**Source of truth:** `frontend/src/theme/tokens.ts`  
Legacy Soft-UI teal palette archived as `_archive_design_guidelines.json`.

---

## Light — Cooper

| Token | Value | Usage |
|-------|--------|--------|
| `background` | `#F6F3FA` | App canvas |
| `backgroundElevated` | `#FCFAFE` | Elevated chrome |
| `surface` | `#FFFFFF` | Cards, sheets |
| `surfaceAlt` | `#F0ECF6` | Subtle wells |
| `primary` | `#7C6FE0` | Links, active light accents |
| `secondary` | `#C4A35A` | Soft gold accent |
| `textPrimary` | `#1A1525` | Headings / body |
| `textSecondary` | `#5C5568` | Secondary copy |
| `textMuted` | `#8E8799` | Labels |
| `premium` | `#C9A227` | Premium / gold |
| `accentSOS` | `#D47872` | SOS |
| `tileA–D` | Soft lavender / gold / ink / rose | Home tiles |
| `fab` | `#7C6FE0` | Start Calm FAB |

Primary CTA (light): ink black (`textPrimary`), not violet fill.

---

## Dark — Nest

| Token | Value | Usage |
|-------|--------|--------|
| `background` | `#000000` | True black canvas |
| `surface` | `#161618` | Cards (no hard border) |
| `surfaceAlt` | `#1C1C1F` | Elevated wells |
| `primary` | `#B8A4F5` | Soft violet accent |
| `secondary` / `premium` | `#F0C14A` | Warm gold |
| `textPrimary` | `#F5F5F7` | Headings |
| `textSecondary` | `#A0A0A8` | Secondary |
| `textMuted` | `#6E6E76` | Labels |
| `border` / `borderSoft` | White @ 8% / 4% | Rare separators |
| `fab` | `#F0C14A` | Gold FAB |
| `tileA–D` | `#1A1A1D` | Quiet charcoal tiles |

Primary CTA (dark): light/white pill. Premium: gold + dark ink.

---

## Rules

1. Never hardcode hex in screens — use `useTheme().colors`.  
2. Dark hierarchy = **fill**, not heavy borders.  
3. Purple/gold are **accents**, not full backgrounds.  
4. SOS keeps warm coral; success/danger stay soft.
