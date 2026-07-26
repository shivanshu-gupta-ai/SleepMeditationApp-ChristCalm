# AGENTS.md

- If using XcodeBuildMCP, use the installed XcodeBuildMCP skill before calling XcodeBuildMCP tools.

# Expo MCP
- Remote Expo MCP is configured (`https://mcp.expo.dev/mcp`). Authenticate with your Expo account when prompted.
- For local capabilities (simulator screenshot/tap, DevTools): `cd frontend && EXPO_UNSTABLE_MCP_SERVER=1 npx expo start` (requires `expo-mcp` devDependency), or `npm run start:mcp`.
- Prefer Expo MCP for EAS build status, TestFlight crashes/feedback, and Expo docs. Prefer XcodeBuildMCP for local iOS simulator build/run.
- **Always ask the user before creating an Expo/EAS build** (including `eas build`, `npm run build:ios*`, Expo MCP `build_run`, or auto-submit). Checking build status/logs is fine without asking.
- Checklist: `tests/test_list.md`.
