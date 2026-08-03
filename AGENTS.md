# AGENTS.md

## Engineering principles

These apply to all code changes in this repository.

- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.

## Tooling

- If using XcodeBuildMCP, use the installed XcodeBuildMCP skill before calling XcodeBuildMCP tools.

### GitHub MCP

- Official remote server is configured in `.grok/config.toml` and `.vscode/mcp.json` (`https://api.githubcopilot.com/mcp/`).
- Use for PRs, issues, code search, Actions — not for shipping laptop `frontend/.env`.
- Public app config for contributors: GitHub Actions **Variables** + `./scripts/sync-env-from-github.sh` (see `CONTRIBUTING.md`).
- Owner refreshes Variables after AWS env changes: `./scripts/push-env-to-github.sh`.
- Authenticate with your own GitHub OAuth/PAT; never commit tokens.

### Expo MCP

- Remote Expo MCP is configured (`https://mcp.expo.dev/mcp`). Authenticate with your Expo account when prompted.
- For local capabilities (simulator screenshot/tap, DevTools): `cd frontend && EXPO_UNSTABLE_MCP_SERVER=1 npx expo start` (requires `expo-mcp` devDependency), or `npm run start:mcp`.
- Prefer Expo MCP for EAS build status, TestFlight crashes/feedback, and Expo docs. Prefer XcodeBuildMCP for local iOS simulator build/run.
- **Always ask the user before creating an Expo/EAS build** (including `eas build`, `npm run build:ios*`, Expo MCP `build_run`, or auto-submit). Checking build status/logs is fine without asking.
- Checklist: `tests/test_list.md`.
