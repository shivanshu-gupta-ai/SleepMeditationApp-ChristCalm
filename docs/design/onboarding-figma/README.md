# ChristCalm Onboarding — Figma design pack

All **12 onboarding screens** from the live app (`frontend/app/onboarding.tsx` + `frontend/src/features/onboarding/constants.ts`), laid out as a Figma-ready artboard.

> There is no Figma API token in this project, so this pack is the **source of truth** you open in a browser and import into Figma (or hand off as PNGs).

## What’s included

| File | Purpose |
|------|---------|
| [`onboarding-artboard.html`](./onboarding-artboard.html) | Interactive board — all 12 phone frames (390×844) |
| [`tokens.json`](./tokens.json) | Cooper light colors / type / radius for Figma variables |
| [`export-pngs.mjs`](./export-pngs.mjs) | Playwright export → `exports/*.png` |
| `exports/*.png` | One PNG per screen (after export) |

## Screen index

| # | Frame name | Type | CTA |
|---|------------|------|-----|
| 0 | Welcome | Scripture + Grace | Begin My Journey |
| 1 | Name | Text input | Continue |
| 2 | Heart | Multi-select | Continue |
| 3 | Faith | Single-select | Continue |
| 4 | Concerns | Multi-select | Continue |
| 5 | Timing | Single-select | Continue |
| 6 | Insight | Derived copy | Continue |
| 7 | Support | Multi-select | Continue |
| 8 | Scripture | Matthew 11:28 | I'm ready to begin |
| 9 | Covenant | Peace covenant | I commit… |
| 10 | Building | Progress | (auto) |
| 11 | Practices | Product preview | Enter ChristCalm |

## Open the artboard

```bash
open docs/design/onboarding-figma/onboarding-artboard.html
# or
npx serve docs/design/onboarding-figma
```

## Export PNGs for Figma

```bash
cd docs/design/onboarding-figma
# needs playwright (repo frontend or global)
npm install -g playwright  # if needed
npx playwright install chromium  # first time
node export-pngs.mjs
```

Outputs:

- `exports/00-Welcome.png` … `exports/11-Practices.png`
- `exports/00-full-artboard.png` (overview)

## Import into Figma (recommended)

### Option A — Place PNGs (fastest)

1. Figma → **New design file** → name it `ChristCalm — Onboarding`
2. Create a page **Onboarding · Light**
3. **Drag** all `exports/*.png` onto the canvas (or File → Place image)
4. Align frames left-to-right: 00 → 11, gap ~48px
5. Optionally create a **component** per screen for reuse

### Option B — html.to.design plugin

1. Install [html.to.design](https://www.figma.com/community/plugin/1159123024924461424) in Figma  
2. Open `onboarding-artboard.html` in Chrome  
3. Use the plugin to capture the page (or each phone frame) as editable layers  

### Option C — Design tokens as Figma variables

Create color variables from `tokens.json`:

| Variable | Hex |
|----------|-----|
| `bg/background` | `#F6F3FA` |
| `bg/surface` | `#FFFFFF` |
| `accent/primary` | `#7C6FE0` |
| `text/primary` | `#1A1525` |
| `text/secondary` | `#5C5568` |
| `border/default` | `#E6E1EF` |

Frame size: **390 × 844** (iPhone 14/15).

## Product docs

- Flow + copy: [`docs/product/04-onboarding.md`](../../product/04-onboarding.md)
- Design system notes: [`docs/design/README.md`](../README.md)

## After sign-up

Onboarding ends at **Enter ChristCalm** → app routes to **sign-up** (auth). Do not put hard paywall on these frames.
