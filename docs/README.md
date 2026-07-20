# Documentation (redirect)

**Canonical product documentation** now lives in one folder:

## → [`../product/`](../product/)

That pack is written so an AI agent (or team) can **recreate ChristCalm in any stack** (Swift, Kotlin, React Native, Flutter, web, etc.).

| Start with | File |
|------------|------|
| Index | [`product/README.md`](../product/README.md) |
| Vision | [`product/01-vision-and-principles.md`](../product/01-vision-and-principles.md) |
| PRD | [`product/02-product-requirements.md`](../product/02-product-requirements.md) |
| Screens | [`product/03-user-flows-and-screens.md`](../product/03-user-flows-and-screens.md) |
| Rebuild order | [`product/11-rebuild-playbook.md`](../product/11-rebuild-playbook.md) |

### Historical / implementation notes (this tree)

Older, stack-specific notes remain under subfolders for the **current** Expo + AWS reference app:

| Folder | Status |
|--------|--------|
| [`product/PRD.md`](product/PRD.md) | Superseded → use `../product/02-product-requirements.md` |
| [`design/`](design/) | Superseded → use `../product/05-design-system.md` + `04-onboarding.md` |
| [`architecture/`](architecture/) | Reference implementation only (not required to rebuild) |
| [`engineering/`](engineering/) | Current-repo testing notes |

Prefer **`product/`** for product truth. Prefer **code** for the live reference implementation when they diverge.
