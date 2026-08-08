# Documentation

All product and engineering documentation for ChristCalm lives under **`docs/`**.

## Start here

| Need | Location |
|------|----------|
| **Full product pack (any-stack rebuild)** | [`product/README.md`](product/README.md) |
| Vision & principles | [`product/01-vision-and-principles.md`](product/01-vision-and-principles.md) |
| PRD / requirements | [`product/02-product-requirements.md`](product/02-product-requirements.md) |
| Screens & flows | [`product/03-user-flows-and-screens.md`](product/03-user-flows-and-screens.md) |
| Rebuild playbook | [`product/11-rebuild-playbook.md`](product/11-rebuild-playbook.md) |

## Folder map

| Folder | Role |
|--------|------|
| [`product/`](product/) | **Canonical** product + architecture pack (docs 01–18). Source of truth for rebuilds. Design system & onboarding specs live here (`05-design-system`, `Onboarding-Design-Spec`). |
| [`architecture/`](architecture/) | Reference-stack notes (Expo + AWS) + links to product architecture docs 12–18. |
| [`engineering/`](engineering/) | Current-repo testing, RevenueCat, e2e for this monorepo. |
| [`screenshots/`](screenshots/) | Generated screen catalog PDF (from `scripts/capture-screen-catalog.mjs`). |

### Conflict priority

1. Live code for implemented behavior
2. API + data contracts (`product/07–08`)
3. Screens, onboarding, and design (`product/03–05`)
4. Architecture / operations for this monorepo (`product/12–18`, `architecture/`, `engineering/`)
5. Vision, roadmap, and any-stack alternatives (`product/01–02`, `product/11`)

The product pack defines intent and rebuild guidance; implementation-status statements must match the live code.
