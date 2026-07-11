# ChristCalm Color System

**Source of Truth**: `design_guidelines.json`

The app supports **both Light and Dark themes** using semantic color tokens. All components must use these tokens (never hardcode hex values).

---

## Light Theme

| Token              | Hex       | Primary Usage                            |
| ------------------ | --------- | ---------------------------------------- |
| `background`       | `#F9F7F1` | Main app canvas                          |
| `surface`          | `#FFFFFF` | Cards, modals, input fields              |
| `primary`          | `#5B9BA5` | Primary CTAs, active states, links       |
| `primary_hover`    | `#4A828C` | Hover states on primary elements         |
| `secondary`        | `#8FA99A` | Secondary buttons, accents               |
| `text_primary`     | `#1F2937` | Headings, body text, important labels    |
| `text_secondary`   | `#6B7280` | Captions, hints, secondary text          |
| `accent_sos`       | `#D27D78` | SOS / Panic relief button                |
| `accent_sos_hover` | `#BC6964` | Hover state for SOS button               |
| `border`           | `#E5E7EB` | Card borders, input borders, dividers    |
| `paywall_premium`  | `#D4AF37` | Paywall CTAs, premium badges, highlights |
| `success`          | `#4A9B8C` | Success states, checkmarks               |

---

## Dark Theme

| Token              | Hex       | Primary Usage                            |
| ------------------ | --------- | ---------------------------------------- |
| `background`       | `#0F1115` | Main app canvas                          |
| `surface`          | `#1A1D23` | Cards, modals, input fields              |
| `primary`          | `#6BA8B3` | Primary CTAs, active states, links       |
| `primary_hover`    | `#5A919C` | Hover states on primary elements         |
| `secondary`        | `#7D9688` | Secondary buttons, accents               |
| `text_primary`     | `#F3F4F6` | Headings, body text, important labels    |
| `text_secondary`   | `#9CA3AF` | Captions, hints, secondary text          |
| `accent_sos`       | `#E08A85` | SOS / Panic relief button                |
| `accent_sos_hover` | `#D27D78` | Hover state for SOS button               |
| `border`           | `#2F343C` | Card borders, input borders, dividers    |
| `paywall_premium`  | `#E8C670` | Paywall CTAs, premium badges, highlights |
| `success`          | `#5AB5A3` | Success states, checkmarks               |

---

## Usage Guidelines

- **Always** reference tokens via Tailwind classes or theme object (e.g. `bg-background`, `text-primary`, `border-border`).
- Use `dark:` variant for dark mode overrides when needed.
- The `paywall_premium` color should feel luxurious but not flashy.
- `accent_sos` must remain clearly distinguishable and calming (not alarming).
- Maintain minimum contrast ratios per APCA/WCAG standards in both themes.

**Implementation Tip**: Create a `theme.ts` file that exports both light and dark color objects and use a theme context/provider for runtime switching.
