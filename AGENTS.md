# AGENTS.md

- If using XcodeBuildMCP, use the installed XcodeBuildMCP skill before calling XcodeBuildMCP tools.

# GitHub MCP
- Official remote server is configured in `.grok/config.toml` and `.vscode/mcp.json` (`https://api.githubcopilot.com/mcp/`).
- Use for PRs, issues, code search, Actions — not for shipping laptop `frontend/.env`.
- Public app config for contributors: GitHub Actions **Variables** + `./scripts/sync-env-from-github.sh` (see `CONTRIBUTING.md`).
- Owner refreshes Variables after AWS env changes: `./scripts/push-env-to-github.sh`.
- Authenticate with your own GitHub OAuth/PAT; never commit tokens.

# Expo MCP
- Remote Expo MCP is configured (`https://mcp.expo.dev/mcp`). Authenticate with your Expo account when prompted.
- For local capabilities (simulator screenshot/tap, DevTools): `cd frontend && EXPO_UNSTABLE_MCP_SERVER=1 npx expo start` (requires `expo-mcp` devDependency), or `npm run start:mcp`.
- Prefer Expo MCP for EAS build status, TestFlight crashes/feedback, and Expo docs. Prefer XcodeBuildMCP for local iOS simulator build/run.
- **Always ask the user before creating an Expo/EAS build** (including `eas build`, `npm run build:ios*`, Expo MCP `build_run`, or auto-submit). Checking build status/logs is fine without asking.
- Checklist: `tests/test_list.md`.
