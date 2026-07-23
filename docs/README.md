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
| [`product/`](product/) | **Canonical** product + architecture pack (docs 01–18). Source of truth for rebuilds. |
| [`design/`](design/) | Design index → Nest/Cooper system, onboarding, screens (points into `product/`). |
| [`architecture/`](architecture/) | Reference-stack notes (Expo + AWS) + links to product architecture docs 12–18. |
| [`engineering/`](engineering/) | Current-repo testing, RevenueCat, e2e for this monorepo. |

### Conflict priority

1. Vision & principles (`product/01`)
2. API + data contracts (`product/07–08`)
3. Screens, onboarding, design (`product/03–05`)
4. Content catalog (`product/06`)
5. Architecture / repo of *this* monorepo (`product/12–18`)
6. Live code last

Prefer **`docs/product/`** for product truth. Prefer **code** for the live reference implementation when they diverge.
