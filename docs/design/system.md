# ChristCalm design system (current)

> Implemented in `frontend/src/theme/`. Prefer code over this doc if they diverge.

**Style:** Premium meditation — Nest (dark) + Cooper (light).  
**Default theme:** Dark.  
**Type:** Inter (SF Pro–like, single family).  
**Icons:** Ionicons only (no emoji as structural icons).

---

## Dual theme

| Mode | Reference | Feel |
|------|-----------|------|
| **Dark** | Nest / Fit Flockers | Pure black canvas, charcoal cards, violet + gold accents, gold FAB |
| **Light** | Cooper | Cream-lavender canvas, white cards, soft lavender + gold, ink CTAs |

### Dark tokens (summary)

| Role | Value |
|------|--------|
| Background | `#000000` |
| Surface | `#161618` |
| Primary (accent) | `#B8A4F5` |
| Premium / FAB gold | `#F0C14A` |
| Text primary | `#F5F5F7` |
| Borders | Near-invisible (`rgba(255,255,255,0.04–0.08)`) |

### Light tokens (summary)

| Role | Value |
|------|--------|
| Background | `#F6F3FA` |
| Surface | `#FFFFFF` |
| Primary | `#7C6FE0` |
| Premium gold | `#C9A227` |
| Text primary | `#1A1525` |
| Tile accents | Soft lavender / gold / rose / ink |

Full tables: [colors.md](colors.md) · code: `frontend/src/theme/tokens.ts`.

---

## Layout rhythm

- Page padding ~18–24  
- Section gap ~40  
- Card radius ~24  
- Card pad ~22  
- Floating tab bar + gold/lavender FAB  
- Spacious hierarchy; prefer emptiness over chrome  

---

## Typography

| Role | Face / weight |
|------|----------------|
| Titles | Inter SemiBold / Bold, tight tracking |
| Body | Inter Regular / Medium |
| Scripture | Inter Medium (no classic serif) |

Loaded via `frontend/src/hooks/use-app-fonts.ts`.

---

## Components (UI kit)

`frontend/src/components/ui/` — Button, Surface, Card, FloatingTabBar, BottomSheet, Screen, PageHeader, ProgressRing, ListeningWave, etc.

- Dark cards: **borderless** elevated fills  
- Light cards: soft border + shadow  
- Primary button dark: light pill; light: ink black  

---

## Product screens (UX intent)

| Screen | Job |
|--------|-----|
| Home | Emotion → meditate; quick paths; short scripture |
| Meditate | Filter by emotion; hero cover cards |
| Wisdom | Short chat, quota visible, mic + type |
| Journal | Mood + free write; optional share to Wisdom |
| SOS | 4-7-8 breathing + verse |
| Profile | Progress ring, stats, theme cycle, premium |
| Paywall | Dual plan cards Nest/Cooper style |

---

## Media

- Meditation covers: `assets/meditations/covers/<track>.jpg` (one unique image per session)  
- Bundle copy: `frontend/assets/meditations/covers/` via `./scripts/sync-meditation-covers.sh`  
- See `assets/meditations/covers/README.md`
